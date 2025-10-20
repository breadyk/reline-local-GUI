import {useContext} from "react"
import {NodesContext, NodesDispatchContext} from "~/context/contexts"
import {ReaderNodeMode} from "~/types/enums"
import {Input} from "../ui/input"
import {Checkbox} from "../ui/checkbox"
import {Label} from "../ui/label"
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "../ui/select"
import {NodesActionType} from "~/types/actions.ts"
import type {FolderReaderNodeOptions} from "~/types/options"
import {Button, buttonVariants} from "../ui/button"
import {FolderOpen} from "lucide-react"

export function FolderReaderNodeBody({id}: { id: number }) {
    const nodes = useContext(NodesContext)
    const node = nodes.find((n) => n.id === id)
    if (!node) {
        return null
    }
    const options = node.options as FolderReaderNodeOptions
    const dispatch = useContext(NodesDispatchContext)
    const changeValue = (newOptions: Partial<FolderReaderNodeOptions>) => {
        dispatch({
            type: NodesActionType.CHANGE,
            payload: {
                ...node,
                options: {
                    ...options,
                    ...newOptions,
                },
            },
        })
    }
    return (
        <div className="flex flex-col gap-5">
            <div>
                <Label>Path to folder</Label>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Path/to/folder"
                        value={options.path}
                        onChange={(e) => {
                            changeValue({path: e.target.value})
                        }}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        title="Select folder"
                        onClick={async () => {
                            try {
                                const folderPath = await window.electronAPI.selectFolderPath()
                                if (folderPath) {
                                    changeValue({path: folderPath})
                                }
                            } catch (err) {
                                console.error("Folder selection cancelled or failed:", err)
                            }
                        }}
                    >
                        <FolderOpen/>
                    </Button>
                </div>

            </div>
            <div className="flex flex-col space-y-2">
                <Label>Mode</Label>
                <Select
                    onValueChange={(value) => {
                        changeValue({
                            mode: value as ReaderNodeMode,
                        })
                    }}
                    value={options.mode}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {Object.values(ReaderNodeMode).map((mode) => {
                                return (
                                    <SelectItem key={mode} value={mode}>
                                        {mode}
                                    </SelectItem>
                                )
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    checked={options.recursive}
                    onCheckedChange={(value) => {
                        changeValue({recursive: !!value})
                    }}
                />
                <Label>recursive</Label>
            </div>
        </div>
    )
}
