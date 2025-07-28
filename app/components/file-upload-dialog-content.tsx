import type { ChangeEvent } from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export function FileUploadDialogContent({ onImport }: { onImport: (text: string) => void }) {
  const [text, setText] = useState("")
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload config</DialogTitle>
      </DialogHeader>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="file-config">Config</Label>
        <Input
          id="file-config"
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
              const file = e.target.files[0]
              file.text().then((text) => {
                setText(text)
              })
            }
          }}
        />
      </div>
      <DialogFooter className="sm:justify-end">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            disabled={text === ""}
            onClick={() => {
              onImport(text)
            }}
          >
            Import
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
