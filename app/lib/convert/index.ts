import { NodeType, PureNodeType } from "~/types/enums.ts"
import type { NodeOptions, PureNode, PureNodeOptions, StackNode } from "~/types/node.ts"
import { convertHalftoneToStack, convertScreentoneToPure } from "~/lib/convert/halftone.ts"
import { convertResizeToPure, convertResizeToStack } from "~/lib/convert/resize.ts"
import { convertUpscaleToPure, convertUpscaleToStack } from "~/lib/convert/upscale.ts"
import { DEFAULT_COLLAPSED } from "~/constants.ts"
import { convertFolderReaderToPure, convertFolderReaderToStack } from "~/lib/convert/folder_reader.ts"

export type ConvertToPureFunction = (nodes: StackNode[], index: number) => [PureNode[], number]
export type ConvertToStackFunction = (nodes: PureNode[], index: number) => [StackNode[], number]

const convertEqualsToPure: (nodes: StackNode[], index: number) => [PureNode[], number] = (nodes, index) => {
  const node = nodes[index]
  const result = {
    type: node.type as unknown as PureNodeType,
    options: node.options as PureNodeOptions,
  }
  return [[result], index + 1]
}

const convertEqualsToStack: (nodes: PureNode[], index: number) => [StackNode[], number] = (nodes, index) => {
  const node = nodes[index]
  const result = {
    id: index,
    type: node.type as unknown as NodeType,
    options: node.options as NodeOptions,
    collapsed: DEFAULT_COLLAPSED,
  }
  return [[result], index + 1]
}

type ToPureConvertMapper = {
  [key in NodeType]: ConvertToPureFunction
}

type ToStackConvertMapper = {
  [key in PureNodeType]: ConvertToStackFunction
}

const convertToPureMapper: ToPureConvertMapper = {
  [NodeType.UPSCALE]: convertUpscaleToPure,
  [NodeType.RESIZE]: convertResizeToPure,
  [NodeType.SCREENTONE]: convertScreentoneToPure,
  [NodeType.CVT_COLOR]: convertEqualsToPure,
  [NodeType.FOLDER_READER]: convertFolderReaderToPure,
  [NodeType.FOLDER_WRITER]: convertEqualsToPure,
  [NodeType.LEVEL]: convertEqualsToPure,
  [NodeType.SHARP]: convertEqualsToPure,
}
const convertToStackMapper: ToStackConvertMapper = {
  [PureNodeType.UPSCALE]: convertUpscaleToStack,
  [PureNodeType.RESIZE]: convertResizeToStack,
  [PureNodeType.HALFTONE]: convertHalftoneToStack,
  [PureNodeType.CVT_COLOR]: convertEqualsToStack,
  [PureNodeType.FOLDER_READER]: convertFolderReaderToStack,
  [PureNodeType.FOLDER_WRITER]: convertEqualsToStack,
  [PureNodeType.LEVEL]: convertEqualsToStack,
  [PureNodeType.SHARP]: convertEqualsToStack,
}

export const convertToPure = (nodes: StackNode[]) => {
  const result = []
  for (let i = 0; i < nodes.length; ) {
    const [converted, nextIndex] = convertToPureMapper[nodes[i].type](nodes, i)
    result.push(...converted)
    i = nextIndex
  }
  return result
}

export const convertToStack = (nodes: PureNode[]) => {
  const result = []
  for (let i = 0; i < nodes.length; ) {
    const [converted, nextIndex] = convertToStackMapper[nodes[i].type](nodes, i)
    result.push(...converted)
    i = nextIndex
  }
  return result.map((node, index) => {
    return { ...node, id: index }
  })
}
