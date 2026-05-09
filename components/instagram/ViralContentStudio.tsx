'use client'

import { useState, useRef } from 'react'
import { Zap, Copy, Check, Loader2, RefreshCw, Hash, Clock, Eye, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Caption { style: string; length: string; text: string; hook: string }
interface ContentAngle { angle: string; description: string; format: string }
interface ViralResult {
    captions: Caption[]
    hooks: string[]
    ctas: string[]
    hashtags: { niche: string[]; trending: string[]; branded: string[]; broad: string[] }
    contentAngles: ContentAngle[]
    bestPostTime: { days: string[]; times: string[]; rationale: string }
    visualSuggestion: string
    viralScore: number
    viralScoreReason: string
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copiado!')
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button onClick={copy} className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    )
}

function ScoreMeter({ score }: { score: number }) {
    const color = score >= 80 ? 'hsl(var(--success))' : score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: color }}
                />
            </div>
            <span className="text-sm font-black font-mono-data" style={{ color }}>{score}</span>
        </div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ViralContentStudio() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ViralResult | null>(null)
    const [activeCaption, setActiveCaption] = useState(0)
    const [selectedHashtags, setSelectedHashtags] = useState<Set<string>>(new Set())
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['captions', 'hooks']))
    const streamBuffer = useRef('')

    // Form state
    const [topic, setTopic] = useState('')
    const [contentType, setContentType] = useState('post')
    const [tone, setTone] = useState('engajante')
    const [objective, setObjective] = useState('engajamento')
    const [audience, setAudience] = useState('')
    const [includeEmojis, setIncludeEmojis] = useState(true)

    function toggleSection(key: string) {
        setExpandedSections(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    function toggleHashtag(tag: string) {
        setSelectedHashtags(prev => {
            const next = new Set(prev)
            next.has(tag) ? next.delete(tag) : next.add(tag)
            return next
        })
    }

    function getAllHashtags(): string[] {
        if (!result) return []
        return [
            ...result.hashtags.niche,
            ...result.hashtags.trending,
            ...result.hashtags.branded,
            ...result.hashtags.broad,
        ]
    }

    function buildFinalCaption(): string {
        const caption = result?.captions[activeCaption]?.text ?? ''
        const tags = selectedHashtags.size > 0
            ? '\n\n' + Array.from(selectedHashtags).join(' ')
            : ''
        return caption + tags
    }

    async function generate() {
        if (!topic.trim()) { toast.error('Informe um tópico'); return }
        setLoading(true)
        setResult(null)
        streamBuffer.current = ''

        try {
            const res = await fetch('/api/instagram/generate-viral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, contentType, tone, objective, audience, includeEmojis }),
            })

            if (!res.ok) throw new Error('Falha na geração')
            if (!res.body) throw new Error('Stream vazio')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                streamBuffer.current += decoder.decode(value, { stream: true })
            }

            // Parse accumulated JSON
            const text = streamBuffer.current.trim()
            // Find JSON object in the stream
            const start = text.indexOf('{')
            const end = text.lastIndexOf('}')
            if (start === -1 || end === -1) throw new Error('JSON não encontrado')

            const parsed: ViralResult = JSON.parse(text.slice(start, end + 1))
            setResult(parsed)
            setSelectedHashtags(new Set([
                ...parsed.hashtags.niche.slice(0, 5),
                ...parsed.hashtags.trending.slice(0, 5),
                ...parsed.hashtags.branded.slice(0, 2),
            ]))
            setExpandedSections(new Set(['captions', 'hooks', 'hashtags']))
        } catch (err) {
            console.error(err)
            toast.error('Erro ao gerar conteúdo. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    if (!open) {
        return (
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
            >
                <Zap className="w-4 h-4" />
                Studio Viral
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-(--radius) w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-(--radius) bg-primary/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-foreground">Studio Viral</h2>
                            <p className="text-[11px] text-muted-foreground">IA + base de conhecimento da sua marca</p>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Form */}
                    <div className="p-6 space-y-4 border-b border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs">Tópico / Tema <span className="text-destructive">*</span></Label>
                                <Input
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="Ex: lançamento do produto X, dica de produtividade, receita de bolo..."
                                    onKeyDown={e => e.key === 'Enter' && generate()}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Tipo de Conteúdo</Label>
                                <select
                                    value={contentType}
                                    onChange={e => setContentType(e.target.value)}
                                    className="w-full h-9 px-3 rounded-(--radius) border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="post">Post (imagem)</option>
                                    <option value="reel">Reel (vídeo curto)</option>
                                    <option value="carousel">Carrossel</option>
                                    <option value="story">Story</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Objetivo</Label>
                                <select
                                    value={objective}
                                    onChange={e => setObjective(e.target.value)}
                                    className="w-full h-9 px-3 rounded-(--radius) border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="engajamento">Engajamento (likes, salva)</option>
                                    <option value="alcance">Alcance viral</option>
                                    <option value="conversão">Conversão / venda</option>
                                    <option value="autoridade">Autoridade / posicionamento</option>
                                    <option value="seguidores">Ganhar seguidores</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Tom de Voz</Label>
                                <select
                                    value={tone}
                                    onChange={e => setTone(e.target.value)}
                                    className="w-full h-9 px-3 rounded-(--radius) border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="engajante">Engajante e dinâmico</option>
                                    <option value="profissional">Profissional e sério</option>
                                    <option value="humorístico">Humorístico e leve</option>
                                    <option value="inspiracional">Inspiracional e motivacional</option>
                                    <option value="educativo">Educativo e didático</option>
                                    <option value="provocativo">Provocativo e controverso</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Público-alvo (opcional)</Label>
                                <Input
                                    value={audience}
                                    onChange={e => setAudience(e.target.value)}
                                    placeholder="Ex: empreendedores 25-40 anos, mães de primeira viagem..."
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="emojis"
                                    checked={includeEmojis}
                                    onChange={e => setIncludeEmojis(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                />
                                <Label htmlFor="emojis" className="text-xs font-normal cursor-pointer">Incluir emojis estratégicos</Label>
                            </div>
                        </div>
                        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Gerando conteúdo viral com IA...</>
                            ) : (
                                <><Zap className="w-4 h-4" />Gerar Conteúdo Viral</>
                            )}
                        </Button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="p-6 space-y-5">
                            {/* Viral Score */}
                            <div className="bg-secondary/60 rounded-(--radius) p-4 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" /> Score Viral
                                    </span>
                                    <button
                                        onClick={generate}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Regerar
                                    </button>
                                </div>
                                <ScoreMeter score={result.viralScore} />
                                <p className="text-xs text-muted-foreground">{result.viralScoreReason}</p>
                            </div>

                            {/* Captions */}
                            <Section
                                title="Legendas"
                                icon={<Eye className="w-3.5 h-3.5" />}
                                expanded={expandedSections.has('captions')}
                                onToggle={() => toggleSection('captions')}
                            >
                                <div className="flex gap-2 mb-3">
                                    {result.captions.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveCaption(i)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                                activeCaption === i
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-border text-muted-foreground hover:border-primary/50'
                                            }`}
                                        >
                                            {c.style}
                                        </button>
                                    ))}
                                </div>
                                {result.captions[activeCaption] && (
                                    <div className="space-y-2">
                                        <div className="bg-background border border-border rounded-(--radius) p-3 relative">
                                            <p className="text-xs text-muted-foreground mb-1 font-medium">Hook:</p>
                                            <p className="text-sm font-medium text-foreground italic">"{result.captions[activeCaption].hook}"</p>
                                        </div>
                                        <div className="bg-background border border-border rounded-(--radius) p-3 relative">
                                            <div className="absolute top-2 right-2">
                                                <CopyButton text={buildFinalCaption()} />
                                            </div>
                                            <p className="text-sm text-foreground whitespace-pre-wrap pr-8">{result.captions[activeCaption].text}</p>
                                            {selectedHashtags.size > 0 && (
                                                <p className="text-xs text-primary mt-2">{Array.from(selectedHashtags).join(' ')}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Section>

                            {/* Hooks */}
                            <Section
                                title="Hooks (Primeiras Linhas)"
                                icon={<Zap className="w-3.5 h-3.5" />}
                                expanded={expandedSections.has('hooks')}
                                onToggle={() => toggleSection('hooks')}
                            >
                                <div className="space-y-2">
                                    {result.hooks.map((hook, i) => (
                                        <div key={i} className="flex items-start gap-2 bg-background border border-border rounded-(--radius) p-3">
                                            <span className="text-[10px] font-black text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}</span>
                                            <p className="text-sm flex-1 text-foreground">{hook}</p>
                                            <CopyButton text={hook} />
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            {/* CTAs */}
                            <Section
                                title="Calls to Action"
                                icon={<Plus className="w-3.5 h-3.5" />}
                                expanded={expandedSections.has('ctas')}
                                onToggle={() => toggleSection('ctas')}
                            >
                                <div className="space-y-2">
                                    {result.ctas.map((cta, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-(--radius) p-3">
                                            <p className="text-sm flex-1 text-foreground">{cta}</p>
                                            <CopyButton text={cta} />
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            {/* Hashtags */}
                            <Section
                                title={`Hashtags (${selectedHashtags.size} selecionadas)`}
                                icon={<Hash className="w-3.5 h-3.5" />}
                                expanded={expandedSections.has('hashtags')}
                                onToggle={() => toggleSection('hashtags')}
                            >
                                <div className="space-y-3">
                                    {Object.entries(result.hashtags).map(([group, tags]) => (
                                        <div key={group}>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 capitalize">{group}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleHashtag(tag)}
                                                        className={`px-2 py-0.5 rounded-full text-xs transition-colors border ${
                                                            selectedHashtags.has(tag)
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                                        }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedHashtags.size > 0 && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <CopyButton text={Array.from(selectedHashtags).join(' ')} />
                                            <span className="text-xs text-muted-foreground">Copiar selecionadas</span>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* Content Angles */}
                            <Section
                                title="Ângulos de Conteúdo"
                                icon={<Lightbulb className="w-3.5 h-3.5" />}
                                expanded={expandedSections.has('angles')}
                                onToggle={() => toggleSection('angles')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {result.contentAngles.map((a, i) => (
                                        <div key={i} className="bg-background border border-border rounded-(--radius) p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-foreground">{a.angle}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground capitalize">{a.format}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{a.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            {/* Best Time */}
                            <Section
                                title="Melhor Hora para Postar"
                                icon={<Clock className="w-3.5 h-3.5" />}
                                expanded={expandedSections.has('timing')}
                                onToggle={() => toggleSection('timing')}
                            >
                                <div className="space-y-2">
                                    <div className="flex gap-2 flex-wrap">
                                        {result.bestPostTime.days.map(d => (
                                            <span key={d} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">{d}</span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {result.bestPostTime.times.map(t => (
                                            <span key={t} className="px-2 py-0.5 bg-secondary border border-border rounded text-xs font-mono-data">{t}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{result.bestPostTime.rationale}</p>
                                </div>
                            </Section>

                            {/* Visual Suggestion */}
                            {result.visualSuggestion && (
                                <div className="bg-secondary/60 rounded-(--radius) p-4 space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sugestão Visual</p>
                                    <p className="text-sm text-foreground">{result.visualSuggestion}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Section accordion ─────────────────────────────────────────────────────────

function Section({
    title, icon, expanded, onToggle, children,
}: {
    title: string
    icon: React.ReactNode
    expanded: boolean
    onToggle: () => void
    children: React.ReactNode
}) {
    return (
        <div className="border border-border rounded-(--radius) overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
            >
                <span className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    {icon} {title}
                </span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {expanded && <div className="px-4 pb-4 pt-1">{children}</div>}
        </div>
    )
}
