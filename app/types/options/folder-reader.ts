import { z } from "zod"
import { ReaderNodeMode } from "~/types/enums.ts"

export interface PureFolderReaderNodeOptions {
  path: string
  mode: ReaderNodeMode
  recursive: boolean
}

export interface PureUnarchiveNodeOptions {
  path: string
}

export const folderReaderOptionsSchema = z.object({
  path: z.string(),
  mode: z.nativeEnum(ReaderNodeMode),
  recursive: z.boolean(),
  unarchive: z.boolean(),
})

export type FolderReaderNodeOptions = z.infer<typeof folderReaderOptionsSchema>
