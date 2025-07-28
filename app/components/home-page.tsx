import React, { useReducer } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { useSetModels } from "~/context/model-provider"
import { nodesReducer } from "~/context/reducer"
import { DEFAULT_NODES, STORAGE_KEY } from "~/constants"
import { CodeSection } from "~/components/code-section"
import { NodesSection } from "~/components/nodes-section"

export default function HomePage() {
  const setModels = useSetModels()

  const getInitialData = () => {
    if (typeof window === "undefined") {
      return DEFAULT_NODES
    }

    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return DEFAULT_NODES
  }

  const [nodes, dispatch] = useReducer(nodesReducer, getInitialData())

  React.useEffect(() => {
      setModels(["model-A", "model-B"])
  }, [setModels])

  return (
      <main className="h-screen flex flex-col">

        <header className="p-5">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Reline GUI</h1>
        </header>

        <div className="flex-1 overflow-hidden px-5">
          <div className="grid grid-cols-2 gap-x-5 h-full">
            <NodesContext.Provider value={nodes}>
              <NodesDispatchContext.Provider value={dispatch}>
                <div className="overflow-y-auto pr-2">
                  <NodesSection />
                </div>
                <div className="overflow-y-auto pr-2">
                  <CodeSection />
                </div>
              </NodesDispatchContext.Provider>
            </NodesContext.Provider>
          </div>
        </div>


        <footer className="p-5 border-t border-border">
          <div className="flex justify-between items-center">
            <label>абубебе</label>

            <div className="text-muted-foreground text-sm ">dev-build-0.0.1</div>
          </div>
        </footer>
      </main>
    )
  }
