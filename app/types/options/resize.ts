import { z } from "zod"
import { ResizeFilterType, ResizeType } from "~/types/enums.ts"

export interface PureResizeOptions {
  width?: number
  height?: number
  percent?: number
  filter: ResizeFilterType
  gamma_correction: boolean
  spread: boolean
  spread_size?: number
}

export const resizeOptionsSchema = z.object({
  resize_type: z.nativeEnum(ResizeType),
  width: z.number().optional(),
  height: z.number().optional(),
  percent: z.number().optional(),
  filter: z.nativeEnum(ResizeFilterType),
  gamma_correction: z.boolean(),
  spread: z.boolean(),
  spread_size: z.number().optional(),
})

export type ResizeNodeOptions = z.infer<typeof resizeOptionsSchema>
