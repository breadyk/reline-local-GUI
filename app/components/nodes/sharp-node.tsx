import { useContext } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { NumberInput } from "../ui/number-input"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { NodesActionType } from "~/types/actions"
import type { SharpNodeOptions } from "~/types/options"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { CannyType } from "~/types/enums"
import { DEFAULT_CANNY_TYPE } from "~/constants"

export function SharpNodeBody({ id }: { id: number }) {
  const nodes = useContext(NodesContext)
  const node = nodes[id]
  const options = node.options as SharpNodeOptions
  const dispatch = useContext(NodesDispatchContext)
  const changeValue = (newOptions: Partial<SharpNodeOptions>) => {
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
    <div className="flex flex-col gap-3">
      <div>
        <NumberInput
          min={0}
          max={255}
          step={1}
          labelText="Low input"
          value={options.low_input}
          onChange={(value) => {
            changeValue({ low_input: Math.trunc(value) })
          }}
        />
        <NumberInput
          min={0}
          max={255}
          step={1}
          labelText="High input"
          value={options.high_input}
          onChange={(value) => {
            changeValue({ high_input: Math.trunc(value) })
          }}
        />
        <NumberInput
          min={0}
          max={10}
          step={0.1}
          labelText="Gamma"
          value={options.gamma}
          onChange={(value) => {
            changeValue({ gamma: value })
          }}
        />
        <NumberInput
          min={-1}
          max={255}
          step={1}
          labelText="Diapason white"
          value={options.diapason_white}
          onChange={(value) => {
            changeValue({ diapason_white: Math.trunc(value) })
          }}
        />
        <NumberInput
          min={-1}
          max={255}
          step={1}
          labelText="Diapason black"
          value={options.diapason_black}
          onChange={(value) => {
            changeValue({ diapason_black: Math.trunc(value) })
          }}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={options.canny}
          onCheckedChange={(value) => {
            changeValue({ canny: !!value, canny_type: value ? DEFAULT_CANNY_TYPE : undefined })
          }}
        />
        <Label>canny</Label>
      </div>
      {options.canny && (
        <div className="flex flex-col gap-2">
          <Label>Canny Type</Label>
          <Select
            onValueChange={(value) => {
              changeValue({
                canny_type: value as CannyType,
              })
            }}
            value={options.canny_type}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.values(CannyType).map((type) => {
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
      )}
    </div>
  )
}
