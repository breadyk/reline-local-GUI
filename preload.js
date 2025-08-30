const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    selectModelFolder: () => ipcRenderer.invoke("select-model-folder"),
    selectModelFile: () => ipcRenderer.invoke("select-model-file"),
    selectFolderPath: () => ipcRenderer.invoke("select-folder-path"),
    selectJsonFile: () => ipcRenderer.invoke("select-json-file"),
    loadJsonFilesFromFolder: (folderPath) => ipcRenderer.invoke("load-json-files-from-folder", folderPath),
    readJsonFile: (filePath) => ipcRenderer.invoke("read-json-file", filePath),
    saveJsonFile: (filePath, content) => ipcRenderer.invoke("save-json-file", filePath, content),
    selectSaveJsonFile: () => ipcRenderer.invoke("select-save-json-file"),
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
    checkUVPipFreeze: () => ipcRenderer.invoke("check-uv-pip-freeze"),
    openExternal: (url) => ipcRenderer.invoke("open-external", url),
    selectAudioFile: () => ipcRenderer.invoke("select-audio-file"),
    downloadModel: (args) => ipcRenderer.invoke("download-model", args),
    deleteModel: (args) => ipcRenderer.invoke("delete-model", args),
    loadModelsFromFolder: (folderPath) => ipcRenderer.invoke("load-models-from-folder", folderPath),
    onDownloadProgress: (callback) => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on("download-progress", listener);
        return () => ipcRenderer.removeListener("download-progress", listener);
    },
    getModelsList: () => ipcRenderer.invoke("get-models-list"),
});