import {useContext, useEffect, useState} from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { ModelsContext, useSetModels, useModels } from "~/context/model-provider"
import { DType, TilerType } from "~/types/enums"
import { Label } from "../ui/label"
import { DEFAULT_MODEL, DEFAULT_TILE_SIZE } from "~/constants"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { cn } from "~/lib/utils"
import { Input } from "../ui/input"
import { Checkbox } from "../ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import type { UpscaleNodeOptions } from "~/types/options"
import { NodesActionType } from "~/types/actions"
import { FolderOpen, File } from "lucide-react"


function Combobox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const { models } = useModels();

    const displayValue = value === "select folder" ? "Select folder" : value;
    const isPlaceholder = value === "select folder";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full grid grid-cols-[1fr_auto] items-center",
                        isPlaceholder && "text-muted-foreground font-normal"
                    )}
                >
                    <span className="truncate pr-2 text-left">
                        {displayValue}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No models found.</CommandEmpty>
                        <CommandGroup>
                            {Array.isArray(models) && models.length > 0 ? (
                                models.map((model) => (
                                    <CommandItem
                                        key={model}
                                        value={model}
                                        onSelect={() => {
                                            onChange(model);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", value === model ? "opacity-100" : "opacity-0")} />
                                        {model}
                                    </CommandItem>
                                ))
                            ) : null}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function UpscaleNodeBody({ id }: { id: number }) {
    const nodes = useContext(NodesContext)
    const node = nodes[id]
    const options = node.options as UpscaleNodeOptions
    const dispatch = useContext(NodesDispatchContext)
    const { folderPath, models } = useContext(ModelsContext)
    const setModels = useSetModels()

    useEffect(() => {
        if (options.model === "select folder" && models.length > 0 && !options.is_own_model) {
            changeValue({ model: models[0] });
        }
    }, [models, options.model, options.is_own_model]);

    const handleChooseFolder = async () => {
        const result = await window.electronAPI.selectModelFolder();
        if (result && Array.isArray(result.models)) {
            setModels({ folderPath: result.folderPath, models: result.models });
            const defaultModel = result.models[0] || "select folder";
            changeValue({ model: defaultModel });
        }
    };

    const handleChooseFile = async (changeValue: (val: Partial<UpscaleNodeOptions>) => void) => {
    const filePath = await window.electronAPI.selectModelFile()
    if (filePath) {
        changeValue({ model: filePath })
    }
    }

    const changeValue = (newOptions: Partial<UpscaleNodeOptions>) => {
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
        <Label>Model</Label>
        {options.is_own_model ? (
          <div className="flex items-center gap-2">
              <Input
                placeholder="Path/to/model"
                value={options.model}
                onChange={(e) => {
                  changeValue({ model: e.target.value })
                }}
              />
              <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  title="Select file"
                  onClick={() => handleChooseFile(changeValue)}
              >
                  <File/>
              </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
              <Combobox
                  value={options.model}
                  onChange={(model) => {
                      changeValue({ model });
                  }}
              />
              <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  title="Select folder"
                  onClick={handleChooseFolder}
              >
                  <FolderOpen />
              </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tiler</Label>
        <Select
          onValueChange={(value) => {
            if (value === TilerType.EXACT) {
              changeValue({
                exact_tiler_size: DEFAULT_TILE_SIZE,
                tiler: value as TilerType,
              })
            } else {
              changeValue({
                exact_tiler_size: undefined,
                tiler: value as TilerType,
              })
            }
          }}
          value={options.tiler}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(TilerType).map((type) => {
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

      {options.tiler === TilerType.EXACT && (
        <div className="flex flex-col gap-2">
          <Label>Tile size</Label>
          <Input
            type="number"
            className="w-[180px]"
            step={100}
            value={options.exact_tiler_size}
            onChange={(e) => {
              changeValue({
                exact_tiler_size: Number.parseInt(e.target.value),
              })
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>DType</Label>
        <Select onValueChange={(value: DType) => changeValue({ dtype: value })} value={options.dtype}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.values(DType).map((type) => {
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

      <div className="flex items-center space-x-2">
          <Checkbox
              checked={options.is_own_model}
              onCheckedChange={(value) => {
                  if (!value) {
                      const selectedModel = models.includes(options.model)
                          ? options.model
                          : models[0] || "select folder";
                      changeValue({ model: selectedModel, is_own_model: value });
                  } else {
                      changeValue({ model: "", is_own_model: !!value });
                  }
              }}
          />
        <Label>from file</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={options.allow_cpu_upscale}
          onCheckedChange={(value) => {
            changeValue({ allow_cpu_upscale: !!value })
          }}
        />
        <Label>allow cpu upscale</Label>
      </div>
    </div>
  )
}
