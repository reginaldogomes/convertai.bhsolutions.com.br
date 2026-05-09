import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: "default" | "outline" | "ghost" | "primary"
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  /** Primary and optional secondary CTA */
  actions?: [EmptyStateAction, EmptyStateAction?]
  className?: string
  /** "page" fills remaining height; "card" sits inside a card */
  layout?: "page" | "card"
}

/**
 * EmptyState
 *
 * Standard zero-data placeholder. Use whenever a list, table, or section has
 * no content to display — avoids blank white areas and guides users to act.
 *
 * @example
 * <EmptyState
 *   icon={<ImageIcon className="size-8" />}
 *   title="Nenhuma publicação ainda"
 *   description="Crie seu primeiro post para começar."
 *   actions={[{ label: "Criar publicação", onClick: () => router.push('/instagram/new') }]}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
  layout = "card",
}: EmptyStateProps) {
  const [primary, secondary] = actions ?? []

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        layout === "page"
          ? "min-h-[60vh] py-20 px-6"
          : "py-12 px-6",
        className
      )}
    >
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
          {icon}
        </div>
      )}

      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
          {title}
        </p>
        {description && (
          <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(primary || secondary) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {primary && (
            <Button
              size="sm"
              variant={primary.variant ?? "default"}
              onClick={primary.onClick}
              {...(primary.href ? { asChild: true } : {})}
            >
              {primary.href ? (
                <a href={primary.href}>{primary.label}</a>
              ) : (
                primary.label
              )}
            </Button>
          )}
          {secondary && (
            <Button
              size="sm"
              variant={secondary.variant ?? "ghost"}
              onClick={secondary.onClick}
              {...(secondary.href ? { asChild: true } : {})}
            >
              {secondary.href ? (
                <a href={secondary.href}>{secondary.label}</a>
              ) : (
                secondary.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
