import { useEffect, useReducer, useRef, useState } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { useSetModels } from "~/context/model-provider"
import { nodesReducer } from "~/context/reducer"
import { DEFAULT_NODES, STORAGE_KEY } from "~/constants"
import { CodeSection } from "~/components/code-section"
import { NodesSection } from "~/components/nodes-section"
import { Button } from "~/components/ui/button"
import { Play, Square, LoaderCircle, Download } from "lucide-react"
import { nodesToString, cn } from "~/lib/utils"
import { Progress } from "~/components/ui/progress"
import { DependencyManagerModal } from "~/components/dependency-manager-modal"
import { LogDialog } from "~/components/log-dialog"
import { Dialog } from "~/components/ui/dialog"

export default function HomePage() {
    const setModels = useSetModels()
    const [showLogModal, setShowLogModal] = useState(false)
    const [logLines, setLogLines] = useState<string[]>([])
    const [showInstallModal, setShowInstallModal] = useState(false)
    const [installLogs, setInstallLogs] = useState<string[]>([])
    const [installing, setInstalling] = useState(false)
    const [dependenciesInstalled, setDependenciesInstalled] = useState(false)

    const checkDependencies = async () => {
        try {
            const { uv, venv } = await window.electronAPI.checkDependencies()
            setDependenciesInstalled(uv && venv)
        } catch (err) {
            console.error("Error checking dependencies:", err)
            setDependenciesInstalled(false)
        }
    }

    useEffect(() => {
        window.electronAPI.onPipelineOutput((data: string) => {
            setInstallLogs((prev) => [...prev, ...data.trim().split("\n")])
        })
    }, [])

    useEffect(() => {
        checkDependencies()
    }, [])

    useEffect(() => {
        if (!isRunning) {
            setProgressText(dependenciesInstalled ? "Ready to go!" : "Install dependencies")
        }
    }, [dependenciesInstalled])

    const getInitialData = () => {
        if (typeof window === "undefined") return DEFAULT_NODES
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : DEFAULT_NODES
    }

    const [nodes, dispatch] = useReducer(nodesReducer, getInitialData())
    const [isRunning, setIsRunning] = useState(false)
    const [progressText, setProgressText] = useState(dependenciesInstalled ? "Ready to go!" : "Install dependencies")
    const outputRef = useRef("")
    const [progressPercent, setProgressPercent] = useState(0)

    useEffect(() => {
        async function loadInitialModels() {
            const savedModels = localStorage.getItem("reline_models");
            if (savedModels) {
                const { folderPath } = JSON.parse(savedModels);
                if (folderPath) {
                    try {
                        const result = await window.electronAPI.loadModelsFromFolder(folderPath);
                        if (result && result.models) {
                            setModels({ folderPath: result.folderPath, models: result.models });
                        }
                    } catch (err) {
                        console.error(`Failed to load models from ${folderPath}`, err);
                    }
                }
            }
        }

        loadInitialModels();
    }, []);

    useEffect(() => {
        if (!isRunning) return

        const handleOutput = (data: string) => {
            outputRef.current += data
            const newLines = data.trim().split("\n")

            setLogLines((prev) => {
                const combined = [...prev, ...newLines]
                return combined.slice(-30)
            })

            const lastLine = newLines.at(-1)?.trim()
            if (!lastLine) return

            const match = lastLine.match(
                /(\d+)%\|[^\|]*\|\s+(\d+\/\d+)\s+(\[.+\])/,
            )
            if (match) {
                const [, percent, steps, timing] = match
                setProgressText(`${percent}% ${steps} ${timing}`)
                setProgressPercent(Number(percent))
            } else {
                setProgressText(lastLine)
            }
        }

        const handleEnd = ({
                               success,
                               interrupted,
                           }: {
            success: boolean
            interrupted?: boolean
        }) => {
            setIsRunning(false)

            if (interrupted) {
                setProgressText("⛔ Interrupted")
            } else if (!success) {
                setProgressText("❌ Error")
                setLogLines((prev) => [...prev])
            } else {
                setProgressText("✅ Complete")
                setProgressPercent(100)
            }
        }

        window.electronAPI.onPipelineOutput(handleOutput)
        window.electronAPI.onPipelineEnd(handleEnd)
    }, [isRunning])

    const handleStart = async () => {
        if (!dependenciesInstalled) {
            setShowInstallModal(true)
            return
        }
        try {
            const json = JSON.parse(nodesToString(nodes))
            await window.electronAPI.runPythonPipeline(json)
            outputRef.current = ""
            setProgressText("Launching...")
            setIsRunning(true)
        } catch (err) {
            console.error(err)
        }
    }

    const handleStop = () => {
        window.electronAPI.stopPythonPipeline()
        setProgressText("⛔ Interrupted")
        setIsRunning(false)
    }

    return (
        <main className="h-screen flex flex-col">
            <header className="p-5 flex justify-between items-center">
                <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
                    Reline Local GUI
                </h1>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowInstallModal(true)}
                    title="Install dependencies"
                >
                    <Download className="h-5 w-5" />
                </Button>
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
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            title={isRunning ? "Running..." : dependenciesInstalled ? "Start Reline" : "Dependencies required"}
                            className={cn(
                                "border-green-500 text-green-600 bg-green-500/10 hover:bg-green-500/20",
                                isRunning &&
                                "border-yellow-500 text-yellow-600 bg-yellow-500/10 hover:bg-yellow-500/20 animate-spin-once",
                                !dependenciesInstalled && !isRunning &&
                                "border-gray-500 text-gray-600 bg-gray-500/10 hover:bg-gray-500/20 opacity-50 cursor-not-allowed"
                            )}
                            onClick={handleStart}
                            disabled={isRunning || !dependenciesInstalled}
                        >
                            {isRunning ? (
                                <LoaderCircle className="animate-spin" />
                            ) : (
                                <Play className={cn(dependenciesInstalled ? "text-green-600" : "text-gray-600")} />
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            title="Stop Reline"
                            onClick={handleStop}
                            disabled={!isRunning}
                            className={cn(
                                "border-neutral-500 text-neutral-500 bg-neutral-500/10 hover:bg-neutral-500/20",
                                isRunning &&
                                "border-red-500 text-red-600 bg-red-500/10 hover:bg-red-500/20",
                            )}
                        >
                            <Square
                                className={cn(isRunning ? "text-red-600" : "text-neutral-500")}
                            />
                        </Button>

                        <Progress value={progressPercent} className="h-2 w-48" />
                        <div className="ml-4 text-sm text-muted-foreground min-w-[200px] truncate">
                            {progressText}
                            {progressText === "❌ Error" && (
                                <Button
                                    size="sm"
                                    variant="link"
                                    className="text-red-500 underline ml-2"
                                    onClick={() => setShowLogModal(true)}
                                >
                                    Show Logs
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="text-muted-foreground text-sm">dev-build v-0.9.1</div>
                </div>
            </footer>

            <LogDialog open={showLogModal} onClose={() => setShowLogModal(false)} logLines={logLines} />
            <DependencyManagerModal
                open={showInstallModal}
                onClose={() => setShowInstallModal(false)}
                onCloseWithCheck={checkDependencies}
            />
        </main>
    )
}