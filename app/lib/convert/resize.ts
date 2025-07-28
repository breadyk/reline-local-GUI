import type { ConvertToPureFunction, ConvertToStackFunction } from "~/lib/convert/index.ts"
import type { PureResizeOptions, ResizeNodeOptions } from "~/types/options"
import { NodeType, PureNodeType, ResizeType } from "~/types/enums.ts"
import { DEFAULT_COLLAPSED } from "~/constants.ts"

export const convertResizeToPure: ConvertToPureFunction = (nodes, index) => {
  const node = nodes[index]
  const { resize_type, ...options } = node.options as ResizeNodeOptions
  return [
    [
      {
        type: PureNodeType.RESIZE,
        options,
      },
    ],
    index + 1,
  ]
}

function getResizeType(options: PureResizeOptions) {
  if (options.width && !options.height) {
    return ResizeType.BY_WIDTH
  }
  if (!options.width && options.height) {
    return ResizeType.BY_HEIGHT
  }
  if (options.width && options.height) {
    return ResizeType.ABSOLUTE
  }
  if (options.percent) {
    return ResizeType.PERCENT
  }
  return ResizeType.ABSOLUTE
}

export const convertResizeToStack: ConvertToStackFunction = (nodes, index) => {
  const node = nodes[index]
  const options = node.options as PureResizeOptions
  return [
    [
      {
        id: index,
        type: NodeType.RESIZE,
        options: {
          ...options,
          resize_type: getResizeType(options),
        },
        collapsed: DEFAULT_COLLAPSED,
      },
    ],
    index + 1,
  ]
}
