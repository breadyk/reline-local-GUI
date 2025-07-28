import { z } from "zod"

export interface PureLevelNodeOptions {
  low_input: number
  high_input: number
  low_output: number
  high_output: number
  gamma: number
}

export const levelNodeOptionsSchema = z.object({
  low_input: z.number().min(0).max(255),
  high_input: z.number().min(0).max(255),
  low_output: z.number(z.number().min(0).max(255)),
  high_output: z.number(z.number().min(0).max(255)),
  gamma: z.number(z.number().min(0).max(10)),
})

export type LevelNodeOptions = z.infer<typeof levelNodeOptionsSchema>
