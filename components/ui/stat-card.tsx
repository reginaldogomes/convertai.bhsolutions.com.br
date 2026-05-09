import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ── Trend helpers ─────────────────────────────────────────────────── */

type TrendDirection = "up" | "down" | "neutral"

function getTrendDirection(value: number): TrendDirection {
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "neutral"
}

const trendClasses: Record<TrendDirection, string> = {
  up:      "text-[hsl(var(--success))]",
  down:    "text-[hsl(var(--destructive))]",
  neutral: "text-[hsl(var(--foreground-muted))]",
}

const TrendIcon: Record<TrendDirection, React.ElementType> = {
  up:      TrendingUp,
  down:    TrendingDown,
  neutral: Minus,
}

/* ── Variant config ─────────────────────────────────────────────────── */

const statCardVariants = cva(
  "relative flex flex-col gap-3 rounded-(--radius) border p-5 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--card))] border-[hsl(var(--border-subtle))] shadow-(--shadow-sm)",
        glass:   "bg-[hsl(var(--card)/0.74)] border-[hsl(var(--border)/0.6)] backdrop-blur-md shadow-(--shadow-sm)",
        primary: "bg-[hsl(var(--primary-subtle))] border-[hsl(var(--primary))]/15",
      },
      interactive: {
        true:  "cursor-pointer hover:-translate-y-0.5 hover:shadow-(--shadow-md)",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
)

/* ── Component ─────────────────────────────────────────────────────── */

interface StatCardProps extends VariantProps<typeof statCardVariants> {
  /** Label above the metric (e.g. "Seguidores") */
  label: string
  /** Primary metric value — any formatted string */
  value: React.ReactNode
  /** Supporting line below the value (e.g. "últimos 30 dias") */
  description?: React.ReactNode
  /** Icon displayed top-right */
  icon?: React.ReactNode
  /**
   * Percentage change compared to previous period.
   * Positive → green TrendingUp, Negative → red TrendingDown.
   */
  trend?: number
  /** Replace default trend label (e.g. "vs. mês anterior") */
  trendLabel?: string
  className?: string
  onClick?: () => void
}

/**
 * StatCard — KPI / metric display block.
 *
 * @example
 * <StatCard
 *   label="Taxa de engajamento"
 *   value="4.7%"
 *   trend={+12.3}
 *   trendLabel="vs. semana passada"
 *   icon={<BarChart2 className="size-4" />}
 * />
 */
export function StatCard({
  label,
  value,
  description,
  icon,
  trend,
  trendLabel,
  variant,
  interactive,
  className,
  onClick,
}: StatCardProps) {
  const direction = trend !== undefined ? getTrendDirection(trend) : "neutral"
  const TIcon = TrendIcon[direction]

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick() } : undefined}
      className={cn(statCardVariants({ variant, interactive: !!onClick || !!interactive }), className)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--foreground-muted))]">
          {label}
        </p>
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground-secondary))]">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-extrabold leading-none tracking-tight text-[hsl(var(--foreground))]">
        {value}
      </p>

      {/* Footer */}
      {(trend !== undefined || description) && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend !== undefined && (
            <span className={cn("flex items-center gap-0.5 font-medium", trendClasses[direction])}>
              <TIcon className="size-3.5" />
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {description && (
            <span className="text-[hsl(var(--foreground-muted))]">
              {description}
            </span>
          )}
          {trend !== undefined && trendLabel && (
            <span className="text-[hsl(var(--foreground-muted))]">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
