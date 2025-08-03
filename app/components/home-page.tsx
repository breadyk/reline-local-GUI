import { useEffect, useReducer, useRef, useState } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { useSetModels } from "~/context/model-provider"
import { nodesReducer } from "~/context/reducer"
import { DEFAULT_NODES, STORAGE_KEY } from "~/constants"
import { CodeSection } from "~/components/code-section"
import { NodesSection } from "~/components/nodes-section"
import { Button, buttonVariants } from "~/components/ui/button"
import { Play, Square, LoaderCircle } from "lucide-react"
import { nodesToString } from "~/lib/utils"
import { cn } from "~/lib/utils"
import { Progress } from "~/components/ui/progress"

export default function HomePage() {
    const setModels = useSetModels()
    const [showLogModal, setShowLogModal] = useState(false)
    const [logLines, setLogLines] = useState<string[]>([])

    const getInitialData = () => {
        if (typeof window === "undefined") return DEFAULT_NODES
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : DEFAULT_NODES
    }

    const [nodes, dispatch] = useReducer(nodesReducer, getInitialData())
    const [isRunning, setIsRunning] = useState(false)
    const [progressText, setProgressText] = useState("")
    const outputRef = useRef("")

    useEffect(() => {
        setModels(["model-A", "model-B"])
    }, [setModels])

    const [progressPercent, setProgressPercent] = useState(0)

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

            const match = lastLine.match(/(\d+)%\|[^\|]*\|\s+(\d+\/\d+)\s+(\[.+\])/)
            if (match) {
                const [, percent, steps, timing] = match
                setProgressText(`${percent}% ${steps} ${timing}`)
                setProgressPercent(Number(percent))
            } else {
                setProgressText(lastLine)
            }
        }



        const handleEnd = ({ success, interrupted }: { success: boolean, interrupted?: boolean }) => {
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
            <header className="p-5">
                <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Reline Local GUI</h1>
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
                            title={isRunning ? "Running..." : "Start Reline"}
                            className={cn(
                                "border-green-500 text-green-600 bg-green-500/10 hover:bg-green-500/20",
                                isRunning && "border-yellow-500 text-yellow-600 bg-yellow-500/10 hover:bg-yellow-500/20 animate-spin-once"
                            )}
                            onClick={handleStart}
                            disabled={isRunning}
                        >
                            {isRunning ? <LoaderCircle className="animate-spin" /> : <Play className="text-green-600" />}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            title="Stop Reline"
                            onClick={handleStop}
                            disabled={!isRunning}
                            className={cn(
                                "border-neutral-500 text-neutral-500 bg-neutral-500/10 hover:bg-neutral-500/20",
                                isRunning && "border-red-500 text-red-600 bg-red-500/10 hover:bg-red-500/20"
                            )}
                        >
                            <Square className={cn(isRunning ? "text-red-600" : "text-neutral-500")} />
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

                    <div className="text-muted-foreground text-sm">dev-build-v-0.7.0</div>
                </div>
            </footer>
            {showLogModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-border">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border bg-zinc-100 dark:bg-zinc-800">
                            <h2 className="text-lg font-semibold">Error Logs</h2>
                        </div>

                        {/* Log content */}
                        <div className="flex-1 overflow-auto p-4 text-sm text-muted-foreground whitespace-pre-wrap break-words bg-white dark:bg-zinc-900">
                            {logLines.join("\n")}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-border bg-zinc-100 dark:bg-zinc-800 flex justify-end">
                            <Button variant="outline" onClick={() => setShowLogModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    )
}
