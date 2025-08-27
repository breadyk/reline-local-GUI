const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

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
        icon: path.join(__dirname, "app", "public",  "favicon.png"),
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
        // Strip ANSI escape codes
        const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
        // Parse standard pip freeze format (name==version)
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
    const modelFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith(".pth")).map(f => f.replace(/\.pth$/, ''));
    return { folderPath, models: modelFiles };
});

ipcMain.handle("load-models-from-folder", async (event, folderPath) => {
    if (!fs.existsSync(folderPath)) return null;
    const modelFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith(".pth")).map(f => f.replace(/\.pth$/, ''));
    return { folderPath, models: modelFiles };
});

ipcMain.handle("select-model-file", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Model Files", extensions: ["pth"] }],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.handle("select-folder-path", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
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