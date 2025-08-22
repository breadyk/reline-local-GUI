import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { X, LoaderCircle, Trash, Download } from "lucide-react";
import { cn } from "~/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { ModalBase } from "~/components/ui/modal-base";
import { PipFreezeModal } from "~/components/pip-freeze-modal";

const DEPENDENCIES = [
    {
        id: "python",
        name: "Python 3.12 + venv",
        size: "25 MB",
        description: "Install UV and create isolated Python environment.",
    },
    {
        id: "torch",
        name: "Torch",
        size: "~1 GB",
        description: "Deep learning framework (CUDA or CPU variant).",
    },
    {
        id: "reline",
        name: "Reline",
        size: "5 MB",
        description: "Core backend module for GUI.",
    },
];

function formatSize(size: string) {
    if (size.toLowerCase().includes("mb")) {
        const num = parseFloat(size);
        if (num > 900) {
            return (num / 1024).toFixed(1) + " GB";
        }
        return num + " MB";
    }
    return size;
}

export function DependencyManagerModal({ open, onClose, onCloseWithCheck }: {
    open: boolean
    onClose: () => void
    onCloseWithCheck?: () => void
}) {
    const [installing, setInstalling] = useState<string | null>(null);
    const [installingAll, setInstallingAll] = useState(false);
    const [finishedDep, setFinishedDep] = useState<string | null>(null);
    const [torchVariant, setTorchVariant] = useState("cpu");
    const [gpuSupported, setGpuSupported] = useState(false);
    const [installed, setInstalled] = useState(false);
    const [venvSize, setVenvSize] = useState("0 MB");
    const [deleting, setDeleting] = useState(false);
    const [showPipFreeze, setShowPipFreeze] = useState(false);
    const [pipFreezeData, setPipFreezeData] = useState<{ packages: { name: string; version: string }[], error: string | null }>({ packages: [], error: null });

    const handleInstall = async (id: string) => {
        console.log(`Starting install for ${id}`);
        setInstalling(id);
        setFinishedDep(null);
        try {
            await window.electronAPI.installDependency(id);
            await new Promise(resolve => setTimeout(resolve, 500));
            setInstalling(null);
            setFinishedDep(id);
            console.log(`Finished installing ${id}, setting finishedDep`);
            const timeout = setTimeout(() => {
                setFinishedDep(null);
                console.log(`Cleared finishedDep for ${id}`);
            }, 1500);
            return () => clearTimeout(timeout);
        } catch (err: any) {
            console.error(`Error installing ${id}:`, err);
            setInstalling(null);
        }
    };

    const installAll = async () => {
        setInstallingAll(true);
        for (const dep of DEPENDENCIES) {
            const depId =
                dep.id === "torch"
                    ? torchVariant === "cuda"
                        ? "torch-cuda"
                        : "torch"
                    : dep.id;
            await handleInstall(depId);
            await new Promise(resolve => setTimeout(resolve, 1700));
        }
        setInstalled(true);
        setInstallingAll(false);
        const size = await window.electronAPI.getVenvSize();
        setVenvSize(size);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await window.electronAPI.deleteVenv();
        setInstalled(false);
        setVenvSize("0 MB");
        setTimeout(() => setDeleting(false), 800);
    };

    const handleCheckDependencies = async () => {
        const result = await window.electronAPI.checkUVPipFreeze();
        setPipFreezeData(result);
        setShowPipFreeze(true);
    };

    const getTorchSize = () =>
        torchVariant === "cuda" ? "~7 GB" : "~1 GB";
    const getTotalSize = () =>
        torchVariant === "cuda" ? "~8.5 GB" : "~1.6 GB";

    useEffect(() => {
        (async () => {
            const supported = await window.electronAPI.checkGPU();
            const cudaAvailable = supported && process.platform !== "darwin";
            setGpuSupported(cudaAvailable);
            if (!cudaAvailable) setTorchVariant("cpu");

            const deps = await window.electronAPI.checkDependencies();
            if (deps.venv) {
                setInstalled(true);
                const size = await window.electronAPI.getVenvSize();
                setVenvSize(size);
            } else {
                setInstalled(false);
                setVenvSize("0 MB");
            }
        })();
    }, []);

    const handleClose = () => {
        if (installing || installingAll || deleting) {
            return;
        }
        onClose();
        if (onCloseWithCheck) {
            onCloseWithCheck();
        }
    };

    return (
        <>
            <ModalBase open={open} onClose={handleClose} className="w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-4 py-3 border-b border-border bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Dependency Manager</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        disabled={!!installing || installingAll || deleting}
                    >
                        <X />
                    </Button>
                </div>

                <div className="px-4 py-3 border-b border-border bg-zinc-50 dark:bg-zinc-800 flex justify-between items-center">
                    <h3 className="font-medium text-base">Packages</h3>
                    <Button
                        disabled={!!installing || installingAll || deleting}
                        onClick={installed ? handleDelete : installAll}
                        className={cn(
                            "flex items-center gap-2 w-[170px] justify-center text-white",
                            installed
                                ? deleting
                                    ? "bg-yellow-500"
                                    : "bg-red-600 hover:bg-red-700"
                                : installingAll
                                    ? "bg-yellow-500"
                                    : "bg-green-600 hover:bg-green-700"
                        )}
                    >
                        {installed ? (
                            deleting ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash className="w-4 h-4" />
                            )
                        ) : installingAll ? (
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        <span>
                            {installed
                                ? deleting
                                    ? "Deleting..."
                                    : "Delete all"
                                : installingAll
                                    ? "Installing..."
                                    : "Install all"}
                        </span>
                        <span className="ml-auto text-xs text-white/80">
                            {installed ? formatSize(venvSize) : getTotalSize()}
                        </span>
                    </Button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {DEPENDENCIES.map((dep) => (
                        <div
                            key={dep.id}
                            className={cn(
                                "border rounded-lg p-4 bg-background transition-colors transition-border duration-200 !animate-none",
                                installing === dep.id &&
                                "!animate-slow-pulse border-yellow-500",
                                finishedDep === dep.id &&
                                "!animate-green-pulse bg-green-100 dark:bg-green-900/30 border-green-500"
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold">{dep.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {dep.description}
                                    </p>
                                </div>
                                {dep.id === "torch" ? (
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-muted-foreground">
                                            {getTorchSize()}
                                        </div>
                                        <Select
                                            value={torchVariant}
                                            onValueChange={setTorchVariant}
                                            disabled={!gpuSupported || !!installing || installingAll}
                                        >
                                            <SelectTrigger className="w-28 h-8 text-xs">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cuda">CUDA</SelectItem>
                                                <SelectItem value="cpu">CPU</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        {dep.size}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 py-3 border-t border-border bg-zinc-100 dark:bg-zinc-800 flex justify-between">
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => window.electronAPI.clearUVCache()}
                            disabled={!!installing || installingAll || deleting}
                        >
                            Clear UV cache
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCheckDependencies}
                            disabled={!!installing || installingAll || deleting}
                        >
                            Check dependencies
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={!!installing || installingAll || deleting}
                    >
                        Close
                    </Button>
                </div>
            </ModalBase>
            <PipFreezeModal
                open={showPipFreeze}
                onClose={() => setShowPipFreeze(false)}
                pipFreezeData={pipFreezeData}
            />
        </>
    );
}
