import type { ConvertToPureFunction, ConvertToStackFunction } from "~/lib/convert/index.ts"
import type { FolderReaderNodeOptions, PureFolderReaderNodeOptions } from "~/types/options"
import { NodeType, PureNodeType } from "~/types/enums.ts"
import { DEFAULT_COLLAPSED } from "~/constants.ts"

export const convertFolderReaderToPure: ConvertToPureFunction = (nodes, index) => {
  const result = []
  const node = nodes[index]
  const { unarchive, ...options } = node.options as FolderReaderNodeOptions
  if (!unarchive) {
    result.push({
      type: PureNodeType.FOLDER_READER,
      options,
    })
  } else {
    result.push(
      {
        type: PureNodeType.UNARCHIVE,
        options: {
          path: options.path,
        },
      },
      {
        type: PureNodeType.FOLDER_READER,
        options,
      },
    )
  }
  return [result, index + 1]
}

export const convertFolderReaderToStack: ConvertToStackFunction = (nodes, index) => {
  const node = nodes[index]
  const options = node.options as PureFolderReaderNodeOptions
  return [
    [
      {
        id: index,
        type: NodeType.FOLDER_READER,
        options: {
          ...options,
          unarchive: false,
        },
        collapsed: DEFAULT_COLLAPSED,
      },
    ],
    index + 1,
  ]
}
