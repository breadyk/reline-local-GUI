import {ArrowUp, ArrowDown, X, ChevronDown, ChevronRight, ChevronsUpDown, Check, GripVertical} from "lucide-react"
import {type FC, useContext, useState} from "react"
import {NodesContext, NodesDispatchContext} from "~/context/contexts"
import {NodeType} from "~/types/enums"
import {DEFAULT_NODE_OPTIONS} from "~/constants"
import {CvtColorNodeBody, FolderReaderNodeBody, FolderWriterNodeBody, LevelNodeBody, SharpNodeBody} from "./nodes"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    Button,
    Card,
    CardHeader,
    CardContent
} from "~/components/ui"
import {UpscaleNodeBody} from "~/components/nodes"
import {Popover, PopoverContent, PopoverTrigger} from "./ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "./ui/command"
import {cn} from "~/lib/utils"
import {ResizeNodeBody} from "./nodes/resize-node"
import {ScreentoneNodeBody} from "./nodes/screentone-node"
import {NodesActionType} from "~/types/actions"

const nodeBodyComponents: { [key in NodeType]: FC<{ id: number }> } = {
    level: LevelNodeBody as FC<{ id: number }>,
    folder_reader: FolderReaderNodeBody as FC<{ id: number }>,
    folder_writer: FolderWriterNodeBody as FC<{ id: number }>,
    cvt_color: CvtColorNodeBody as FC<{ id: number }>,
    sharp: SharpNodeBody as FC<{ id: number }>,
    upscale: UpscaleNodeBody as FC<{ id: number }>,
    resize: ResizeNodeBody as FC<{ id: number }>,
    screentone: ScreentoneNodeBody as FC<{ id: number }>,
}

function Combobox({allValues, initialValue, onChange}: {
    allValues: string[];
    initialValue: string;
    onChange: (value: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(initialValue)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" aria-role="combobox" aria-expanded={open}
                        className="w-[200px] justify-between">
                    {value}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search..."/>
                    <CommandList>
                        <CommandEmpty>Nothing was found.</CommandEmpty>
                        <CommandGroup>
                            {allValues.map((_value) => (
                                <CommandItem
                                    key={_value}
                                    value={_value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue)
                                        onChange(currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn("mr-2 h-4 w-4", value === _value ? "opacity-100" : "opacity-0")}/>
                                    {_value}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function NodeResolver({id, dragListeners, isDragging = false}: {
    id: number;
    dragListeners?: any;
    isDragging?: boolean
}) {
    const nodes = useContext(NodesContext)
    const data = nodes.find((node) => node.id === id)
    const index = nodes.findIndex((node) => node.id === id)
    if (!data || index === -1) {
        return null
    }
    const NodeBodyComponent = nodeBodyComponents[data.type]
    const dispatch = useContext(NodesDispatchContext)
    const onTypeChange = (value: string) => {
        dispatch({
            type: NodesActionType.CHANGE,
            payload: {
                id: data.id,
                type: value as NodeType,
                collapsed: data.collapsed,
                options: DEFAULT_NODE_OPTIONS[value as NodeType],
            },
        })
    }

    return (
        <Collapsible
            open={!data.collapsed}
            onOpenChange={(isOpen) => {
                dispatch({
                    type: NodesActionType.CHANGE,
                    payload: {
                        ...data,
                        collapsed: !isOpen,
                    },
                })
            }}
        >
            <Card className={cn(isDragging && "cursor-grabbing [&_*]:cursor-grabbing")}>
                <CardHeader className="flex flex-row items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "cursor-grab -ml-2 mr-2 transition ring-0",
                            isDragging && "bg-accent transition ring-1")}
                        {...dragListeners}>
                        <GripVertical/>
                    </Button>
                    <Combobox initialValue={data.type} allValues={Object.values(NodeType)} onChange={onTypeChange}/>
                    <CollapsibleTrigger asChild>
                        <Button className="ml-2" variant="ghost" size="icon">
                            {data.collapsed ? <ChevronRight/> : <ChevronDown/>}
                        </Button>
                    </CollapsibleTrigger>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        className="ml-auto"
                        onClick={() => {
                            dispatch({
                                type: NodesActionType.MOVE,
                                payload: {
                                    from: index,
                                    to: index - 1,
                                },
                            })
                        }}
                    >
                        <ArrowUp/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === nodes.length - 1}
                        onClick={() => {
                            dispatch({
                                type: NodesActionType.MOVE,
                                payload: {
                                    from: index,
                                    to: index + 1,
                                },
                            })
                        }}
                    >
                        <ArrowDown/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            dispatch({
                                type: NodesActionType.DELETE,
                                payload: data.id,
                            })
                        }}
                    >
                        <X/>
                    </Button>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <Card>
                            <CardContent className="pt-6">
                                <NodeBodyComponent id={id}/>
                            </CardContent>
                        </Card>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
