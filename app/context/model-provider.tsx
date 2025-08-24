import { createContext, useState, useContext, useEffect } from "react";

const MODELS_STORAGE_KEY = "reline_models";

export const ModelsContext = createContext<{ folderPath: string; models: string[] }>({ folderPath: "", models: [] });
export const SetModelsContext = createContext<(data: { folderPath: string; models: string[] }) => void>(() => {});

export function useModels() {
  return useContext(ModelsContext);
}

export function useSetModels() {
  return useContext(SetModelsContext);
}

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [modelsData, _setModelsData] = useState<{ folderPath: string; models: string[] }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(MODELS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object" && "folderPath" in parsed && Array.isArray(parsed.models)) {
            return { folderPath: parsed.folderPath || "", models: parsed.models };
          }
        } catch (err) {
          console.error("Failed to parse reline_models from localStorage:", err);
        }
      }
    }
    return { folderPath: "", models: [] };
  });

  const setModelsData = (data: { folderPath: string; models: string[] }) => {
    localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(data));
    _setModelsData(data);
  };

  return (
      <ModelsContext.Provider value={modelsData}>
        <SetModelsContext.Provider value={setModelsData}>{children}</SetModelsContext.Provider>
      </ModelsContext.Provider>
  );
}