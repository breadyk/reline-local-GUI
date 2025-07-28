import { z } from "zod"
import { CvtType } from "~/types/enums.ts"

export interface PureCvtColorNodeOptions {
  cvt_type: CvtType
}

export const cvtColorNodeOptionsSchema = z.object({
  cvt_type: z.nativeEnum(CvtType),
})

export type CvtColorNodeOptions = z.infer<typeof cvtColorNodeOptionsSchema>
