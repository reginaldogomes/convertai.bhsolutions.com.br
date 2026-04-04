export default function InstagramLoading() {
    return (
        <div className="p-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <div className="h-3 w-24 bg-secondary rounded" />
                <div className="h-7 w-32 bg-secondary rounded" />
            </div>
            {/* KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border p-5 space-y-3 rounded-(--radius)">
                        <div className="h-3 w-20 bg-secondary rounded" />
                        <div className="h-8 w-16 bg-secondary rounded" />
                    </div>
                ))}
            </div>
            {/* Auto config */}
            <div className="bg-card border border-border rounded-(--radius) p-5">
                <div className="h-48 bg-secondary rounded-(--radius)" />
            </div>
            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-(--radius) p-4 space-y-3">
                        <div className="h-40 bg-secondary rounded-(--radius)" />
                        <div className="h-4 w-3/4 bg-secondary rounded" />
                        <div className="h-3 w-1/2 bg-secondary rounded" />
                    </div>
                ))}
            </div>
        </div>
    )
}
