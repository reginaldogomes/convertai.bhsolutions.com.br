import { cn } from "@/lib/utils"

/**
 * Skeleton — content placeholder with shimmer animation.
 * Uses the `.skeleton` utility from globals.css for consistent
 * brand-aligned loading states across light and dark themes.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
