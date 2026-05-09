export default function DashboardLoading() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <div className="h-3 w-20 bg-muted rounded mb-2" />
                    <div className="h-7 w-36 bg-muted rounded" />
                </div>
                <div className="h-3 w-48 bg-muted rounded" />
            </div>

            {/* KPI Grid skeleton */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border p-5 space-y-3 rounded-(--radius)">
                        <div className="flex items-center justify-between">
                            <div className="h-3 w-24 bg-muted rounded" />
                            <div className="h-4 w-4 bg-muted rounded" />
                        </div>
                        <div className="h-8 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>

            {/* Module Cards skeleton */}
            <div>
                <div className="h-4 w-20 bg-muted rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border p-5 rounded-(--radius) space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-muted rounded-(--radius)" />
                                <div className="h-4 w-24 bg-muted rounded" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-5 w-10 bg-muted rounded" />
                                <div className="h-5 w-10 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
