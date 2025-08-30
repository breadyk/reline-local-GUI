import type { ConvertToPureFunction, ConvertToStackFunction } from "~/lib/convert/index.ts"
import type { PureUpscaleNodeOptions, UpscaleNodeOptions } from "~/types/options"
import { NodeType, PureNodeType } from "~/types/enums"
import { DEFAULT_COLLAPSED } from "~/constants"

export const convertUpscaleToPure: ConvertToPureFunction = (nodes, index) => {
  const result = []
  const node = nodes[index]
  const { is_own_model, model: rawModel, ...options } = node.options as UpscaleNodeOptions
  if (is_own_model) {
    result.push({
      type: PureNodeType.UPSCALE,
      options: {
        model: rawModel,
        ...options,
      },
    })
  } else {
    const saved = localStorage.getItem("reline_models")
    const folderPath = saved ? JSON.parse(saved).folderPath : ""
    const modelPath = folderPath ? `${folderPath}\\${rawModel}` : rawModel
    result.push({
      type: PureNodeType.UPSCALE,
      options: {
        model: modelPath,
        ...options,
      }
    })
  }
  return [result, index + 1]
}

export const convertUpscaleToStack: ConvertToStackFunction = (nodes, index) => {
  const node = nodes[index]
  const options = node.options as PureUpscaleNodeOptions
  return [
    [
      {
        id: index,
        type: NodeType.UPSCALE,
        options: {
          ...options,
          is_own_model: true,
        },
        collapsed: DEFAULT_COLLAPSED,
      },
    ],
    index + 1,
  ]
}