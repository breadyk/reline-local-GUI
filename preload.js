const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    selectModelFolder: () => ipcRenderer.invoke("select-model-folder"),
    selectModelFile: () => ipcRenderer.invoke("select-model-file"),
});
