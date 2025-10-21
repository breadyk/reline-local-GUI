import {useEffect, useState} from "react";
import {Button} from "~/components/ui/button";
import {Download, FolderOpen, LoaderCircle, Trash, X} from "lucide-react";
import {ModalBase} from "~/components/ui/modal-base";
import {ScrollArea} from "~/components/ui/scroll-area";
import {Progress} from "~/components/ui/progress";
import {Input} from "~/components/ui/input";
import {useModels, useSetModels} from "~/context/model-provider";
import {cn} from "~/lib/utils";
import { ToastProvider, ToastViewport } from "~/components/ui/toast";
import {toast} from "sonner";

export function ModelDownloaderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { folderPath, models } = useModels();
    const setModelsData = useSetModels();
    const [modelsList, setModelsList] = useState<{ filename: string; url: string }[]>([]);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isBusy, setIsBusy] = useState(false);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const list = await window.electronAPI.getModelsList();
                setModelsList(list);
            } catch (err) {
                console.error("Failed to fetch models list:", err);
                setModelsList([]);
                if (err.message.includes("No internet connection")) {
                    toast.error("No internet connection. Please check your network and try again.")
                } else {
                    toast.error("Failed to load models list. Please try again later.")
                }
            }
        };
        if (open) {
            fetchModels();
        }
    }, [open]);

    useEffect(() => {
        return window.electronAPI.onDownloadProgress((data: { filename: string; progress: number }) => {
            if (data.filename === downloading) {
                setProgress(data.progress);
            }
        });
    }, [downloading]);

    const handleChooseFolder = async () => {
        const result = await window.electronAPI.selectModelFolder();
        if (result) {
            setModelsData({ folderPath: result.folderPath, models: result.models });
        }
    };

    const handleDownload = async (filename: string, url: string) => {
        setDownloading(filename);
        setProgress(0);
        setIsBusy(true);
        try {
            if (!folderPath) {
                toast.error("Select model folder and try again.");
                setIsBusy(false);
                setDownloading(null);
                return;
            }
            await window.electronAPI.downloadModel({ url, filename, targetDir: folderPath });
            const updated = await window.electronAPI.loadModelsFromFolder(folderPath);
            if (updated) {
                setModelsData(updated);
            }
        } catch (err) {
            console.error("Download error:", err);
            toast.error("Failed to download model. Please try again.")
        } finally {
            setDownloading(null);
            setIsBusy(false);
        }
    };

    const handleDelete = async (modelName: string) => {
        setIsBusy(true);
        try {
            await window.electronAPI.deleteModel({ folderPath, modelName });
            const updated = await window.electronAPI.loadModelsFromFolder(folderPath);
            if (updated) {
                setModelsData(updated);
            }
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete model. Please try again.")

        } finally {
            setIsBusy(false);
        }
    };

    const handleClose = () => {
        if (isBusy) return;
        onClose();
    };

    const strippedModels = models.map(m => m.replace(/\.(pth|safetensors)$/, ""));

    return (
        <ToastProvider>
            <ModalBase open={open} onClose={handleClose} className="w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Download models</h2>
                    <Button variant="ghost" size="icon" onClick={handleClose} disabled={isBusy}>
                        <X />
                    </Button>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <Input readOnly value={folderPath || "No folder selected"} className="flex-1" />
                        <Button variant="outline" size="icon" onClick={handleChooseFolder} disabled={isBusy}>
                            <FolderOpen />
                        </Button>
                    </div>
                    <ScrollArea className="h-96 w-full rounded-md border">
                        <div className="p-4 space-y-2">
                            {modelsList.length === 0 ? (
                                <div className="text-muted-foreground text-center">Loading models...</div>
                            ) : (
                                modelsList.map((item) => {
                                    const modelName = item.filename.replace(/\.(tar\.xz|pth|safetensors)$/, "");
                                    const isInstalled = strippedModels.includes(modelName);
                                    const isDownloading = downloading === item.filename;
                                    return (
                                        <div
                                            key={item.filename}
                                            className={cn(
                                                "border rounded-lg p-3 flex items-center justify-between bg-background",
                                                isDownloading && "animate-pulse",
                                            )}
                                        >
                                            <span className="font-semibold text-foreground w-1/3 truncate">{modelName}</span>
                                            <Progress
                                                value={isDownloading ? progress : isInstalled ? 100 : 0}
                                                className="w-1/3 mx-4 h-2"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    isInstalled
                                                        ? handleDelete(modelName)
                                                        : handleDownload(item.filename, item.url)
                                                }
                                                className="w-20 justify-center"
                                            >
                                                {isDownloading ? (
                                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                                ) : isInstalled ? (
                                                    <Trash className="w-4 h-4" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="px-4 py-3 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={handleClose} disabled={isBusy}>
                        Close
                    </Button>
                </div>
            </ModalBase>
            <ToastViewport />
        </ToastProvider>
    );
}