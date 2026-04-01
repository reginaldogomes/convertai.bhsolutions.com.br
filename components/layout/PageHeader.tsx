import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
    category: string
    title: string
    icon: LucideIcon
    actions?: ReactNode
}

export function PageHeader({ category, title, icon: Icon, actions }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-border pb-5">
            <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold mb-1.5">
                    {category}
                </p>
                <h1 className="text-foreground text-xl font-black tracking-tight flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[hsl(var(--primary-subtle))]">
                        <Icon className="w-4 h-4 text-primary" />
                    </span>
                    {title}
                </h1>
            </div>
            {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </div>
    )
}
