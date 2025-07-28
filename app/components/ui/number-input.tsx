import { Label } from "./label"
import { Slider } from "./slider"
import { Input } from "./input"

interface NumberInputProps {
  min: number
  max: number
  step: number
  labelText: string
  value: number
  onChange(value: number): void
}

export function NumberInput({ min, max, step, labelText, value, onChange }: NumberInputProps) {
  return (
    <div>
      <Label>{labelText}</Label>
      <div className="flex flex-row">
        <Slider
          onValueChange={(newValue) => {
            onChange(newValue[0])
          }}
          min={min}
          max={max}
          value={[value]}
          step={step}
        />
        <Input
          className="w-24 ml-3"
          type="number"
          value={value}
          onChange={(e) => {
            onChange(Number(e.target.value))
          }}
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  )
}
