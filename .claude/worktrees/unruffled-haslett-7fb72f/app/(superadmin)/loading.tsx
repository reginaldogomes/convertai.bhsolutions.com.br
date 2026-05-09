export default function SuperAdminLoading() {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar skeleton */}
            <aside className="w-55 shrink-0 h-screen bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] flex flex-col animate-pulse">
                <div className="px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-muted rounded-(--radius)" />
                        <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-8 bg-muted/20 rounded-(--radius)" />
                    ))}
                </nav>
            </aside>

            {/* Main content skeleton */}
            <main className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </main>
        </div>
    )
}
