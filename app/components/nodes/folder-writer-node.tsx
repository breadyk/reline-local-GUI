import { useContext } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts.ts"
import { WriterNodeFormat } from "~/types/enums.ts"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import type { FolderWriterNodeOptions } from "~/types/options"
import { NodesActionType } from "~/types/actions.ts"
import { Button, buttonVariants } from "../ui/button"
import { FolderOpen } from "lucide-react"

export function FolderWriterNodeBody({ id }: { id: number }) {
  const nodes = useContext(NodesContext)
  const node = nodes[id]
  const options = node.options as FolderWriterNodeOptions
  const dispatch = useContext(NodesDispatchContext)
  const changeValue = (newOptions: Partial<FolderWriterNodeOptions>) => {
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
      <div className = "flex flex-col gap-2">
        <Label>Path to folder</Label>
        <div className="flex items-center gap-2">
            <Input
              placeholder="Path/to/folder"
              value={options.path}
              onChange={(e) => {
                changeValue({ path: e.target.value })
              }}
            />
            <Button
                variant="outline"
                size="icon"
                type="button"
                title="Select folder"
                onClick={async () => {
                    try {
                    const directoryHandle = await window.showDirectoryPicker()
                    changeValue({ path: directoryHandle.name })
                    } catch (err) {
                    console.error("Folder selection cancelled or failed:", err)
                    }
                }}
            >
                <FolderOpen/>
            </Button>
        </div>
      </div>
      <div>
        <Label>Format</Label>
        <Select
          onValueChange={(value) => {
            changeValue({
              format: value as WriterNodeFormat,
            })
          }}
          value={options.format}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(WriterNodeFormat).map((type) => {
                return (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                )
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
