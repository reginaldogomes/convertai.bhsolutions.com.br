import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionTitleProps {
  /** Small uppercase kicker above the heading (e.g. "Funcionalidades") */
  kicker?: React.ReactNode
  /** Main heading — styled as h2 */
  title: React.ReactNode
  /** Supporting paragraph below the heading */
  description?: React.ReactNode
  /** Horizontal alignment of all text */
  align?: "left" | "center" | "right"
  /** Decorative accent bar below the kicker */
  accent?: boolean
  className?: string
  /** Max-width class for the description (default: max-w-2xl) */
  descriptionWidth?: string
}

/**
 * SectionTitle — landing section header block.
 *
 * Standardises kicker + heading + description across all landing sections.
 * Keeps typography consistent without copy-pasting class strings.
 *
 * @example
 * <SectionTitle
 *   kicker="Como funciona"
 *   title="Crie conteúdo que converte em segundos"
 *   description="Nossa IA analisa seu nicho e gera posts otimizados automaticamente."
 *   align="center"
 *   accent
 * />
 */
export function SectionTitle({
  kicker,
  title,
  description,
  align = "center",
  accent = false,
  className,
  descriptionWidth = "max-w-2xl",
}: SectionTitleProps) {
  const alignClass = {
    left:   "items-start text-left",
    center: "items-center text-center",
    right:  "items-end text-right",
  }[align]

  return (
    <div className={cn("flex flex-col gap-4", alignClass, className)}>
      {kicker && (
        <div className={cn("flex flex-col gap-2", alignClass)}>
          <span className="lp-label text-[hsl(var(--primary))]">
            {kicker}
          </span>
          {accent && (
            <span
              aria-hidden
              className="block h-0.5 w-10 rounded-full bg-[hsl(var(--primary))]"
            />
          )}
        </div>
      )}

      <h2 className="text-h2 text-balance text-[hsl(var(--foreground))]">
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            "text-base leading-relaxed text-[hsl(var(--foreground-secondary))]",
            descriptionWidth
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}

/* ── Lightweight variant for dashboard page headers ── */

interface DashboardSectionTitleProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * DashboardSectionTitle — compact heading for dashboard page areas.
 *
 * @example
 * <DashboardSectionTitle
 *   title="Publicações recentes"
 *   description="Seus últimos 30 posts do Instagram"
 *   actions={<Button size="sm">Ver todos</Button>}
 * />
 */
export function DashboardSectionTitle({
  title,
  description,
  actions,
  className,
}: DashboardSectionTitleProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[hsl(var(--foreground-muted))]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
