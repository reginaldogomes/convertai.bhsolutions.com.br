import * as React from "react"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

import { cn } from "@/lib/utils"

type NoticeVariant = "success" | "warning" | "info" | "destructive"

interface InlineNoticeProps {
  message: React.ReactNode
  title?: string
  variant?: NoticeVariant
  className?: string
  size?: "sm" | "md"
}

const variantClasses: Record<NoticeVariant, string> = {
  success: "border-[hsl(var(--success))]/20 bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-border bg-muted/50 text-foreground-secondary",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
}

const variantIcons: Record<NoticeVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  destructive: AlertTriangle,
}

export function InlineNotice({
  message,
  title,
  variant = "info",
  className,
  size = "md",
}: InlineNoticeProps) {
  const Icon = variantIcons[variant]

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-(--radius) border",
        size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        variantClasses[variant],
        className
      )}
    >
      <Icon className={cn("mt-0.5 shrink-0", size === "sm" ? "size-3.5" : "size-4")} />
      <div>
        {title ? <p className="mb-1 font-bold uppercase tracking-wider">{title}</p> : null}
        <div>{message}</div>
      </div>
    </div>
  )
}
