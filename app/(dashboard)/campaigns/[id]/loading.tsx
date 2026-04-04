export default function CampaignDetailLoading() {
    return (
        <div className="p-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="border-b border-border pb-6 space-y-3">
                <div className="h-3 w-24 bg-secondary rounded" />
                <div className="h-7 w-64 bg-secondary rounded" />
                <div className="flex gap-3">
                    <div className="h-5 w-16 bg-secondary rounded" />
                    <div className="h-5 w-16 bg-secondary rounded" />
                </div>
            </div>
            {/* Editor skeleton */}
            <div className="bg-card border border-border p-6 rounded-(--radius)">
                <div className="h-96 bg-secondary rounded-(--radius)" />
            </div>
        </div>
    )
}
