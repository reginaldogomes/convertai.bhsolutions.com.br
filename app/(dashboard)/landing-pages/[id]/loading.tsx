export default function LandingPageDetailLoading() {
    return (
        <div className="p-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <div className="h-3 w-28 bg-secondary rounded" />
                <div className="h-7 w-48 bg-secondary rounded" />
            </div>
            {/* Analytics cards */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-(--radius) p-4 space-y-3">
                        <div className="h-3 w-20 bg-secondary rounded" />
                        <div className="h-7 w-12 bg-secondary rounded" />
                    </div>
                ))}
            </div>
            {/* Section builder */}
            <div className="bg-card border border-border rounded-(--radius) p-6">
                <div className="h-64 bg-secondary rounded-(--radius)" />
            </div>
            {/* Editor + Knowledge base */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-(--radius) p-6">
                    <div className="h-96 bg-secondary rounded-(--radius)" />
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-6">
                    <div className="h-96 bg-secondary rounded-(--radius)" />
                </div>
            </div>
        </div>
    )
}
