import { createContext, useState, useEffect, ReactNode, useContext } from "react";
const JSON_CONFIGS_STORAGE_KEY = "reline_json_configs";

export const JsonConfigsContext = createContext<{ folderPath: string; files: string[] }>({ folderPath: "", files: [] });
export const SetJsonConfigsContext = createContext<(data: { folderPath: string; files: string[] }) => void>(() => {});

export function useJsonConfigs() {
    return useContext(JsonConfigsContext);
}

export function useSetJsonConfigs() {
    return useContext(SetJsonConfigsContext);
}

export function JsonConfigsProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<{ folderPath: string; files: string[] }>(() => {
        const saved = localStorage.getItem(JSON_CONFIGS_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { folderPath: parsed.folderPath || "", files: [] };
            } catch (err) {
                console.error("Failed to parse reline_json_configs from localStorage:", err);
            }
        }
        return { folderPath: "", files: [] };
    });

    useEffect(() => {
        if (data.folderPath) {
            window.electronAPI.loadJsonFilesFromFolder(data.folderPath)
                .then((files) => {
                    if (files && Array.isArray(files)) {
                        setData((prev) => ({ ...prev, files }));
                    } else {
                        setData((prev) => ({ ...prev, files: [] }));
                    }
                })
                .catch((err) => {
                    console.error("Failed to load JSON files:", err);
                    setData((prev) => ({ ...prev, files: [] }));
                });
        }
    }, [data.folderPath]);

    const setJsonData = (newData: { folderPath: string; files: string[] }) => {
        localStorage.setItem(JSON_CONFIGS_STORAGE_KEY, JSON.stringify({ folderPath: newData.folderPath }));
        setData(newData);
    };

    return (
        <JsonConfigsContext.Provider value={data}>
            <SetJsonConfigsContext.Provider value={setJsonData}>{children}</SetJsonConfigsContext.Provider>
        </JsonConfigsContext.Provider>
    );
}