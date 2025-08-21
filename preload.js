const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    selectModelFolder: () => ipcRenderer.invoke("select-model-folder"),
    selectModelFile: () => ipcRenderer.invoke("select-model-file"),
    selectFolderPath: () => ipcRenderer.invoke("select-folder-path"),
    runPythonPipeline: (jsonData) => ipcRenderer.invoke("run-python-pipeline", jsonData),
    stopPythonPipeline: () => ipcRenderer.invoke("stop-python-pipeline"),
    onPipelineOutput: (callback) => ipcRenderer.on("pipeline-output", (_event, data) => callback(data)),
    onPipelineEnd: (callback) => ipcRenderer.once("pipeline-end", (_event, data) => callback(data)),
    installDependency: (id) => ipcRenderer.invoke("install-dependency", id),
    clearUVCache: () => ipcRenderer.invoke("clear-uv-cache"),
    checkDependencies: () => ipcRenderer.invoke("check-dependencies"),
    deleteVenv: () => ipcRenderer.invoke("delete-venv"),
    getVenvSize: () => ipcRenderer.invoke("get-venv-size"),
    checkGPU: () => ipcRenderer.invoke("check-gpu"),
});
