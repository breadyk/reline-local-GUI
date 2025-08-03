const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require("path")
const fs = require("fs")

const isDev = !app.isPackaged;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        resizeable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');

    } else {
        win.loadFile("./dist/index.html");
    }
};

app.whenReady().then(() => {
  createWindow()

    ipcMain.handle("select-model-folder", async () => {
        const result = await dialog.showOpenDialog({
          properties: ["openDirectory"],
        })

        if (result.canceled || result.filePaths.length === 0) return null

        const folderPath = result.filePaths[0]
        const modelFiles = fs
          .readdirSync(folderPath)
          .filter((file) => file.endsWith(".pth"))

        return {
            folderPath,
            models: modelFiles.map((f) => path.basename(f)),
        }
    })

    ipcMain.handle("select-model-file", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Model Files", extensions: ["pth"] }],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    return result.filePaths[0];
    });

    ipcMain.handle("select-folder-path", async () => {
        const result = await dialog.showOpenDialog({
            properties: ["openDirectory"],
        })

        if (result.canceled || result.filePaths.length === 0) return null

        return result.filePaths[0]
    });

    const { spawn } = require("child_process");

    const os = require("os");

    let currentChild = null
    let manuallyStopped = false

    ipcMain.handle("run-python-pipeline", async (event, jsonData) => {
        const relineDir = path.join(__dirname, "reline")
        const tempPath = path.join(relineDir, "data.json")
        fs.writeFileSync(tempPath, JSON.stringify(jsonData, null, 2))

        const pythonPath = path.join(relineDir, ".venv", "Scripts", "python.exe")
        const scriptPath = path.join(relineDir, "main.py")

        currentChild = spawn(pythonPath, [scriptPath], {
            cwd: relineDir,
            windowsHide: true,
            shell: false,
        })

        currentChild.stdout.on("data", (data) => {
            event.sender.send("pipeline-output", data.toString())
        })

        currentChild.stderr.on("data", (data) => {
            event.sender.send("pipeline-output", data.toString())
        })

        currentChild.on("close", (code) => {
            event.sender.send("pipeline-end", {
                success: code === 0 || manuallyStopped,
                interrupted: manuallyStopped,
            })

            currentChild = null
            manuallyStopped = false
        })

        return { started: true }
    })

    const kill = require("tree-kill")

    ipcMain.handle("stop-python-pipeline", () => {
        if (currentChild) {
            manuallyStopped = true
            currentChild.kill("SIGTERM")
        }
    })


    app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})