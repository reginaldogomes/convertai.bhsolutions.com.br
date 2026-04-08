import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface InlineErrorProps {
  message: string
  className?: string
  size?: "sm" | "md"
}

export function InlineError({ message, className, size = "md" }: InlineErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 text-destructive",
        size === "sm" ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-sm",
        className
      )}
    >
      <AlertCircle className={cn("mt-0.5 shrink-0", size === "sm" ? "size-3.5" : "size-4")} />
      <span>{message}</span>
    </div>
  )
}
