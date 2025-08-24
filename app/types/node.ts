import type { NodeType, PureNodeType } from "./enums"

import type {
  PureCvtColorNodeOptions,
  PureFolderReaderNodeOptions,
  PureFolderWriterNodeOptions,
  PureHalftoneNodeOptions,
  PureLevelNodeOptions,
  PureResizeOptions,
  PureSharpNodeOptions,
  PureUpscaleNodeOptions,
} from "~/types/options"

import type {
  CvtColorNodeOptions,
  FolderReaderNodeOptions,
  FolderWriterNodeOptions,
  ScreentoneNodeOptions,
  LevelNodeOptions,
  ResizeNodeOptions,
  SharpNodeOptions,
  UpscaleNodeOptions,
} from "~/types/options"

export type NodeOptions =
  | CvtColorNodeOptions
  | FolderReaderNodeOptions
  | FolderWriterNodeOptions
  | ScreentoneNodeOptions
  | LevelNodeOptions
  | ResizeNodeOptions
  | SharpNodeOptions
  | UpscaleNodeOptions

export type PureNodeOptions =
  | PureCvtColorNodeOptions
  | PureFolderReaderNodeOptions
  | PureFolderWriterNodeOptions
  | PureHalftoneNodeOptions
  | PureLevelNodeOptions
  | PureResizeOptions
  | PureSharpNodeOptions
  | PureUpscaleNodeOptions

export interface PureNode {
  type: PureNodeType
  options: PureNodeOptions
}

export interface StackNode {
  id: number
  type: NodeType
  options: NodeOptions
  collapsed: boolean
}
