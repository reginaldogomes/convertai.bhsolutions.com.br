'use client'

import { useState, useActionState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCompletion } from '@ai-sdk/react'
import { saveAutoContentConfig, toggleAutoContentConfig } from '@/actions/instagram'
import { toast } from 'sonner'
import { Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { InstagramAutoConfigRow, HashtagStrategy } from '@/types/instagram'

const CONTENT_TYPES = [
    { value: 'post', label: 'Post' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },
    { value: 'carousel', label: 'Carrossel' },
]

const OBJECTIVES = [
    { value: 'engajamento', label: 'Engajamento' },
    { value: 'trafego', label: 'Tráfego' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'autoridade', label: 'Autoridade' },
    { value: 'educacional', label: 'Educacional' },
    { value: 'entretenimento', label: 'Entretenimento' },
]

const TONES = [
    { value: 'profissional', label: 'Profissional' },
    { value: 'casual', label: 'Casual' },
    { value: 'inspirador', label: 'Inspirador' },
    { value: 'humoristico', label: 'Humorístico' },
    { value: 'urgente', label: 'Urgente' },
]

const HASHTAG_STRATEGIES = [
    { value: 'trending', label: 'Trending', desc: 'Hashtags em alta' },
    { value: 'niche', label: 'Nicho', desc: 'Específicas do segmento' },
    { value: 'branded', label: 'Marca', desc: 'Hashtags próprias' },
    { value: 'mix', label: 'Mix', desc: 'Combinação equilibrada' },
]

const VISUAL_STYLES = [
    { value: 'moderno', label: 'Moderno' },
    { value: 'vibrante', label: 'Vibrante' },
    { value: 'elegante', label: 'Elegante' },
    { value: 'flat', label: 'Flat Design' },
    { value: 'foto-realista', label: 'Fotográfico' },
    { value: 'ilustracao', label: 'Ilustração' },
]

const CTA_STYLES = [
    { value: 'sutil', label: 'Sutil' },
    { value: 'direto', label: 'Direto' },
    { value: 'storytelling', label: 'Storytelling' },
]

interface AutoContentConfigProps {
    config: InstagramAutoConfigRow | null
}

export function AutoContentConfig({ config }: AutoContentConfigProps) {
    const [expanded, setExpanded] = useState(!config)
    const [showGeneration, setShowGeneration] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isPendingToggle, startToggle] = useTransition()
    const router = useRouter()

    // Form state initialized from config
    const [niche, setNiche] = useState(config?.niche || '')
    const [brandDescription, setBrandDescription] = useState(config?.brand_description || '')
    const [targetAudience, setTargetAudience] = useState(config?.target_audience || '')
    const [tone, setTone] = useState(config?.tone || 'profissional')
    const [contentTypes, setContentTypes] = useState<string[]>(config?.content_types || ['post', 'reel'])
    const [objectives, setObjectives] = useState<string[]>(config?.objectives || ['engajamento', 'autoridade'])
    const [postsPerWeek, setPostsPerWeek] = useState(config?.posts_per_week || 3)
    const [hashtagStrategy, setHashtagStrategy] = useState<HashtagStrategy>(config?.hashtag_strategy || 'mix')
    const [defaultHashtags, setDefaultHashtags] = useState(config?.default_hashtags?.join(', ') || '')
    const [visualStyle, setVisualStyle] = useState(config?.visual_style || 'moderno')
    const [ctaStyle, setCtaStyle] = useState(config?.cta_style || 'sutil')
    const [avoidTopics, setAvoidTopics] = useState(config?.avoid_topics || '')
    const [referenceProfiles, setReferenceProfiles] = useState(config?.reference_profiles?.join(', ') || '')

    const [state, action, isPending] = useActionState(saveAutoContentConfig, { error: '', success: false })

    const { completion, isLoading: isGenerating, complete } = useCompletion({
        api: '/api/instagram/generate-auto-content',
    })

    useEffect(() => {
        if (state.success) {
            toast.success('Configuração salva com sucesso!')
            queueMicrotask(() => setExpanded(false))
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state])

    function handleToggle() {
        const next = !(config?.active ?? false)
        startToggle(async () => {
            const result = await toggleAutoContentConfig(next)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(next ? 'Geração automática ativada' : 'Geração automática desativada')
                router.refresh()
            }
        })
    }

    function toggleContentType(value: string) {
        setContentTypes(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        )
    }

    function toggleObjective(value: string) {
        setObjectives(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        )
    }

    async function handleGenerate() {
        if (!config?.niche) {
            toast.error('Salve a configuração antes de gerar conteúdo')
            return
        }
        setShowGeneration(true)
        await complete('', { body: { weeks: 1 } })
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(completion)
        setCopied(true)
        toast.success('Conteúdo copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    // Summary when collapsed
    if (!expanded && config) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Nicho</p>
                            <p className="text-foreground text-sm font-bold">{config.niche}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Frequência</p>
                            <p className="text-foreground text-sm font-mono-data">{config.posts_per_week}x/semana</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Tom</p>
                            <p className="text-foreground text-sm capitalize">{config.tone}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Tipos</p>
                            <div className="flex gap-1">
                                {config.content_types.map(t => (
                                    <span key={t} className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-secondary text-foreground-secondary border border-border rounded-(--radius)">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="h-8 px-4 border-2 border-primary bg-[hsl(var(--primary-subtle))] hover:bg-[hsl(var(--primary-soft))] text-primary text-xs uppercase tracking-wider font-bold transition-colors inline-flex items-center gap-1.5 rounded-(--radius) disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Gerar Conteúdo
                        </button>
                        <button
                            type="button"
                            onClick={handleToggle}
                            disabled={isPendingToggle}
                            className={`text-[10px] uppercase font-bold tracking-widest transition-colors px-3 h-8 rounded-(--radius) border ${config.active ? 'text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)] hover:border-destructive hover:text-destructive' : 'text-muted-foreground border-border hover:border-primary hover:text-primary'} disabled:opacity-50`}
                        >
                            {isPendingToggle ? '...' : config.active ? 'On' : 'Off'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Generated content */}
                {showGeneration && completion && (
                    <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-foreground font-bold text-sm uppercase tracking-wider">Conteúdo Gerado</p>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded-(--radius) inline-flex items-center gap-1 transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <div className="bg-muted border border-border rounded-(--radius) p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{completion}</pre>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {config && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                </div>
            )}

            <form action={action} className="space-y-6">
                {/* Row 1: Core settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Nicho / Segmento *</label>
                        <input
                            name="niche"
                            value={niche}
                            onChange={e => setNiche(e.target.value)}
                            placeholder="Ex: Moda feminina, SaaS B2B, Fitness..."
                            required
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Público-Alvo</label>
                        <input
                            name="target_audience"
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value)}
                            placeholder="Ex: Mulheres 25-40, empreendedores..."
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Posts por Semana</label>
                        <input
                            name="posts_per_week"
                            type="number"
                            min={1}
                            max={14}
                            value={postsPerWeek}
                            onChange={e => setPostsPerWeek(Number(e.target.value))}
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground font-mono-data focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Brand description full width */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Descrição da Marca</label>
                    <textarea
                        name="brand_description"
                        value={brandDescription}
                        onChange={e => setBrandDescription(e.target.value)}
                        placeholder="Descreva sua marca, valores, diferenciais..."
                        rows={2}
                        className="w-full px-3 py-2 text-xs bg-background border border-border rounded-(--radius) text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                </div>

                {/* Row 2: Content types */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Tipos de Conteúdo</label>
                    <div className="flex flex-wrap gap-2">
                        {CONTENT_TYPES.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => toggleContentType(value)}
                                className={`h-8 px-3 text-xs font-bold uppercase tracking-wider border rounded-(--radius) transition-colors ${
                                    contentTypes.includes(value)
                                        ? 'bg-[hsl(var(--primary-subtle))] text-primary border-primary'
                                        : 'bg-secondary text-foreground-secondary border-border hover:border-primary/50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="content_types" value={contentTypes.join(',')} />
                </div>

                {/* Row 3: Objectives */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Objetivos</label>
                    <div className="flex flex-wrap gap-2">
                        {OBJECTIVES.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => toggleObjective(value)}
                                className={`h-8 px-3 text-xs font-bold uppercase tracking-wider border rounded-(--radius) transition-colors ${
                                    objectives.includes(value)
                                        ? 'bg-[hsl(var(--primary-subtle))] text-primary border-primary'
                                        : 'bg-secondary text-foreground-secondary border-border hover:border-primary/50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="objectives" value={objectives.join(',')} />
                </div>

                {/* Row 4: Tone, Visual, CTA, Hashtag Strategy */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Tom de Voz</label>
                        <select
                            name="tone"
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground focus:border-primary focus:outline-none transition-colors"
                        >
                            {TONES.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Estilo Visual</label>
                        <select
                            name="visual_style"
                            value={visualStyle}
                            onChange={e => setVisualStyle(e.target.value)}
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground focus:border-primary focus:outline-none transition-colors"
                        >
                            {VISUAL_STYLES.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Estilo de CTA</label>
                        <select
                            name="cta_style"
                            value={ctaStyle}
                            onChange={e => setCtaStyle(e.target.value)}
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground focus:border-primary focus:outline-none transition-colors"
                        >
                            {CTA_STYLES.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Hashtags</label>
                        <select
                            name="hashtag_strategy"
                            value={hashtagStrategy}
                            onChange={e => setHashtagStrategy(e.target.value as HashtagStrategy)}
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground focus:border-primary focus:outline-none transition-colors"
                        >
                            {HASHTAG_STRATEGIES.map(({ value, label, desc }) => (
                                <option key={value} value={value}>{label} — {desc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 5: Hashtags, reference, avoid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Hashtags Fixas</label>
                        <input
                            name="default_hashtags"
                            value={defaultHashtags}
                            onChange={e => setDefaultHashtags(e.target.value)}
                            placeholder="#marca, #slogan, #nicho"
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Perfis de Referência</label>
                        <input
                            name="reference_profiles"
                            value={referenceProfiles}
                            onChange={e => setReferenceProfiles(e.target.value)}
                            placeholder="@perfil1, @perfil2"
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Evitar Temas</label>
                        <input
                            name="avoid_topics"
                            value={avoidTopics}
                            onChange={e => setAvoidTopics(e.target.value)}
                            placeholder="Política, religião..."
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-(--radius) text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <input type="hidden" name="language" value="pt-BR" />

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="h-8 px-4 bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {isPending ? 'Salvando...' : 'Salvar Configuração'}
                    </button>
                    {config && (
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="h-8 px-4 text-xs text-muted-foreground hover:text-foreground border border-border rounded-(--radius) transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}
