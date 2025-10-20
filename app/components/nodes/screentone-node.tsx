import {useContext, useEffect} from "react"
import {NodesContext, NodesDispatchContext} from "~/context/contexts.ts"
import {Label} from "../ui/label"
import {Input} from "../ui/input"
import type {ScreentoneNodeOptions} from "~/types/options"
import {NodesActionType} from "~/types/actions.ts"
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "~/components/ui/select.tsx"
import {DotType, HalftoneMode, ResizeFilterType} from "~/types/enums.ts"
import {NumberInput} from "~/components/ui/number-input.tsx"
import {DEFAULT_HALFTONE_SSAA_FILTER} from "~/constants";

export function ScreentoneNodeBody({id}: { id: number }) {
    const nodes = useContext(NodesContext)
    const node = nodes.find((n) => n.id === id)
    if (!node) {
        return null
    }
    const options = node.options as ScreentoneNodeOptions
    useEffect(() => {
        const needsPatch =
            options.ssaa_filter === undefined

        if (needsPatch) {
            changeValue({
                ssaa_filter: options.ssaa_filter ?? DEFAULT_HALFTONE_SSAA_FILTER,
            })
        }
    }, [])
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

    const mode = options.halftone_mode
    const channelCount = mode === "cmyk" ? 4 : mode === "rgb" ? 3 : 1

    const ensureArray = <T, >(value: T | T[], length: number, fallback: T): T[] => {
        if (Array.isArray(value)) return value.length === length ? value : Array(length).fill(fallback)
        return Array(length).fill(value)
    }

    const dotSizes = ensureArray(options.dot_size, channelCount, 6)
    const angles = ensureArray(options.angle, channelCount, 45)
    const dotTypes = ensureArray(options.dot_type, channelCount, DotType.CIRCLE)

    const updateArrayField = <T, >(
        key: keyof ScreentoneNodeOptions,
        index: number,
        value: T
    ) => {
        const current = ensureArray(options[key] as T | T[], channelCount, value)
        const updated = [...current]
        updated[index] = value
        changeValue({[key]: updated} as any)
    }

    const renderDotOptionsArray = () => {
        return [...Array(channelCount)].map((_, i) => (
            <div key={i} className="border rounded-xl p-3 flex flex-col gap-2">
                <Label>Channel {i + 1}</Label>

                <Label>Dot Type</Label>
                <Select
                    onValueChange={(value) => updateArrayField("dot_type", i, value as DotType)}
                    value={dotTypes[i]}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {Object.values(DotType).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <NumberInput
                    min={0}
                    max={360}
                    step={1}
                    labelText="Angle"
                    value={angles[i]}
                    onChange={(value) => updateArrayField("angle", i, Math.trunc(value))}
                />

                <Label>Dot Size</Label>
                <Input
                    type="number"
                    className="w-[180px]"
                    step={1}
                    value={dotSizes[i]}
                    onChange={(e) => updateArrayField("dot_size", i, parseInt(e.target.value))}
                />
            </div>
        ))
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <Label>Halftone mode</Label>
                <Select
                    onValueChange={(value) => {
                        const newMode = value as HalftoneMode
                        let newOptions: Partial<ScreentoneNodeOptions>

                        if (newMode === "rgb" || newMode === "cmyk") {
                            const channels = newMode === "cmyk" ? 4 : 3
                            newOptions = {
                                halftone_mode: newMode,
                                dot_size: Array(channels).fill(7),
                                angle: Array(channels).fill(0),
                                dot_type: Array(channels).fill(options.dot_type),
                            }
                        } else {
                            newOptions = {
                                halftone_mode: newMode,
                                dot_size: 7,
                                angle: 0,
                                dot_type: DotType.CIRCLE,
                            }
                        }

                        changeValue(newOptions)
                    }}

                    value={options.halftone_mode}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {Object.values(HalftoneMode).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {(mode === "rgb" || mode === "cmyk") ? (
                renderDotOptionsArray()
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        <Label>Dot Type</Label>
                        <Select
                            onValueChange={(value) => {
                                changeValue({
                                    dot_type: value as DotType,
                                })
                            }}
                            value={options.dot_type as DotType}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {Object.values(DotType).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <NumberInput
                            min={0}
                            max={360}
                            step={1}
                            labelText="Angle"
                            value={options.angle as number}
                            onChange={(value) => {
                                changeValue({angle: Math.trunc(value)})
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Dot Size</Label>
                        <Input
                            type="number"
                            className="w-[180px]"
                            step={1}
                            value={options.dot_size as number}
                            onChange={(e) => {
                                changeValue({
                                    dot_size: Number.parseInt(e.target.value),
                                })
                            }}
                        />
                    </div>
                </>
            )}

            <div className="flex flex-col gap-2">
                <Label>SSAA Scale</Label>
                <Input
                    type="number"
                    className="w-[180px]"
                    step="0.1"
                    placeholder="None"
                    value={options.ssaa_scale ?? ""}
                    onChange={(e) => {
                        const value = e.target.value
                        changeValue({
                            ssaa_scale: value === "" ? undefined : parseFloat(value),
                        })
                    }}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label>SSAA Filter</Label>
                <Select
                    onValueChange={(value) => {
                        changeValue({
                            ssaa_filter: value as ResizeFilterType,
                        })
                    }}
                    value={options.ssaa_filter}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {Object.values(ResizeFilterType).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
