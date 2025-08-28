import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import { ModalBase } from "~/components/ui/modal-base";
import {ScrollArea, ScrollBar} from "~/components/ui/scroll-area"

interface PipFreezeModalProps {
    open: boolean;
    onClose: () => void;
    pipFreezeData: { packages: { name: string; version: string }[], error: string | null };
}

export function PipFreezeModal({ open, onClose, pipFreezeData }: PipFreezeModalProps) {
    return (
        <ModalBase open={open} onClose={onClose} className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Installed Dependencies</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                >
                    <X />
                </Button>
            </div>
            <ScrollArea className="w-full rounded-md">
                <div className="p-4 h-96">
                    {pipFreezeData.error ? (
                        <div className="text-red-600 dark:text-red-400">
                            Error: {pipFreezeData.error}
                        </div>
                    ) : pipFreezeData.packages.length === 0 ? (
                        <div className="text-muted-foreground">
                            No dependencies found in the virtual environment.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {pipFreezeData.packages.map((pkg, index) => (
                                <li
                                    key={index}
                                    className="border rounded-lg p-3 bg-background text-sm flex justify-between items-center font-mono"
                                >
                                    <span className="font-semibold text-foreground">{pkg.name}</span>
                                    <span className="text-muted-foreground">{pkg.version}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
            <div className="px-4 py-3 border-t border-border bg-zinc-100 dark:bg-zinc-800 flex justify-end">
                <Button
                    variant="outline"
                    onClick={onClose}
                >
                    Close
                </Button>
            </div>
        </ModalBase>
    );
}