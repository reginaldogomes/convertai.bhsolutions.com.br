'use client'

import { useRef, useEffect } from 'react'

interface HtmlPreviewProps {
    html: string
}

export function HtmlPreview({ html }: HtmlPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe) return

        const doc = iframe.contentDocument
        if (!doc) return

        doc.open()
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                    body {
                        margin: 0;
                        padding: 16px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #333;
                        background: #ffffff;
                    }
                    img { max-width: 100%; height: auto; }
                    a { color: #ff0000; }
                </style>
            </head>
            <body>${html}</body>
            </html>
        `)
        doc.close()

        // Auto-resize iframe to content height
        const resize = () => {
            if (iframe.contentDocument?.body) {
                const height = iframe.contentDocument.body.scrollHeight
                iframe.style.height = `${Math.max(height + 32, 400)}px`
            }
        }
        // Resize after content loads
        iframe.onload = resize
        // Also resize after a short delay for images
        const timer = setTimeout(resize, 200)
        return () => clearTimeout(timer)
    }, [html])

    return (
        <div className="border border-border rounded-(--radius) overflow-hidden bg-white">
            {/* Email envelope header */}
            <div className="bg-[hsl(222,10%,96%)] border-b border-border px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold w-10">De:</span>
                    <span className="text-xs text-foreground-secondary">noreply@suaempresa.com</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold w-10">Para:</span>
                    <span className="text-xs text-foreground-secondary">{"{{email}}"}</span>
                </div>
            </div>

            {/* iframe sandbox for HTML rendering */}
            <iframe
                ref={iframeRef}
                title="Preview do email"
                sandbox="allow-same-origin"
                className="w-full border-0 min-h-[400px]"
                style={{ background: '#ffffff' }}
            />
        </div>
    )
}
