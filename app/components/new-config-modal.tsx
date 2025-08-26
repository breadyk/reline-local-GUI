import { useState, useContext } from "react";
import { ModalBase } from "~/components/ui/modal-base";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useJsonConfigs, useSetJsonConfigs } from "~/context/json-config-provider";
import { NodesDispatchContext } from "~/context/contexts";
import { NodesActionType } from "~/types/actions";
import { stringToNodes } from "~/lib/utils";

export function NewConfigModal({ open, onClose, folderPath, setCurrentFilePath }: {
    open: boolean;
    onClose: () => void;
    folderPath: string;
    setCurrentFilePath: (path: string) => void;
}) {
    const [name, setName] = useState("");
    const [template, setTemplate] = useState("with-template");
    const setJsonConfigs = useSetJsonConfigs();
    const dispatch = useContext(NodesDispatchContext);

    const handleCreate = async () => {
        if (!name.trim() || !folderPath) return;

        let fileName = name.trim();
        if (!fileName.endsWith(".json")) fileName += ".json";

        const fullPath = `${folderPath}/${fileName}`;

        // Дефолтный шаблон
        const defaultTemplate = JSON.stringify([
            {
                "type": "folder_reader",
                "options": {
                    "path": "C:\\raws",
                    "recursive": false,
                    "mode": "gray"
                }
            },
            {
                "type": "upscale",
                "options": {
                    "model": "C:\\models\\4x_DWTP_DS_atdl3.pth",
                    "dtype": "F32",
                    "tiler": "exact",
                    "exact_tiler_size": 600,
                    "allow_cpu_upscale": false
                }
            },
            {
                "type": "sharp",
                "options": {
                    "low_input": 0,
                    "high_input": 255,
                    "gamma": 1,
                    "diapason_white": 1,
                    "diapason_black": -1,
                    "canny": true,
                    "canny_type": "unsharp"
                }
            },
            {
                "type": "halftone",
                "options": {
                    "dot_size": 8,
                    "angle": 0,
                    "dot_type": "circle",
                    "halftone_mode": "gray",
                    "ssaa_filter": "shamming4",
                    "ssaa_scale": 4
                }
            },
            {
                "type": "resize",
                "options": {
                    "filter": "mitchell",
                    "spread": true,
                    "spread_size": 2800,
                    "gamma_correction": false,
                    "width": 2000
                }
            },
            {
                "type": "folder_writer",
                "options": {
                    "path": "C:\\raws\\output",
                    "format": "png"
                }
            }
        ], null, 2);

        const content = template === "with-template" ? defaultTemplate : "[]";

        try {
            // Сохраняем файл
            await window.electronAPI.saveJsonFile(fullPath, content);

            // Обновляем список файлов в контексте
            const newFiles = await window.electronAPI.loadJsonFilesFromFolder(folderPath);
            setJsonConfigs({ folderPath, files: newFiles || [] });

            // Импортируем содержимое в NodesContext
            dispatch({
                type: NodesActionType.IMPORT,
                payload: stringToNodes(content),
            });

            // Устанавливаем текущий файл
            setCurrentFilePath(fullPath);

            // Закрываем модалку
            onClose();
        } catch (err) {
            console.error("Failed to create JSON file:", err);
        }
    };

    return (
        <ModalBase open={open} onClose={onClose}>
            <div className="px-4 py-3 border-b border-border bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Create new file</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X />
                </Button>
            </div>
            <div className="p-4 space-y-4">
                <Label>File name</Label>
                <Input placeholder="Name a file..." value={name} onChange={(e) => setName(e.target.value)} />
                <Label>Template</Label>
                <RadioGroup defaultValue="with-template" onValueChange={setTemplate}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="with-template" id="with-template" />
                        <Label htmlFor="with-template">With default template</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="empty" id="empty" />
                        <Label htmlFor="empty">Empty</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="px-4 py-3 border-t border-border bg-zinc-100 dark:bg-zinc-800 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
            </div>
        </ModalBase>
    );
}