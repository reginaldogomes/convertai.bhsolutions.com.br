import { promises as fs } from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import { FileText, Clock3 } from 'lucide-react'

interface ReleaseNoteEntry {
    fileName: string
    title: string
    content: string
    updatedAt: Date
}

async function getReleaseNotes(): Promise<ReleaseNoteEntry[]> {
    const operationsDir = path.join(process.cwd(), 'docs', 'operations')
    const files = await fs.readdir(operationsDir)
    const changelogFiles = files
        .filter((file) => file.startsWith('changelog-') && file.endsWith('.md'))
        .sort()
        .reverse()

    const entries = await Promise.all(
        changelogFiles.map(async (fileName) => {
            const fullPath = path.join(operationsDir, fileName)
            const [content, stat] = await Promise.all([
                fs.readFile(fullPath, 'utf8'),
                fs.stat(fullPath),
            ])

            const firstLine = content.split('\n').find((line) => line.trim().startsWith('# '))
            const title = firstLine ? firstLine.replace(/^#\s+/, '').trim() : fileName

            return {
                fileName,
                title,
                content,
                updatedAt: stat.mtime,
            }
        })
    )

    return entries
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

function renderMarkdownLite(content: string) {
    const lines = content.split('\n')

    return lines.map((rawLine, index) => {
        const line = rawLine.trimEnd()
        const key = `${index}-${line}`

        if (line.startsWith('# ')) {
            return <h1 key={key} className="text-2xl font-black tracking-tight text-foreground mt-1">{line.replace(/^#\s+/, '')}</h1>
        }

        if (line.startsWith('## ')) {
            return <h2 key={key} className="text-base font-bold uppercase tracking-wider text-foreground mt-6">{line.replace(/^##\s+/, '')}</h2>
        }

        if (line.startsWith('### ')) {
            return <h3 key={key} className="text-sm font-bold text-foreground mt-4">{line.replace(/^###\s+/, '')}</h3>
        }

        if (line.startsWith('- ')) {
            return <p key={key} className="text-sm text-foreground-secondary leading-relaxed pl-3">• {line.replace(/^-\s+/, '')}</p>
        }

        if (line.startsWith('```')) {
            return <div key={key} className="h-2" />
        }

        if (line.length === 0) {
            return <div key={key} className="h-2" />
        }

        return <p key={key} className="text-sm text-foreground-secondary leading-relaxed">{line}</p>
    })
}

export default async function ReleaseNotesPage({
    searchParams,
}: {
    searchParams?: Promise<{ note?: string }>
}) {
    const [notes, query] = await Promise.all([getReleaseNotes(), searchParams])

    if (notes.length === 0) {
        return (
            <div className="p-8">
                <div className="max-w-4xl border border-border rounded-(--radius) bg-card p-6">
                    <h1 className="text-xl font-black tracking-tight text-foreground">Release Notes</h1>
                    <p className="text-sm text-muted-foreground mt-2">Nenhum changelog encontrado em docs/operations.</p>
                </div>
            </div>
        )
    }

    const selectedFile = query?.note
    const active = notes.find((note) => note.fileName === selectedFile) ?? notes[0]

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium mb-1">Comunicação Interna</p>
                    <h1 className="text-foreground text-2xl font-black tracking-tight">Release Notes</h1>
                </div>
                <div className="text-muted-foreground/60 text-xs font-mono-data">{notes.length} versão(ões)</div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
                <aside className="bg-card border border-border rounded-(--radius) p-4 space-y-2 h-fit">
                    {notes.map((note) => {
                        const isActive = note.fileName === active.fileName
                        return (
                            <Link
                                key={note.fileName}
                                href={`/release-notes?note=${encodeURIComponent(note.fileName)}`}
                                className={`block rounded-(--radius) border px-3 py-2.5 transition-colors ${
                                    isActive
                                        ? 'border-primary bg-primary/8'
                                        : 'border-border hover:border-primary/40 hover:bg-secondary/40'
                                }`}
                            >
                                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                    {note.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                                    <Clock3 className="w-3 h-3" />
                                    {formatDate(note.updatedAt)}
                                </p>
                            </Link>
                        )
                    })}
                </aside>

                <article className="bg-card border border-border rounded-(--radius) p-6">
                    <div className="space-y-1 mb-5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Arquivo</p>
                        <p className="text-sm font-mono-data text-foreground-secondary">{active.fileName}</p>
                    </div>
                    <div className="space-y-1">{renderMarkdownLite(active.content)}</div>
                </article>
            </div>
        </div>
    )
}
