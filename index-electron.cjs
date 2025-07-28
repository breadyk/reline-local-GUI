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

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})