import { z } from "zod"
import { DotType, type ReaderNodeMode } from "~/types/enums.ts"

// todo
export interface PureHalftoneNodeOptions {
  dot_size: number | number[]
  angle: number | number[]
  dot_type: DotType | DotType[]
  halftone_mode: ReaderNodeMode
}

export const screentoneOptionsSchema = z.object({
  dot_size: z.number(),
  angle: z.number(),
  dot_type: z.nativeEnum(DotType),
})

export type ScreentoneNodeOptions = z.infer<typeof screentoneOptionsSchema>
