import { useContext } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts.ts"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import type { ScreentoneNodeOptions } from "~/types/options"
import { NodesActionType } from "~/types/actions.ts"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select.tsx"
import { DotType } from "~/types/enums.ts"
import { NumberInput } from "~/components/ui/number-input.tsx"

export function ScreentoneNodeBody({ id }: { id: number }) {
  const nodes = useContext(NodesContext)
  const node = nodes[id]
  const options = node.options as ScreentoneNodeOptions
  const dispatch = useContext(NodesDispatchContext)
  const changeValue = (newOptions: Partial<ScreentoneNodeOptions>) => {
    dispatch({
      type: NodesActionType.CHANGE,
      payload: {
        ...node,
        options: {
          ...node.options,
          ...newOptions,
        },
      },
    })
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>dot type</Label>
        <Select
          onValueChange={(value) => {
            changeValue({
              dot_type: value as DotType,
            })
          }}
          value={options.dot_type}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(DotType).map((type) => {
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
      <div className="flex flex-col gap-2">
        <NumberInput
          min={0}
          max={360}
          step={1}
          labelText="angle"
          value={options.angle}
          onChange={(value) => {
            changeValue({ angle: Math.trunc(value) })
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>dot size</Label>
        <Input
          type="number"
          className="w-[180px]"
          step={1}
          value={options.dot_size}
          onChange={(e) => {
            changeValue({
              dot_size: Number.parseInt(e.target.value),
            })
          }}
        />
      </div>
    </div>
  )
}
