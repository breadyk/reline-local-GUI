import type { ConvertToPureFunction, ConvertToStackFunction } from "~/lib/convert/index.ts"
import type { PureUpscaleNodeOptions, UpscaleNodeOptions } from "~/types/options"
import { NodeType, PureNodeType } from "~/types/enums"
import { DEFAULT_COLLAPSED, MODEL_POSTFIX, MODEL_PREFIX } from "~/constants"

export const convertUpscaleToPure: ConvertToPureFunction = (nodes, index) => {
  const result = []
  const node = nodes[index]
  const { is_own_model, model: rawModel, model_folder_path, ...options } = node.options as UpscaleNodeOptions
  if (is_own_model) {
    result.push({
      type: PureNodeType.UPSCALE,
      model: rawModel,
      ...options,
    })
  } else {

    const modelPath =
        model_folder_path && rawModel
            ? `${model_folder_path}\\${rawModel}`
            : MODEL_PREFIX + rawModel + MODEL_POSTFIX
    result.push(
      {
        type: PureNodeType.UPSCALE,
        options: {
          model: modelPath,
          ...options,
        },
      },
    )
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
