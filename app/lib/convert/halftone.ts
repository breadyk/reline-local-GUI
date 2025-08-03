import type { ConvertToPureFunction, ConvertToStackFunction } from "~/lib/convert/index.ts"
import type { ScreentoneNodeOptions } from "~/types/options"
import { NodeType, PureNodeType } from "~/types/enums.ts"
import { DEFAULT_COLLAPSED } from "~/constants.ts"

export const convertScreentoneToPure: ConvertToPureFunction = (nodes, index) => {
  const node = nodes[index]
  const unwrap = (v: any) => (Array.isArray(v) && v.length === 1 ? v[0] : v)
  const options = node.options as ScreentoneNodeOptions
  return [
    [
      {
        type: PureNodeType.HALFTONE,
        options: {
          ...options,
          ssaa_scale: options.ssaa_scale ? options.ssaa_scale : undefined,
          ssaa_filter: options.ssaa_scale ? options.ssaa_filter : undefined,
          dot_size: unwrap(options.dot_size),
          angle: unwrap(options.angle),
          dot_type: unwrap(options.dot_type),
        },
      },
    ],
    index + 1,
  ]
}

export const convertHalftoneToStack: ConvertToStackFunction = (nodes, index) => {
  const node = nodes[index]
  const options = node.options as ScreentoneNodeOptions
  return [
    [
      {
        id: index,
        type: NodeType.SCREENTONE,
        options: options as ScreentoneNodeOptions,
        collapsed: DEFAULT_COLLAPSED,
      },
    ],
    index + 1,
  ]
}
