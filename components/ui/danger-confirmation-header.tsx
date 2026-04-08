import * as React from "react"
import { AlertTriangle } from "lucide-react"

interface DangerConfirmationHeaderProps {
  title: string
  subtitle?: string
  titleId?: string
}

export function DangerConfirmationHeader({
  title,
  subtitle = "Esta ação não pode ser desfeita.",
  titleId,
}: DangerConfirmationHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <div>
        <h3 id={titleId} className="text-base font-black tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
