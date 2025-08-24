import {
  CannyType,
  CvtType,
  DotType,
  DType, HalftoneMode,
  NodeType,
  ReaderNodeMode,
  ResizeFilterType,
  ResizeType,
  TilerType,
  WriterNodeFormat,
} from "./types/enums"
import type { NodeOptions, StackNode } from "./types/node"

export const DEFAULT_COLLAPSED = true

export const DEFAULT_MODEL = "select folder"
export const STORAGE_KEY = "nodes-data"

export const DEFAULT_TILE_SIZE = 800
export const DEFAULT_SPREAD_SIZE = 2800

export const DEFAULT_RESIZE_WIDTH = 2000
export const DEFAULT_RESIZE_HEIGHT = 3200
export const DEFAULT_RESIZE_PERCENT = 0.5

export const DEFAULT_HALFTONE_ANGLE = 0
export const DEFAULT_HALFTONE_DOT_TYPE = DotType.CIRCLE
export const DEFAULT_HALFTONE_DOT_SIZE = 7
export const DEFAULT_HALFTONE_MODE = HalftoneMode.GRAY
export const DEFAULT_HALFTONE_SSAA_FILTER = ResizeFilterType.SHAMMING4

export const DEFAULT_CANNY_TYPE = CannyType.NORMAL

export const DEFAULT_NODE_OPTIONS: {
  [key in NodeType]: NodeOptions
} = {
  level: {
    low_input: 0,
    high_input: 253,
    low_output: 0,
    high_output: 255,
    gamma: 1,
  },
  folder_reader: {
    path: "C:\\raws",
    recursive: true,
    mode: ReaderNodeMode.DYNAMIC,
  },
  folder_writer: {
    path: "C:\\raws\\output",
    format: WriterNodeFormat.PNG,
  },
  cvt_color: {
    cvt_type: CvtType.RGB2Gray2020,
  },
  sharp: {
    low_input: 3,
    high_input: 250,
    gamma: 1,
    diapason_white: 2,
    diapason_black: -1,
    canny: true,
    canny_type: DEFAULT_CANNY_TYPE,
  },
  upscale: {
    is_own_model: false,
    model: DEFAULT_MODEL,
    dtype: DType.F32,
    tiler: TilerType.EXACT,
    exact_tiler_size: DEFAULT_TILE_SIZE,
    allow_cpu_upscale: false,
  },
  resize: {
    resize_type: ResizeType.BY_WIDTH,
    width: DEFAULT_RESIZE_WIDTH,
    filter: ResizeFilterType.CUBIC_MITCHELL,
    spread: true,
    spread_size: DEFAULT_SPREAD_SIZE,
    gamma_correction: false,
  },
  screentone: {
    halftone_mode: DEFAULT_HALFTONE_MODE,
    dot_size: DEFAULT_HALFTONE_DOT_SIZE,
    angle: DEFAULT_HALFTONE_ANGLE,
    dot_type: DEFAULT_HALFTONE_DOT_TYPE,
    ssaa_filter: DEFAULT_HALFTONE_SSAA_FILTER,
  },
}

export const DEFAULT_NODES: StackNode[] = [
  { id: 0, type: NodeType.FOLDER_READER, options: DEFAULT_NODE_OPTIONS.folder_reader, collapsed: true },
  { id: 1, type: NodeType.UPSCALE, options: DEFAULT_NODE_OPTIONS.upscale, collapsed: true },
  { id: 2, type: NodeType.SHARP, options: DEFAULT_NODE_OPTIONS.sharp, collapsed: true },
  { id: 3, type: NodeType.SCREENTONE, options: DEFAULT_NODE_OPTIONS.screentone, collapsed: true },
  { id: 4, type: NodeType.RESIZE, options: DEFAULT_NODE_OPTIONS.resize, collapsed: true },
  { id: 5, type: NodeType.LEVEL, options: DEFAULT_NODE_OPTIONS.level, collapsed: true },
  { id: 6, type: NodeType.FOLDER_WRITER, options: DEFAULT_NODE_OPTIONS.folder_writer, collapsed: true },
]
