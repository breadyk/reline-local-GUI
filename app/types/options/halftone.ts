import { z } from "zod"
import {DotType, HalftoneMode, ResizeFilterType} from "~/types/enums.ts"

export interface PureHalftoneNodeOptions {
  dot_size: number | number[]
  angle: number | number[]
  dot_type: DotType | DotType[]
  halftone_mode: HalftoneMode
}

export const screentoneOptionsSchema = z.object({
  halftone_mode: z.nativeEnum(HalftoneMode),
  dot_size: z.union([z.number(), z.array(z.number())]),
  angle: z.union([z.number(), z.array(z.number())]),
  dot_type: z.union([z.nativeEnum(DotType), z.array(z.nativeEnum(DotType))]),
  ssaa_scale: z.number().optional(),
  ssaa_filter: z.nativeEnum(ResizeFilterType).optional(),
})

export type ScreentoneNodeOptions = z.infer<typeof screentoneOptionsSchema>
