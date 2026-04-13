'use client'

import { useActionState, useMemo, useState, useEffect } from 'react'
import {
    BookOpen, Plus, Search, Tag, Trash2, Pencil, ChevronDown, ChevronUp,
    FileText, Image as ImageIcon, HelpCircle, Megaphone, Settings2, Layers,
    BarChart2, Award, CheckCircle2, Upload, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InlineNotice } from '@/components/ui/inline-notice'
import {
    saveKnowledgeBaseEntry,
    saveKnowledgeBaseProfile,
    updateKnowledgeBaseEntry,
    deleteKnowledgeBaseEntry,
    uploadKnowledgeBaseImage,
    KNOWLEDGE_ENTRY_TYPES,
} from '@/actions/organization'
import type { KnowledgeEntryView } from './page'

// ─── Entry type config ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    perfil:             { label: 'Perfil',         color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', icon: Sparkles },
    organization_strategy: { label: 'Perfil',     color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', icon: Sparkles },
    produto:            { label: 'Produto',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',       icon: Layers },
    faq:                { label: 'FAQ',            color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',   icon: HelpCircle },
    processo:           { label: 'Processo',       color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',      icon: Settings2 },
    competitivo:        { label: 'Diferencial',    color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',  icon: Award },
    marca:              { label: 'Marca',          color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',      icon: Megaphone },
    politica:           { label: 'Política',       color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',  icon: FileText },
    case:               { label: 'Case',           color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', icon: BarChart2 },
    image:              { label: 'Imagem',         color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',         icon: ImageIcon },
    geral:              { label: 'Geral',          color: 'bg-muted text-muted-foreground',                                     icon: FileText },
}

function typeCfg(type: string) {
    return TYPE_CONFIG[type] ?? TYPE_CONFIG['geral']
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(val: string): string {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return val
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-components ────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    const cfg = typeCfg(type)
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
            <Icon className="w-3 h-3" aria-hidden />
            {cfg.label}
        </span>
    )
}

function CharCounter({ value, max }: { value: string; max: number }) {
    const pct = value.length / max
    const color = pct > 0.9 ? 'text-destructive' : pct > 0.7 ? 'text-amber-500' : 'text-muted-foreground'
    return <span className={`text-[11px] tabular-nums ${color}`}>{value.length}/{max}</span>
}

// ─── Stats Banner ─────────────────────────────────────────────────────────

function StatsBanner({ entries }: { entries: KnowledgeEntryView[] }) {
    const totalChars = entries.reduce((s, e) => s + e.content.length, 0)
    const typeSet = new Set(entries.map((e) => e.entryType))
    const lastUpdated = entries[0] ? formatDate(entries[0].createdAt) : '—'

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Entradas',       value: String(entries.length),                     icon: BookOpen },
                { label: 'Tipos',          value: String(typeSet.size),                        icon: Tag },
                { label: 'Caracteres',     value: totalChars.toLocaleString('pt-BR'),          icon: FileText },
                { label: 'Última entrada', value: lastUpdated,                                 icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-card border border-border rounded-(--radius) p-4 flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="text-base font-black text-foreground leading-tight mt-0.5">{value}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Entry Card ────────────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: KnowledgeEntryView }) {
    const [expanded, setExpanded] = useState(false)
    const [editing, setEditing] = useState(false)
    const [content, setContent] = useState(entry.content)
    const [updateState, updateAction, updatePending] = useActionState(updateKnowledgeBaseEntry, { error: '', success: false })
    const [deleteState, deleteAction, deletePending] = useActionState(deleteKnowledgeBaseEntry, { error: '', success: false })

    useEffect(() => {
        if (updateState.success) setEditing(false)
    }, [updateState.success])

    return (
        <div className="rounded-(--radius) border border-border bg-card overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <TypeBadge type={entry.entryType} />
                        {entry.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{entry.title}</p>
                    {!expanded && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{entry.preview}</p>
                    )}
                    {entry.imageUrl && !expanded && (
                        <p className="mt-1 text-[11px] text-sky-600 dark:text-sky-400 truncate">{entry.imageUrl}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(entry.createdAt)}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-border p-4 space-y-4">
                    {editing ? (
                        <form action={updateAction} className="space-y-3">
                            <input type="hidden" name="entryId" value={entry.id} />
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Título</Label>
                                <Input name="title" defaultValue={entry.title} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Conteúdo</Label>
                                    <CharCounter value={content} max={8000} />
                                </div>
                                <Textarea
                                    name="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={8}
                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Tags</Label>
                                <Input
                                    name="tags"
                                    defaultValue={entry.tags.join(', ')}
                                    placeholder="ex: faq, produto, pricing"
                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                                />
                            </div>
                            {updateState.error && <InlineNotice variant="destructive" message={updateState.error} size="sm" />}
                            <div className="flex items-center gap-2 pt-1">
                                <Button type="submit" disabled={updatePending} size="sm" className="h-8 px-4 text-[11px] font-bold uppercase tracking-wider">
                                    {updatePending ? 'Salvando...' : 'Salvar & Reindexar'}
                                </Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 px-3 text-[11px]" onClick={() => setEditing(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {entry.imageUrl && (
                                <div className="rounded-lg overflow-hidden border border-border max-w-xs">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={entry.imageUrl} alt={entry.title} className="w-full object-cover" />
                                </div>
                            )}
                            <pre className="text-xs text-foreground bg-[hsl(var(--background-tertiary))] rounded-lg p-3 overflow-auto whitespace-pre-wrap leading-relaxed font-sans max-h-64">
                                {entry.content}
                            </pre>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1.5 text-[11px] font-bold"
                                    onClick={() => { setEditing(true); setContent(entry.content) }}
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                </Button>
                                <form action={deleteAction}>
                                    <input type="hidden" name="entryId" value={entry.id} />
                                    <Button type="submit" disabled={deletePending} variant="destructive" size="sm" className="h-8 gap-1.5 text-[11px] font-bold">
                                        <Trash2 className="w-3.5 h-3.5" /> {deletePending ? 'Removendo...' : 'Remover'}
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Tab: Entries list ─────────────────────────────────────────────────────

function EntriesTab({ entries }: { entries: KnowledgeEntryView[] }) {
    const [search, setSearch] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [newState, newAction, newPending] = useActionState(saveKnowledgeBaseEntry, { error: '', success: false })
    const [showForm, setShowForm] = useState(false)
    const [newContent, setNewContent] = useState('')

    useEffect(() => {
        if (newState.success) { setShowForm(false); setNewContent('') }
    }, [newState.success])

    const allTags = useMemo(() => {
        const counts = new Map<string, number>()
        for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }))
    }, [entries])

    const filtered = useMemo(() => {
        return entries.filter((e) => {
            const q = search.trim().toLowerCase()
            const matchSearch = !q || e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
            const matchTag    = !selectedTag  || e.tags.includes(selectedTag)
            const matchType   = !selectedType || e.entryType === selectedType
            return matchSearch && matchTag && matchType
        })
    }, [entries, search, selectedTag, selectedType])

    const uniqueTypes = useMemo(() => Array.from(new Set(entries.map((e) => e.entryType))), [entries])

    return (
        <div className="space-y-5">
            {/* Add entry toggle */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {filtered.length} entrada{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
                </p>
                <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowForm((v) => !v)}
                    className="h-8 gap-1.5 text-xs font-bold"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Entrada
                </Button>
            </div>

            {/* New entry form */}
            {showForm && (
                <div className="bg-card border border-primary/30 rounded-(--radius) p-5 space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" /> Adicionar Entrada Livre
                    </h3>

                    {newState.success && <InlineNotice variant="success" message="Entrada salva e indexada com sucesso." size="sm" />}
                    {newState.error  && <InlineNotice variant="destructive" message={newState.error} size="sm" />}

                    <form action={newAction} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Título *</Label>
                                <Input
                                    name="title"
                                    required
                                    placeholder="Ex: Política de devolução"
                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Tipo</Label>
                                <select
                                    name="type"
                                    className="w-full h-9 rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                    {KNOWLEDGE_ENTRY_TYPES.map(({ value, label }) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Conteúdo *</Label>
                                <CharCounter value={newContent} max={8000} />
                            </div>
                            <Textarea
                                name="content"
                                required
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                rows={7}
                                placeholder="Descreva em detalhes. Este conteúdo será usado pela IA para responder perguntas dos usuários."
                                className="bg-[hsl(var(--background-tertiary))] border-border text-foreground text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Tags</Label>
                            <Input
                                name="tags"
                                placeholder="ex: faq, preço, entrega (separar por vírgula)"
                                className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Button type="submit" disabled={newPending} size="sm" className="h-9 px-6 text-xs font-bold uppercase tracking-wider">
                                {newPending ? 'Salvando...' : 'Salvar e Indexar'}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-9 px-4 text-xs">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por título ou conteúdo..."
                        className="pl-8 h-9 bg-[hsl(var(--background-tertiary))] border-border text-foreground text-sm"
                    />
                </div>

                {/* Type pills */}
                {uniqueTypes.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedType(null)}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!selectedType ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'}`}
                        >
                            Todos
                        </button>
                        {uniqueTypes.map((type) => {
                            const cfg = typeCfg(type)
                            const active = selectedType === type
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedType(active ? null : type)}
                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${active ? cfg.color + ' ring-2 ring-offset-1 ring-primary/30' : 'border border-border text-muted-foreground hover:text-foreground'}`}
                                >
                                    {cfg.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Tag pills */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {allTags.slice(0, 20).map(({ tag, count }) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${selectedTag === tag ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                            >
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                                <span className="opacity-60">({count})</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                        {entries.length === 0 ? 'Nenhuma entrada na base de conhecimento ainda.' : 'Nenhuma entrada corresponde aos filtros.'}
                    </p>
                    {entries.length === 0 && (
                        <Button type="button" size="sm" className="mt-4 gap-1.5" onClick={() => setShowForm(true)}>
                            <Plus className="w-3.5 h-3.5" /> Adicionar primeira entrada
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Tab: Strategic Profile ────────────────────────────────────────────────

function ProfileTab() {
    const [state, action, pending] = useActionState(saveKnowledgeBaseProfile, { error: '', success: false })
    const inputCls = 'bg-[hsl(var(--background-tertiary))] border-border text-foreground'

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-(--radius) p-6">
                <div className="flex items-start gap-3 mb-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-foreground font-bold tracking-tight">Perfil Estratégico da Empresa</h2>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Contexto estruturado que a IA usa para gerar landing pages, campanhas, respostas do chatbot e SEO.
                        </p>
                    </div>
                </div>

                {state.success && <InlineNotice variant="success" message="Perfil salvo na base de conhecimento com sucesso." className="mb-4" size="sm" />}
                {state.error   && <InlineNotice variant="destructive" message={state.error} className="mb-4" size="sm" />}

                <form action={action} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Resumo da Empresa</Label>
                        <Textarea name="companySummary" rows={4} placeholder="Quem é a empresa, história, proposta de valor principal..." className={inputCls} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nicho de Atuação</Label>
                            <Textarea name="niche" rows={3} placeholder="Ex: consultoria de IA para e-commerce, SaaS B2B..." className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Público-alvo / Persona</Label>
                            <Textarea name="targetAudience" rows={3} placeholder="Persona, segmento, momento de compra, dores..." className={inputCls} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Cultura e Valores</Label>
                            <Textarea name="culture" rows={3} placeholder="Princípios, estilo de atendimento, posicionamento ético..." className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Tom de Voz da Marca</Label>
                            <Textarea name="brandVoice" rows={3} placeholder="Ex: consultivo, direto, premium, didático, informal..." className={inputCls} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Produtos e Serviços Oferecidos</Label>
                        <Textarea name="productsAndServices" rows={5} placeholder="Detalhe ofertas, pacotes, entregáveis, faixas de preço, diferenças entre planos..." className={inputCls} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Diferenciais Competitivos</Label>
                            <Textarea name="differentiators" rows={4} placeholder="O que torna sua empresa única frente aos concorrentes..." className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Objeções Comuns e Respostas</Label>
                            <Textarea name="objectionsAndFaq" rows={4} placeholder="Dúvidas recorrentes, objeções comerciais e como responder..." className={inputCls} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Tags Estratégicas</Label>
                        <Input name="tags" placeholder="ex: ecommerce, moda, ticket-medio, b2b" className={`${inputCls} h-9`} />
                        <p className="text-xs text-muted-foreground">Separe por vírgula. Estas tags melhoram a recuperação semântica (RAG).</p>
                    </div>

                    <Button type="submit" disabled={pending} className="h-9 px-6 text-xs font-bold uppercase tracking-wider">
                        {pending ? 'Salvando...' : 'Salvar na Base de Conhecimento'}
                    </Button>
                </form>
            </div>
        </div>
    )
}

// ─── Tab: Images ───────────────────────────────────────────────────────────

function ImageCard({ entry }: { entry: KnowledgeEntryView }) {
    const [, deleteAction, deletePending] = useActionState(deleteKnowledgeBaseEntry, { error: '', success: false })
    return (
        <div className="group relative rounded-lg overflow-hidden border border-border bg-muted aspect-square">
            {entry.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <p className="text-white text-[11px] font-semibold text-center line-clamp-3">{entry.title}</p>
                <form action={deleteAction} className="mt-2">
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button type="submit" disabled={deletePending} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px] font-bold">
                        <Trash2 className="w-3 h-3" /> {deletePending ? '...' : 'Remover'}
                    </button>
                </form>
            </div>
        </div>
    )
}

function ImagesTab({ entries }: { entries: KnowledgeEntryView[] }) {
    const [state, action, pending] = useActionState(uploadKnowledgeBaseImage, { error: '', success: false })
    const imageEntries = entries.filter((e) => e.entryType === 'image' || e.imageUrl)
    const inputCls = 'bg-[hsl(var(--background-tertiary))] border-border text-foreground'

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-(--radius) p-6">
                <div className="flex items-start gap-3 mb-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                        <Upload className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                        <h2 className="text-foreground font-bold tracking-tight">Upload de Imagens</h2>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Envie imagens com contexto descritivo. O conteúdo será indexado para recuperação semântica (RAG).
                        </p>
                    </div>
                </div>

                {state.success && <InlineNotice variant="success" message="Imagem enviada e indexada na base de conhecimento." className="mb-4" size="sm" />}
                {state.error   && <InlineNotice variant="destructive" message={state.error} className="mb-4" size="sm" />}

                <form action={action} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Arquivo da Imagem *</Label>
                            <Input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className={`${inputCls} h-10`} required />
                            <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · até 8 MB</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Título *</Label>
                            <Input name="imageTitle" placeholder="Ex: Catálogo visual da coleção verão" className={`${inputCls} h-9`} required />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Descrição da Imagem</Label>
                        <Textarea name="imageDescription" rows={3} placeholder="Explique o que aparece na imagem e por que é relevante para o negócio." className={inputCls} />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Textos presentes na imagem</Label>
                        <Textarea name="imageExtractedText" rows={3} placeholder="Copie textos visíveis: slogans, títulos, preços, chamadas. Melhora a recuperação semântica." className={inputCls} />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Tags</Label>
                        <Input name="imageTags" placeholder="ex: vitrine, branding, produto" className={`${inputCls} h-9`} />
                    </div>

                    <Button type="submit" disabled={pending} className="h-9 px-6 text-xs font-bold uppercase tracking-wider">
                        {pending ? 'Enviando...' : 'Enviar e Indexar'}
                    </Button>
                </form>
            </div>

            {/* Gallery of indexed images */}
            {imageEntries.length > 0 && (
                <div className="bg-card border border-border rounded-(--radius) p-6">
                    <h3 className="text-foreground font-bold tracking-tight mb-4">Imagens Indexadas ({imageEntries.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imageEntries.map((e) => (
                            <ImageCard key={e.id} entry={e} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main KnowledgeTabs ────────────────────────────────────────────────────

type Tab = 'entries' | 'profile' | 'images'

const TAB_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'entries', label: 'Entradas',           icon: BookOpen },
    { id: 'profile', label: 'Perfil Estratégico', icon: Sparkles },
    { id: 'images',  label: 'Imagens',            icon: ImageIcon },
]

export function KnowledgeTabs({ entries }: { entries: KnowledgeEntryView[] }) {
    const [tab, setTab] = useState<Tab>('entries')

    return (
        <div className="space-y-6">
            <StatsBanner entries={entries} />

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-border pb-1">
                {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-(--radius) transition-colors ${
                            tab === id
                                ? 'text-primary border-b-2 border-primary -mb-px'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {id === 'entries' && entries.length > 0 && (
                            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1 text-[11px] font-bold text-primary">
                                {entries.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === 'entries' && <EntriesTab entries={entries} />}
            {tab === 'profile' && <ProfileTab />}
            {tab === 'images'  && <ImagesTab entries={entries} />}
        </div>
    )
}
