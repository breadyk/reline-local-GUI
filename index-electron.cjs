const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const https = require("https");

const isDev = !app.isPackaged;

// ==== Paths & Constants ====
const relineDir = path.join(__dirname, "reline");
const uvBinDir = path.join(relineDir, "uv");
const uvBinaryPath = path.join(uvBinDir, os.platform() === "win32" ? "uv.exe" : "uv");

let currentChild = null;
let manuallyStopped = false;

// ==== Helpers ====
function runCommand(command, args = [], options = {}, onData = () => {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { shell: false, ...options });
        let output = "";
        child.stdout.on("data", (data) => {
            output += data.toString();
            onData(data.toString());
        });
        child.stderr.on("data", (data) => {
            output += data.toString();
            onData(data.toString());
        });
        child.on("close", (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(`${command} exited with code ${code}`));
        });
    });
}

function getPlatformName() {
    const platform = os.platform();
    if (platform === "win32") return "win";
    if (platform === "darwin") return "mac";
    if (platform === "linux") return "linux";
    throw new Error(`Unsupported platform: ${platform}`);
}

async function ensureUVBinary() {
    if (fs.existsSync(uvBinaryPath)) return;

    const platformName = getPlatformName();
    const srcPath = path.join(relineDir, "uv", platformName, os.platform() === "win32" ? "uv.exe" : "uv");

    if (!fs.existsSync(srcPath)) {
        throw new Error(`UV binary not found for platform: ${platformName}`);
    }

    if (!fs.existsSync(uvBinDir)) fs.mkdirSync(uvBinDir, { recursive: true });
    fs.copyFileSync(srcPath, uvBinaryPath);
    fs.chmodSync(uvBinaryPath, 0o755);
}

function hasNvidiaGPU() {
    try {
        if (os.platform() === "win32") {
            const out = require("child_process").execSync("wmic path win32_VideoController get name").toString();
            return out.toLowerCase().includes("nvidia");
        } else if (os.platform() === "linux") {
            const out = require("child_process").execSync("lspci").toString();
            return out.toLowerCase().includes("nvidia");
        } else if (os.platform() === "darwin") {
            return false;
        }
    } catch {
        return false;
    }
    return false;
}

function getDirectorySize(dirPath) {
    let total = 0;
    const walk = (dir) => {
        fs.readdirSync(dir).forEach((f) => {
            const fullPath = path.join(dir, f);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) walk(fullPath);
            else total += stat.size;
        });
    };
    walk(dirPath);
    return total;
}

// ==== Create Window ====
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        title: "Reline GUI",
        icon: path.join(__dirname, "public",  "favicon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    Menu.setApplicationMenu(null);

    if (isDev) win.loadURL("http://localhost:5173");
    else win.loadFile("./dist/index.html");
};

// ==== IPC Handlers ====

// UV Management
ipcMain.handle("check-dependencies", () => ({
    uv: fs.existsSync(uvBinaryPath),
    venv: fs.existsSync(path.join(relineDir, ".venv")),
}));

ipcMain.handle("clear-uv-cache", async () => {
    await runCommand(uvBinaryPath, ["cache", "clean"]);
});

ipcMain.handle("check-uv-cache", async () => {
    try {
        let cacheDir = "";
        await runCommand(uvBinaryPath, ["cache", "dir"], {}, (data) => {
            cacheDir += data;
        });
        return fs.existsSync(cacheDir.trim());
    } catch {
        return false;
    }
});

ipcMain.handle("check-uv-pip-freeze", async (event) => {
    try {
        const venvPath = path.join(relineDir, ".venv");
        if (!fs.existsSync(venvPath)) {
            return { packages: [], error: "Virtual environment not found." };
        }
        const uv = uvBinaryPath;
        const output = await runCommand(uv, ["pip", "freeze"], { cwd: relineDir });
        const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
        const packages = cleanOutput
            .split("\n")
            .filter(line => line.trim() && !line.startsWith("#"))
            .map(line => {
                const [name, version] = line.split("==");
                return { name: name?.trim() || "unknown", version: version?.trim() || "unknown" };
            })
            .filter(pkg => pkg.name !== "unknown");
        return { packages, error: null };
    } catch (err) {
        return { packages: [], error: err.message };
    }
});

// Venv Management
ipcMain.handle("delete-venv", async () => {
    const venvPath = path.join(relineDir, ".venv");
    if (fs.existsSync(venvPath)) {
        await fs.promises.rm(venvPath, { recursive: true, force: true });
    }
});

