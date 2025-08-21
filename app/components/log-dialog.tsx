import { ModalBase } from "~/components/ui/modal-base"
import { Button } from "~/components/ui/button"

export function LogDialog({
                              open,
                              onClose,
                              logLines,
                          }: {
    open: boolean
    onClose: () => void
    logLines: string[]
}) {
    return (
        <ModalBase open={open} onClose={onClose} className="w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-zinc-100 dark:bg-zinc-800">
                <h2 className="text-lg font-semibold">Error Logs</h2>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-4 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {logLines.join("\n")}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-zinc-100 dark:bg-zinc-800 flex justify-end">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </ModalBase>
    )
}
