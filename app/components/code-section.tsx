import React, { useContext, useState, useEffect } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { File, Github, FolderOpen } from "lucide-react"
import { nodesToString, stringToNodes } from "~/lib/utils"
import { useToast } from "~/components/ui/use-toast"
import { Card, CardHeader, CardContent } from "~/components/ui/card"
import { NodesActionType } from "~/types/actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/popover"
import { Button } from "~/components/ui/button"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "~/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "~/lib/utils"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { NewConfigModal } from "~/components/new-config-modal"
import { useJsonConfigs, useSetJsonConfigs } from "~/context/json-config-provider"
import {ScrollArea, ScrollBar} from "~/components/ui/scroll-area"

const CURRENT_CONFIG_KEY = "reline_current_config";
const STORAGE_KEY = "reline_nodes"; // Предполагаем, что это ключ для unsaved nodes из home-page.tsx

function ConfigCombobox({ selectedFile, onSelect }: { selectedFile: string; onSelect: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const { files } = useJsonConfigs();
    const displayValue = selectedFile || "Select config";
    const isPlaceholder = !selectedFile;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", isPlaceholder && "text-muted-foreground font-normal")}
                >
                    {displayValue}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search config files..." />
                    <CommandList>
                        <CommandEmpty>No config files found.</CommandEmpty>
                        <CommandGroup>
                            {files.map((file) => (
                                <CommandItem
                                    key={file}
                                    value={file}
                                    onSelect={() => {
                                        onSelect(file);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedFile === file ? "opacity-100" : "opacity-0")} />
                                    {file}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function CodeSection() {
    const nodes = useContext(NodesContext)
    const dispatch = useContext(NodesDispatchContext)
    const { folderPath, files } = useJsonConfigs()
    const setJsonConfigs = useSetJsonConfigs()
    const [currentFilePath, setCurrentFilePath] = useState(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem(CURRENT_CONFIG_KEY) || "";
    });
    const [showNewModal, setShowNewModal] = useState(false)
    const { toast } = useToast()

    const selectedFile = currentFilePath && currentFilePath.startsWith(`${folderPath}/`)
        ? currentFilePath.slice(folderPath.length + 1)
        : ""

    // Сохранение currentFilePath в localStorage при изменении
    useEffect(() => {
        localStorage.setItem(CURRENT_CONFIG_KEY, currentFilePath);
    }, [currentFilePath]);

    // Загрузка nodes из сохраненного currentFilePath при монтировании
    useEffect(() => {
        const loadInitialConfig = async () => {
            if (currentFilePath) {
                try {
                    const text = await window.electronAPI.readJsonFile(currentFilePath);
                    if (text) {
                        dispatch({
                            type: NodesActionType.IMPORT,
                            payload: stringToNodes(text),
                        });
                    } else {
                        throw new Error("File not found");
                    }
                } catch (err) {
                    console.error("Failed to load saved config:", err);
                    setCurrentFilePath(""); // Сброс, если файл не найден
                    localStorage.removeItem(CURRENT_CONFIG_KEY);

                    // Fallback на unsaved nodes, если они есть
                    const unsaved = localStorage.getItem(STORAGE_KEY);
                    if (unsaved) {
                        dispatch({
                            type: NodesActionType.IMPORT,
                            payload: JSON.parse(unsaved),
                        });
                    }
                }
            } else {
                // Если нет currentFilePath, загрузить unsaved nodes
                const unsaved = localStorage.getItem(STORAGE_KEY);
                if (unsaved) {
                    dispatch({
                        type: NodesActionType.IMPORT,
                        payload: JSON.parse(unsaved),
                    });
                }
            }
        };

        loadInitialConfig();
    }, []); // Только при монтировании

    const handleChooseFolder = async () => {
        const result = await window.electronAPI.selectFolderPath()
        if (result) {
            const newFiles = await window.electronAPI.loadJsonFilesFromFolder(result)
            setJsonConfigs({ folderPath: result, files: newFiles || [] })
        }
    }

    const handleSelectConfig = (value: string) => {
        const fullPath = `${folderPath}/${value}`
        window.electronAPI.readJsonFile(fullPath).then((text) => {
            dispatch({
                type: NodesActionType.IMPORT,
                payload: stringToNodes(text),
            })
            setCurrentFilePath(fullPath)
        })
    }

    const handleChooseFile = async () => {
        const result = await window.electronAPI.selectJsonFile()
        if (result) {
            const text = await window.electronAPI.readJsonFile(result)
            dispatch({
                type: NodesActionType.IMPORT,
                payload: stringToNodes(text),
            })
            setCurrentFilePath(result)
        }
    }

    const handleSave = () => {
        if (currentFilePath) {
            window.electronAPI.saveJsonFile(currentFilePath, nodesToString(nodes))
            toast({ title: "Saved!" })
        } else {
            handleSaveAs()
        }
    }

    const handleSaveAs = async () => {
        const result = await window.electronAPI.selectSaveJsonFile()
        if (result) {
            window.electronAPI.saveJsonFile(result, nodesToString(nodes))
            setCurrentFilePath(result)
            toast({ title: "Saved!" })
        }
    }

    return (
        <>
            <Card className="h-full flex flex-col overflow-hidden">
                <Tabs defaultValue="code" className="flex flex-col h-full">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <TabsList className="grid grid-cols-2 w-1/2">
                                <TabsTrigger value="code">Code</TabsTrigger>
                                <TabsTrigger value="options">Options</TabsTrigger>
                            </TabsList>
                            <div className="flex-1">
                                <ConfigCombobox selectedFile={selectedFile} onSelect={handleSelectConfig} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <TabsContent value="code" className="h-full m-0 border rounded-lg">
                            <ScrollArea className="h-full w-full rounded-md">
                                <div className="p-4">
                                    <pre>{nodesToString(nodes)}</pre>
                                </div>
                                <ScrollBar orientation="vertical"/>
                                <ScrollBar orientation="horizontal"/>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="options" className="h-full flex flex-col gap-4 m-0">
                            <Label>Default config folder</Label>
                            <div className="flex items-center gap-2">
                                <Input value={folderPath} readOnly placeholder="Select folder" />
                                <Button variant="outline" size="icon" onClick={handleChooseFolder}>
                                    <FolderOpen />
                                </Button>
                            </div>
                            <Button variant="outline" onClick={() => setShowNewModal(true)}>
                                New file...
                            </Button>
                            <div className="border m-2"></div>
                            <Label>Current config file</Label>
                            <div className="flex items-center gap-2">
                                <Input value={currentFilePath} readOnly placeholder="Unsaved" />
                                <Button variant="outline" size="icon" onClick={handleChooseFile}>
                                    <File />
                                </Button>
                            </div>
                            <div className="flex flex-row gap-2">
                                <Button variant="outline" onClick={handleSave}>Save</Button>
                                <Button variant="outline" onClick={handleSaveAs}>Save as...</Button>
                            </div>
                            <div className="flex justify-end mt-auto">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => window.electronAPI.openExternal("https://github.com/breadyk/reline-local-GUI")}
                                    title="GitHub"
                                >
                                    <Github />
                                </Button>
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
            <NewConfigModal
                open={showNewModal}
                onClose={() => setShowNewModal(false)}
                folderPath={folderPath}
                setCurrentFilePath={setCurrentFilePath}
            />
        </>
    )
}