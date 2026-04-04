export default function DealsLoading() {
    return (
        <div className="p-8 h-full flex flex-col min-h-0 animate-pulse">
            {/* Header */}
            <div className="space-y-2 mb-6">
                <div className="h-3 w-16 bg-secondary rounded" />
                <div className="h-7 w-40 bg-secondary rounded" />
            </div>
            {/* Pipeline columns */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-64 shrink-0 bg-card border border-border rounded-(--radius) p-4 space-y-3">
                        <div className="h-4 w-24 bg-secondary rounded" />
                        <div className="h-20 bg-secondary rounded-(--radius)" />
                        <div className="h-20 bg-secondary rounded-(--radius)" />
                        <div className="h-20 bg-secondary rounded-(--radius)" />
                    </div>
                ))}
            </div>
        </div>
    )
}
