import React, { useEffect, useReducer, useRef, useState } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { useSetModels } from "~/context/model-provider"
import { JsonConfigsProvider } from "~/context/json-config-provider"
import { nodesReducer } from "~/context/reducer"
import { DEFAULT_NODES, STORAGE_KEY } from "~/constants"
import { CodeSection } from "~/components/code-section"
import { NodesSection } from "~/components/nodes-section"
import { Button } from "~/components/ui/button"
import {Play, Square, LoaderCircle, Download, Github, Package} from "lucide-react"
import { nodesToString, cn } from "~/lib/utils"
import { Progress } from "~/components/ui/progress"
import { DependencyManagerModal } from "~/components/dependency-manager-modal"
import { ModelDownloaderModal } from "~/components/model-downloader-modal";
import { LogDialog } from "~/components/log-dialog"
import {ModeToggle} from "~/components/mode-toggle.tsx";
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

export default function HomePage() {
    const setModels = useSetModels()
    const [showLogModal, setShowLogModal] = useState(false)
    const [logLines, setLogLines] = useState<string[]>([])
    const [showInstallModal, setShowInstallModal] = useState(false)
    const [installLogs, setInstallLogs] = useState<string[]>([])
    const [installing, setInstalling] = useState(false)
    const [dependenciesInstalled, setDependenciesInstalled] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isPlayingRef = useRef(false);
    const lastPipelineEndRef = useRef(0);
    const [showModelDownloader, setShowModelDownloader] = useState(false);
    const [currentFilePath, setCurrentFilePath] = useState(() => {
        if (typeof window === "undefined") return ""
        return localStorage.getItem("reline_current_config") || ""
    })

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
        return () => {
            window.electronAPI.removeListener?.("pipeline-output");
        }
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

        const handleEnd = async ({ success, interrupted }: { success: boolean, interrupted?: boolean }) => {
            const now = Date.now();
            console.log("onPipelineEnd called, success:", success, "interrupted:", interrupted, "timestamp:", now);
            if (now - lastPipelineEndRef.current < 500) {
                console.log("Ignoring duplicate onPipelineEnd call");
                return;
            }
            lastPipelineEndRef.current = now;

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

            if (success && !interrupted && !isPlayingRef.current) {
                const soundEnabled = localStorage.getItem("reline_sound_enabled") === "true";
                if (soundEnabled) {
                    const soundPath = localStorage.getItem("reline_sound_path") || "";
                    const volume = parseInt(localStorage.getItem("reline_sound_volume") || "100", 10);
                    const audioUrl = soundPath ? `file://${soundPath}` : "/fart.mp3";

                    if (audioRef.current) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        audioRef.current = null;
                    }

                    const audio = new Audio(audioUrl);
                    audio.volume = volume / 100;
                    isPlayingRef.current = true;
                    try {
                        await audio.play();
                        audioRef.current = audio;
                        audio.onended = () => {
                            isPlayingRef.current = false;
                            audioRef.current = null;
                        };
                    } catch (err) {
                        console.error("Failed to play sound:", err);
                        isPlayingRef.current = false;
                    }
                }
            }
        }

        window.electronAPI.onPipelineOutput(handleOutput)
        window.electronAPI.onPipelineEnd(handleEnd)

        return () => {
            window.electronAPI.removeListener?.("pipeline-output", handleOutput);
            window.electronAPI.removeListener?.("pipeline-end", handleEnd);
        }
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
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
            isPlayingRef.current = false;
        }
    }

    const handleSave = () => {
        if (currentFilePath) {
            window.electronAPI.saveJsonFile(currentFilePath, nodesToString(nodes))
            toast.success("Saved!")

        } else {
            handleSaveAs()
        }
    }

    const handleSaveAs = async () => {
        const result = await window.electronAPI.selectSaveJsonFile()
        if (result) {
            window.electronAPI.saveJsonFile(result, nodesToString(nodes))
            setCurrentFilePath(result)
            toast.success("Saved!")

        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (showLogModal || showInstallModal || showModelDownloader) {
                return
            }

            if (event.ctrlKey && (event.key === 's' || event.key === 'ы') && !event.shiftKey) {
                event.preventDefault()
                handleSave()
            }

            if (event.ctrlKey && event.shiftKey && (event.key === 'S' || event.key === 'Ы')) {
                event.preventDefault()
                handleSaveAs()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [showLogModal, showInstallModal, showModelDownloader, currentFilePath, nodes])

    return (
        <JsonConfigsProvider>
            <main className="h-screen flex flex-col">
                <header className="p-5 pl-5 pr-7 flex justify-between items-center">
                    <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                        Reline Local GUI
                    </h1>
                    <div className="flex gap-2">
                        <ModeToggle/>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowModelDownloader(true)}
                            title="Download models"
                        >
                            <Download />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowInstallModal(true)}
                            title="Install dependencies"
                        >
                            <Package/>
                        </Button>
                    </div>
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

                <footer className="p-5 pr-7">
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

                        <div className="flex items-center gap-3">
                            <div className="text-muted-foreground text-sm">v1.0.0</div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.electronAPI.openExternal("https://github.com/breadyk/reline-local-GUI")}
                                title="GitHub"
                            >
                                <Github/>
                            </Button>
                        </div>

                    </div>
                </footer>

                <LogDialog open={showLogModal} onClose={() => setShowLogModal(false)} logLines={logLines}/>
                <DependencyManagerModal
                    open={showInstallModal}
                    onClose={() => setShowInstallModal(false)}
                    onCloseWithCheck={checkDependencies}
                />
                <ModelDownloaderModal
                    open={showModelDownloader}
                    onClose={() => setShowModelDownloader(false)}
                />
            </main>
            <Toaster position="top-center" duration={2000}/>
        </JsonConfigsProvider>
    )
}