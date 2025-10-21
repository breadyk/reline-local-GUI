import { useContext } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts.ts"
import { CvtType } from "~/types/enums"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { NodesActionType } from "~/types/actions.ts"
import type { CvtColorNodeOptions } from "~/types/options"

export function CvtColorNodeBody({ id }: { id: number }) {
    const nodes = useContext(NodesContext)
    const node = nodes.find((n) => n.id === id)
    if (!node) {
        return null
    }
    const options = node.options as CvtColorNodeOptions
    const dispatch = useContext(NodesDispatchContext)
    const changeValue = (newOptions: Partial<CvtColorNodeOptions>) => {
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
        <div>
            <Label>Cvt Type</Label>
            <Select
            onValueChange={(value) => {
              changeValue({
                cvt_type: value as CvtType,
              })
            }}
            value={options.cvt_type}
            >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.values(CvtType).map((type) => {
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
    )
}
