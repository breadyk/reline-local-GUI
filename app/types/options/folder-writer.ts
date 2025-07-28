import { z } from "zod"
import { WriterNodeFormat } from "~/types/enums.ts"

export interface PureFolderWriterNodeOptions {
  path: string
  format: WriterNodeFormat
}

export const folderWriterOptionsSchema = z.object({
  path: z.string(),
  format: z.nativeEnum(WriterNodeFormat),
})

export type FolderWriterNodeOptions = z.infer<typeof folderWriterOptionsSchema>