ipcMain.handle("get-venv-size", () => {
    const venvPath = path.join(relineDir, ".venv");
    if (!fs.existsSync(venvPath)) return "0 MB";
    return `${(getDirectorySize(venvPath) / (1024 * 1024)).toFixed(1)} MB`;
});

// Dependency Installation
ipcMain.handle("install-dependency", async (event, id) => {
    const log = (data) => event.sender.send("pipeline-output", data);
    try {
        await ensureUVBinary();
        const pipArgs = ["pip", "install"];
        if (id === "python") {
            log("📦 Installing Python 3.12 + venv...");
            await runCommand(uvBinaryPath, ["venv", ".venv"], { cwd: relineDir }, log);
            return;
        }

        if (id === "torch") {
            log("📦 Installing torch (CPU)...");
            await runCommand(uvBinaryPath, [...pipArgs, "torch"], { cwd: relineDir }, log);
            return;
        }

        if (id === "torch-cuda") {
            log("📦 Installing torch (CUDA)...");
            await runCommand(uvBinaryPath, [...pipArgs, "torch", "--index-url", "https://download.pytorch.org/whl/cu126"], { cwd: relineDir }, log);
            return;
        }

        if (id === "reline") {
            log("📦 Installing reline...");
            await runCommand(uvBinaryPath, [...pipArgs, "reline"], { cwd: relineDir }, log);
            return;
        }

        throw new Error(`Unknown dependency ID: ${id}`);
    } catch (err) {
        event.sender.send("pipeline-output", `❌ ${err.message}`);
        throw err;
    }
});

// GPU Check
ipcMain.handle("check-gpu", () => hasNvidiaGPU());

// Model Management
ipcMain.handle("select-model-folder", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths.length) return null;
    const folderPath = result.filePaths[0];
    const modelFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith(".pth") || f.endsWith(".safetensors"));
    return { folderPath, models: modelFiles };
});

ipcMain.handle("load-models-from-folder", async (event, folderPath) => {
    if (!fs.existsSync(folderPath)) return null;
    const modelFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith(".pth") || f.endsWith(".safetensors"));
    return { folderPath, models: modelFiles };
});

ipcMain.handle("select-model-file", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Model Files", extensions: ["pth", "pt", "safetensors"] }],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.handle("select-folder-path", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.handle("download-model", async (event, { url, filename, targetDir }) => {
    const decompress = await import("@xhmikosr/decompress");
    const decompressTarxz = await import("@felipecrs/decompress-tarxz");

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const tempPath = path.join(os.tmpdir(), filename);
    const file = fs.createWriteStream(tempPath);

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                fs.unlinkSync(tempPath);
                return reject(new Error(`Failed to download ${filename}: HTTP ${res.statusCode}`));
            }

            const total = parseInt(res.headers["content-length"] || "0", 10);
            let downloaded = 0;

            res.pipe(file);

            res.on("data", (chunk) => {
                downloaded += chunk.length;
                const progress = total > 0 ? Math.floor((downloaded / total) * 100) : 0;
                event.sender.send("download-progress", { filename, progress });
            });

            file.on("finish", async () => {
                file.close();
                try {
                    if (filename.endsWith(".tar.xz")) {
                        console.log(`Starting extraction of ${filename} to ${tempPath}`);
                        const extractDir = path.join(os.tmpdir(), `extract_${Date.now()}`);
                        fs.mkdirSync(extractDir, { recursive: true });

                        const files = await decompress.default(tempPath, extractDir, {
                            plugins: [decompressTarxz.default()],
                            filter: (file) => file.path.endsWith(".pth") || file.path.endsWith(".safetensors"),
                        });
                        console.log(`Extracted files: ${files.map(f => f.path).join(", ") || "none"}`);

                        const modelFile = files.find((f) => f.path.endsWith(".pth") || f.path.endsWith(".safetensors"));
                        if (!modelFile) {
                            throw new Error(`No valid model file (.pth or .safetensors) found in archive ${filename}`);
                        }

                        const modelName = filename.replace(".tar.xz", "");
                        const ext = path.extname(modelFile.path);
                        const targetPath = path.join(targetDir, `${modelName}${ext}`);
                        const sourcePath = path.join(extractDir, modelFile.path);

                        if (!fs.existsSync(sourcePath)) {
                            throw new Error(`Extracted file ${sourcePath} does not exist`);
                        }

                        console.log(`Moving ${sourcePath} to ${targetPath}`);
                        fs.renameSync(sourcePath, targetPath);

                        fs.rmSync(extractDir, { recursive: true, force: true });
                        fs.unlinkSync(tempPath);
                    } else if (filename.endsWith(".pth") || filename.endsWith(".safetensors")) {
                        const targetPath = path.join(targetDir, filename);
                        console.log(`Moving ${tempPath} to ${targetPath}`);
                        fs.renameSync(tempPath, targetPath);
                    } else {
                        throw new Error(`Unsupported file format: ${filename}`);
                    }
                    resolve(true);
                } catch (err) {
                    console.error(`Error processing ${filename}:`, err);
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                    reject(err);
                }
            });
        }).on("error", (err) => {
            console.error(`Error downloading ${filename}:`, err);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            reject(err);
        });
    });
});

