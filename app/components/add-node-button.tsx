import { Plus } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { NodeType } from "~/types/enums"
import { useContext, useState } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { DEFAULT_NODE_OPTIONS } from "~/constants"
import { Button } from "./ui/button"
import { NodesActionType } from "~/types/actions"

export function AddNodeButton() {
  const [open, setOpen] = useState(false)
  const dispatch = useContext(NodesDispatchContext)
  const nodes = useContext(NodesContext)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="ml-auto " variant="ghost" size="icon" aria-expanded={open}>
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>Nothing was found.</CommandEmpty>
            <CommandGroup>
              {Object.values(NodeType).map((value) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={(currentValue) => {
                    dispatch({
                      type: NodesActionType.ADD,
                      payload: {
                        id: nodes.length,
                        type: currentValue as NodeType,
                        options: DEFAULT_NODE_OPTIONS[currentValue as NodeType],
                        collapsed: false,
                      },
                    })
                    setOpen(false)
                  }}
                >
                  {value}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
