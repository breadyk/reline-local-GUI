import { createContext, useState, useContext } from "react"

export const ModelsContext = createContext<string[]>([])
export const SetModelsContext = createContext<(models: string[]) => void>(() => {})

export function useModels() {
  return useContext(ModelsContext)
}

export function useSetModels() {
  return useContext(SetModelsContext)
}

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<string[]>([])

  return (
    <ModelsContext.Provider value={models}>
      <SetModelsContext.Provider value={setModels}>{children}</SetModelsContext.Provider>
    </ModelsContext.Provider>
  )
}
