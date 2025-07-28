export enum ReaderNodeMode {
  RGB = "rgb",
  GRAY = "gray",
  DYNAMIC = "dynamic",
}

export enum WriterNodeFormat {
  PNG = "png",
  JPEG = "jpeg",
}

export enum NodeType {
  LEVEL = "level",
  FOLDER_READER = "folder_reader",
  FOLDER_WRITER = "folder_writer",
  SHARP = "sharp",
  CVT_COLOR = "cvt_color",
  UPSCALE = "upscale",
  RESIZE = "resize",
  SCREENTONE = "screentone",
}

export enum PureNodeType {
  LEVEL = "level",
  FOLDER_READER = "folder_reader",
  FOLDER_WRITER = "folder_writer",
  SHARP = "sharp",
  CVT_COLOR = "cvt_color",
  UPSCALE = "upscale",
  RESIZE = "resize",
  HALFTONE = "halftone",
  DOWNLOAD = "download",
  UNARCHIVE = "unarchive",
}

export enum CvtType {
  RGB2Gray = "RGB2Gray",
  RGB2Gray709 = "RGB2Gray709",
  RGB2Gray2020 = "RGB2Gray2020",
  Gray2RGB = "Gray2RGB",
}

export enum TilerType {
  EXACT = "exact",
  MAX = "max",
  NO_TILING = "no_tiling",
}

export enum ResizeType {
  BY_WIDTH = "width",
  BY_HEIGHT = "height",
  ABSOLUTE = "absolute",
  PERCENT = "percent",
}

export enum ResizeFilterType {
  NEAREST = "nearest",
  BOX = "box",
  LINEAR = "linear",
  HERMITE = "hermite",
  CUBIC_CATROM = "cubic_catrom",
  CUBIC_MITCHELL = "cubic_mitchell",
  CUBIC_BSPLINE = "cubic_bspline",
  LANCZOS = "lanczos",
  LAGRANGE = "lagrange",
  GAUSS = "gauss",
}

export enum CannyType {
  NORMAL = "normal",
  INVERT = "invert",
}

export enum DotType {
  CIRCLE = "circle",
  LINE = "line",
  INVERT = "cross",
  ELLIPSE = "ellipse",
  INVLINE = "invline",
}

export enum DType {
  F32 = "F32",
  F16 = "F16",
  BF16 = "BF16",
}
