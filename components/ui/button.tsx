import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 select-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 active:translate-y-[1px] active:scale-[0.99] data-[loading=true]:pointer-events-none data-[loading=true]:opacity-70 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] shadow-sm hover:shadow-md",
        primary: "bg-linear-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] text-primary-foreground shadow-sm hover:shadow-md",
        glass: "border border-white/20 bg-white/70 text-foreground backdrop-blur-md shadow-sm hover:bg-white/85 dark:border-white/15 dark:bg-white/8 dark:text-white dark:hover:bg-white/12",
        elevated: "bg-card text-card-foreground border border-border shadow-md hover:shadow-lg hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-105 shadow-sm focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        success:
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:brightness-95 shadow-sm",
        warning:
          "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:brightness-95 shadow-sm",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:bg-accent hover:border-input",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-subtle))] shadow-xs",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
