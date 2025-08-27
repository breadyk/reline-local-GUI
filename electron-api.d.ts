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

            // === Pipeline ===
            runPythonPipeline: (
                jsonData: any
            ) => Promise<{ started: boolean }>;
            stopPythonPipeline: () => Promise<void>;

            // === Events ===
            onPipelineOutput: (cb: (data: string) => void) => void;
            onPipelineEnd: (
                cb: (result: { success: boolean; interrupted: boolean }) => void
            ) => void;

            openExternal: (url: string) => void;
        };
    }
}
