import { ReactNode, useEffect, useState } from "react"
import { cn } from "~/lib/utils"

type ModalBaseProps = {
    open: boolean
    onClose: () => void
    children: ReactNode
    className?: string
}

export function ModalBase({ open, onClose, children, className }: ModalBaseProps) {
    const [mounted, setMounted] = useState(false)
    const [visible, setVisible] = useState(false)
    const [show, setShow] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        if (open) {
            setVisible(true)
            const timer = setTimeout(() => setShow(true), 10)
            return () => clearTimeout(timer)
        } else {
            setShow(false)
            const timer = setTimeout(() => setVisible(false), 200)
            return () => clearTimeout(timer)
        }
    }, [open, mounted])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (open && mounted) {
            document.addEventListener("keydown", handler)
            return () => document.removeEventListener("keydown", handler)
        }
    }, [open, mounted, onClose])

    if (!mounted || !visible) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/80 transition-opacity duration-200 ease-out",
                    show ? "opacity-100" : "opacity-0"
                )}
            />

            {/* content */}
            <div
                className={cn(
                    "relative z-50 bg-background border shadow-lg rounded-lg overflow-hidden transition-all duration-200 ease-out",
                    show
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-4",
                    "w-full max-w-lg",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}