ipcMain.handle("delete-model", async (_event, { folderPath, modelName }) => {
    const extensions = [".pth", ".safetensors"];
    let deleted = false;
    for (const ext of extensions) {
        const modelPath = path.join(folderPath, `${modelName}${ext}`);
        if (fs.existsSync(modelPath)) {
            console.log(`Deleting model: ${modelPath}`);
            fs.unlinkSync(modelPath);
            deleted = true;
        }
    }
    if (!deleted) {
        throw new Error(`Model ${modelName} not found in ${folderPath}`);
    }
});

ipcMain.handle("get-models-list", async () => {
    return new Promise((resolve, reject) => {
        let data = '';
        const req = https.get('https://mdb.yor.ovh/v1/files', (res) => {
            if (res.statusCode !== 200) {
                console.error(`Failed to fetch models list: status ${res.statusCode}`);
                reject(new Error(`Failed to fetch models list: status ${res.statusCode}`));
                return;
            }
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const models = JSON.parse(data);
                    const fixedModels = models.map(model => ({
                        filename: model.filename,
                        url: model.url.replace('https:/', 'https://')
                    }));
                    resolve(fixedModels);
                } catch (err) {
                    console.error('Error parsing models JSON:', err);
                    reject(new Error('Failed to parse models list.'));
                }
            });
        });
        req.on('error', (err) => {
            console.error('Error fetching models list:', err);
            if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.message.includes('network')) {
                reject(new Error('No internet connection. Please check your network and try again.'));
            } else {
                reject(err);
            }
        });
        req.end();
    });
});

//JSON
ipcMain.handle("select-json-file", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "JSON Files", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.handle("load-json-files-from-folder", async (event, folderPath) => {
    if (!fs.existsSync(folderPath)) return null;
    const jsonFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith(".json"));
    return jsonFiles;
});

ipcMain.handle("read-json-file", async (event, filePath) => {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
});

ipcMain.handle("save-json-file", async (event, filePath, content) => {
    fs.writeFileSync(filePath, content);
});

ipcMain.handle("select-save-json-file", async () => {
    const result = await dialog.showSaveDialog({
        filters: [{ name: "JSON Files", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
});

// Pipeline
ipcMain.handle("run-python-pipeline", async (event, jsonData) => {
    const tempPath = path.join(relineDir, "data.json");
    fs.writeFileSync(tempPath, JSON.stringify(jsonData, null, 2));

    const venvPath = path.join(relineDir, ".venv");
    const pythonPath = os.platform() === "win32"
        ? path.join(venvPath, "Scripts", "python.exe")
        : path.join(venvPath, "bin", "python");
    const scriptPath = path.join(relineDir, "main.py");

    currentChild = spawn(pythonPath, [scriptPath], {
        cwd: relineDir,
        windowsHide: true,
        shell: false,
    });

    currentChild.stdout.on("data", (d) => event.sender.send("pipeline-output", d.toString()));
    currentChild.stderr.on("data", (d) => event.sender.send("pipeline-output", d.toString()));

    currentChild.on("close", (code) => {
        console.log("Pipeline closed, code:", code, "timestamp:", Date.now());
        event.sender.send("pipeline-end", { success: code === 0 || manuallyStopped, interrupted: manuallyStopped });
        currentChild = null;
        manuallyStopped = false;
    });

    return { started: true };
});

ipcMain.handle("stop-python-pipeline", () => {
    if (currentChild) {
        manuallyStopped = true;
        currentChild.kill("SIGTERM");
    }
});

// Audio file selection
ipcMain.handle("select-audio-file", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Audio Files", extensions: ["mp3", "wav", "ogg"] }],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

//Other
ipcMain.handle("open-external", async (_event, url) => {
    await shell.openExternal(url);
});

// ==== App Lifecycle ====
app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});