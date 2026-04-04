export default function InboxLoading() {
    return (
        <div className="flex h-full animate-pulse">
            {/* Sidebar threads */}
            <div className="w-[320px] border-r border-border bg-[hsl(var(--background-secondary))] flex flex-col h-full shrink-0">
                <div className="p-5 border-b border-border">
                    <div className="h-5 w-20 bg-secondary rounded" />
                </div>
                <div className="flex-1 space-y-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="p-4 border-b border-border space-y-2">
                            <div className="flex justify-between">
                                <div className="h-4 w-28 bg-secondary rounded" />
                                <div className="h-3 w-16 bg-secondary rounded" />
                            </div>
                            <div className="h-3 w-full bg-secondary rounded" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Chat area */}
            <div className="flex-1 flex flex-col">
                <div className="p-5 border-b border-border">
                    <div className="h-5 w-32 bg-secondary rounded" />
                </div>
                <div className="flex-1" />
                <div className="p-4 border-t border-border">
                    <div className="h-10 bg-secondary rounded-(--radius)" />
                </div>
            </div>
        </div>
    )
}
