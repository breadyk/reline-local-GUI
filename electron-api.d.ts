export {};

declare global {
    interface Window {
        electronAPI: {
            // === Dependencies ===
            checkDependencies: () => Promise<{
                uv: boolean;
                venv: boolean;
            }>;
            clearUVCache: () => Promise<void>;
            checkUVCache: () => Promise<boolean>;
            checkUVPipFreeze: () => Promise<{
                packages: { name: string; version: string }[];
                error: string | null;
            }>;

            // === Venv ===
            deleteVenv: () => Promise<void>;
            getVenvSize: () => Promise<string>;

            // === Installations ===
            installDependency: (id: string) => Promise<void>;

            // === GPU ===
            checkGPU: () => Promise<boolean>;

            // === Models ===
            selectModelFolder: () => Promise<{
                folderPath: string;
                models: string[];
            } | null>;
            loadModelsFromFolder: (
                folderPath: string
            ) => Promise<{
                folderPath: string;
                models: string[];
            } | null>;
            selectModelFile: () => Promise<string | null>;
            selectFolderPath: () => Promise<string | null>;
            downloadModel: (args: {
                url: string;
                filename: string;
                targetDir: string;
            }) => Promise<boolean>;
            deleteModel: (args: {
                folderPath: string;
                modelName: string;
            }) => Promise<void>;

            // === JSON ===
            selectJsonFile: () => Promise<string | null>;
            loadJsonFilesFromFolder: (folderPath: string) => Promise<string[] | null>;
            readJsonFile: (filePath: string) => Promise<string | null>;
            saveJsonFile: (filePath: string, content: string) => Promise<void>;
            selectSaveJsonFile: () => Promise<string | null>;

            // === Pipeline ===
            runPythonPipeline: (
                jsonData: any
            ) => Promise<{ started: boolean }>;
            stopPythonPipeline: () => Promise<void>;

            // === Audio ===
            selectAudioFile: () => Promise<string | null>;
            getDefaultSoundPath: () => Promise<string | null>;

            // === Events ===
            onPipelineOutput: (cb: (data: string) => void) => void;
            onPipelineEnd: (
                cb: (result: { success: boolean; interrupted: boolean }) => void
            ) => void;
            onDownloadProgress: (
                cb: (data: { filename: string; progress: number }) => void
            ) => void;
            removeListener: (channel: string, cb?: (...args: any[]) => void) => void;

            // === Other ===
            openExternal: (url: string) => void;
            openFolder: (folderPath: string) => void;
        };
    }
}
