import { z } from "zod"
import { DType, TilerType } from "~/types/enums"

export interface PureDownloadNodeOptions {
  name: string
}
export interface UpNodeOptions {
    model_folder_path?: string,
    models?: string[]
}

export const UpscaleOptionsSchema = z.object({
  is_own_model: z.boolean(),
  model: z.string(),
  dtype: z.nativeEnum(DType),
  tiler: z.nativeEnum(TilerType),
  exact_tiler_size: z.number(),
  allow_cpu_upscale: z.boolean(),
})

export type UpscaleNodeOptions = z.infer<typeof UpscaleOptionsSchema>

export type PureUpscaleNodeOptions = Omit<UpscaleNodeOptions, "is_own_model">
