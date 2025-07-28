import React, { useContext, useState } from "react"
import { NodesContext, NodesDispatchContext } from "~/context/contexts"
import { Check, Copy, FileUp } from "lucide-react"
import { nodesToString, stringToNodes } from "~/lib/utils"
import { useToast } from "~/components/ui/use-toast"
import { Card, CardHeader, Dialog, DialogTrigger, Button, CardContent } from "~/components/ui"
import { FileUploadDialogContent } from "~/components/file-upload-dialog-content"
import { NodesActionType } from "~/types/actions"

export function CodeSection() {
  const nodes = useContext(NodesContext)
  const dispatch = useContext(NodesDispatchContext)
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">Code</h2>
        <div className="flex flex-row gap-2 ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <FileUp />
              </Button>
            </DialogTrigger>
            <FileUploadDialogContent
              onImport={(text) => {
                dispatch({
                  type: NodesActionType.IMPORT,
                  payload: stringToNodes(text),
                })
              }}
            />
          </Dialog>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(nodesToString(nodes)).then(() => {
                setIsCopied(true)
                toast({
                  title: "Copied!",
                })
                setTimeout(() => {
                  setIsCopied(false)
                }, 5000)
              })
            }}
          >
            {isCopied ? <Check /> : <Copy />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre>{nodesToString(nodes)}</pre>
      </CardContent>
    </Card>
  )
}
