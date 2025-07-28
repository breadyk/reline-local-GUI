import React, { useReducer } from "react"
import { ModelsContext, NodesContext, NodesDispatchContext } from "~/context/contexts"
import { nodesReducer } from "~/context/reducer"
import { DEFAULT_NODES, STORAGE_KEY } from "~/constants"
import type { ModelFile } from "~/types/api"
import { useLoaderData } from "@remix-run/react"
import { MODELS, MODELS_URL } from "~/constants.server"
import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { CodeSection } from "./code-section"
import { NodesSection } from "./nodes-section"
import { ModeToggle } from "~/components/mode-toggle"

export const loader: LoaderFunction = async () => {
  const modelsList = await fetch(MODELS_URL)
    .then(async (res) => ((await res.json()) as ModelFile[]).map((model) => model.filename.split(".tar")[0]))
    .catch(() => MODELS)
  return { models: modelsList }
}

export const meta: MetaFunction = () => {
  return [{ title: "Reline Configurator" }, { name: "description", content: "Construct config for Colab or Reline package" }]
}

export default function HomePage() {
  const loaderData = useLoaderData<typeof loader>()

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

  return (
    <main className="p-5">
      <div className="flex justify-between">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Reline GUI</h1>
        <ModeToggle />
      </div>
      <div className="grid grid-cols-2 gap-x-5">
        <NodesContext.Provider value={nodes}>
          <NodesDispatchContext.Provider value={dispatch}>
            <ModelsContext.Provider value={loaderData.models}>
              <NodesSection />
              <CodeSection />
            </ModelsContext.Provider>
          </NodesDispatchContext.Provider>
        </NodesContext.Provider>
      </div>
    </main>
  )
}
