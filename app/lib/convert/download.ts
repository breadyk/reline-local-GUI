import type { ConvertToStackFunction } from "~/lib/convert/index.ts"
import type { PureDownloadNodeOptions, PureUpscaleNodeOptions } from "~/types/options"
import { NodeType } from "~/types/enums"
import { DEFAULT_COLLAPSED } from "~/constants"

export const convertDownloadToStack: ConvertToStackFunction = (nodes, index) => {
  const node = nodes[index]
  const options = node.options as PureDownloadNodeOptions
  const scaleNode = nodes[index + 1]
  const scaleOptions = scaleNode.options as PureUpscaleNodeOptions
  return [
    [
      {
        id: index,
        type: NodeType.UPSCALE,
        options: {
          ...scaleOptions,
          model: options.name,
          is_own_model: false,
        },
        collapsed: DEFAULT_COLLAPSED,
      },
    ],
    index + 2,
  ]
}
