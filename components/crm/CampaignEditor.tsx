'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { updateCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { InlineError } from '@/components/ui/inline-error'
import { Save, Code, Eye, Type, MessageSquare, Mail, Phone, Smartphone } from 'lucide-react'
import { GenerateCampaignAI } from './GenerateCampaignAI'
import { GenerateWhatsAppAI } from './GenerateWhatsAppAI'
import { HtmlPreview } from './HtmlPreview'
import { WhatsAppMessagePreview } from './WhatsAppMessagePreview'

const RichTextEditor = dynamic(() => import('./RichTextEditor').then(m => m.RichTextEditor), {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-secondary rounded-(--radius)" />,
})

const initialState = { error: '', success: false }

type EditorTab = 'code' | 'visual' | 'preview'
type WhatsAppTab = 'editor' | 'preview'
type CampaignChannel = 'email' | 'sms' | 'whatsapp'

const channelOptions = [
    { value: 'email' as const, label: 'Email', icon: Mail },
    { value: 'sms' as const, label: 'SMS', icon: Phone },
    { value: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
]

const SMS_LIMIT = 160
const WHATSAPP_SOFT_LIMIT = 1000

interface CampaignEditorProps {
    campaignId: string
    name: string
    subject: string
    body: string
    channel?: string
}

export function CampaignEditor({ campaignId, name, subject, body, channel = 'email' }: CampaignEditorProps) {
    const [state, action] = useActionState(updateCampaign, initialState)
    const formRef = useRef<HTMLFormElement>(null)
    const [currentName, setCurrentName] = useState(name)
    const [currentSubject, setCurrentSubject] = useState(subject)
    const [currentBody, setCurrentBody] = useState(body)
    const [currentChannel, setCurrentChannel] = useState<CampaignChannel>(channel as CampaignChannel)
    const [activeTab, setActiveTab] = useState<EditorTab>('visual')
    const [whatsAppTab, setWhatsAppTab] = useState<WhatsAppTab>('editor')

    useEffect(() => {
        if (state?.success) {
            toast.success('Campanha atualizada!')
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    const emailTabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
        { id: 'visual', label: 'Editor Visual', icon: <Type className="w-3.5 h-3.5" /> },
        { id: 'code', label: 'Código HTML', icon: <Code className="w-3.5 h-3.5" /> },
        { id: 'preview', label: 'Visualizar', icon: <Eye className="w-3.5 h-3.5" /> },
    ]

    const smsCount = currentBody.length
    const smsParts = Math.ceil(smsCount / SMS_LIMIT) || 1
    const smsColor = smsCount > SMS_LIMIT * 3 ? 'text-destructive' : smsCount > SMS_LIMIT ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'

    const waCount = currentBody.length
    const waColor = waCount > WHATSAPP_SOFT_LIMIT ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'

    return (
        <form ref={formRef} action={action} className="space-y-6">
            <input type="hidden" name="campaign_id" value={campaignId} />
            <input type="hidden" name="channel" value={currentChannel} />
            <input type="hidden" name="body" value={currentBody} />

            {/* Channel selector */}
            <div className="space-y-1.5">
                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Canal de Envio</Label>
                <div className="flex items-center gap-1">
                    {channelOptions.map((ch) => {
                        const Icon = ch.icon
                        return (
                            <button
                                key={ch.value}
                                type="button"
                                onClick={() => setCurrentChannel(ch.value)}
                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-(--radius) ${
                                    currentChannel === ch.value
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {ch.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Campanha</Label>
                    <Input
                        required
                        id="name"
                        name="name"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                        className="bg-secondary border-border text-foreground rounded-(--radius) h-10 text-sm focus:border-primary"
                    />
                </div>

                {currentChannel === 'email' && (
                    <div className="space-y-1.5">
                        <Label htmlFor="subject" className="text-foreground-secondary text-xs uppercase tracking-wider">Assunto do Email</Label>
                        <Input
                            required
                            id="subject"
                            name="subject"
                            value={currentSubject}
                            onChange={(e) => setCurrentSubject(e.target.value)}
                            className="bg-secondary border-border text-foreground rounded-(--radius) h-10 text-sm focus:border-primary"
                        />
                    </div>
                )}
            </div>

            {/* ── Email editor ── */}
            {currentChannel === 'email' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-(--radius) border border-border">
                            {emailTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-[calc(var(--radius)-2px)] ${
                                        activeTab === tab.id
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-muted-foreground text-[10px]">
                                Variáveis: {'{{nome}}'}, {'{{email}}'}
                            </p>
                            <GenerateCampaignAI
                                campaignName={currentName}
                                campaignSubject={currentSubject}
                                onGenerated={(html) => {
                                    setCurrentBody(html)
                                    setActiveTab('preview')
                                }}
                            />
                        </div>
                    </div>

                    {activeTab === 'code' && (
                        <Textarea
                            id="body-code"
                            rows={20}
                            value={currentBody}
                            onChange={(e) => setCurrentBody(e.target.value)}
                            className="bg-secondary border-border text-foreground rounded-(--radius) focus:border-primary resize-none font-mono text-xs leading-relaxed"
                        />
                    )}
                    {activeTab === 'visual' && (
                        <RichTextEditor content={currentBody} onChange={setCurrentBody} />
                    )}
                    {activeTab === 'preview' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider">
                                <Eye className="w-3.5 h-3.5" />
                                Preview — como o destinatário verá o email
                            </div>
                            <div className="max-w-160 mx-auto shadow-lg rounded-(--radius) overflow-hidden">
                                <HtmlPreview html={currentBody} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── WhatsApp editor ── */}
            {currentChannel === 'whatsapp' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-(--radius) border border-border">
                            {([
                                { id: 'editor' as WhatsAppTab, label: 'Mensagem', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                                { id: 'preview' as WhatsAppTab, label: 'Preview', icon: <Smartphone className="w-3.5 h-3.5" /> },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setWhatsAppTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-[calc(var(--radius)-2px)] ${
                                        whatsAppTab === tab.id
                                            ? 'bg-[#005c4b] text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <GenerateWhatsAppAI
                            channel="whatsapp"
                            campaignName={currentName}
                            onGenerated={(text) => {
                                setCurrentBody(text)
                                setWhatsAppTab('preview')
                            }}
                        />
                    </div>

                    {whatsAppTab === 'editor' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground text-[10px]">
                                    Formatação: <code className="text-foreground-secondary">*negrito*</code> · <code className="text-foreground-secondary">_itálico_</code> · <code className="text-foreground-secondary">~riscado~</code>
                                </p>
                                <p className={`text-[10px] font-mono ${waColor}`}>
                                    {waCount}{waCount > WHATSAPP_SOFT_LIMIT ? ` · ⚠ acima de ${WHATSAPP_SOFT_LIMIT} chars (recomendado)` : ' chars'}
                                </p>
                            </div>
                            <Textarea
                                rows={9}
                                value={currentBody}
                                onChange={(e) => setCurrentBody(e.target.value)}
                                placeholder={'Olá *{{nome}}*! 👋\n\nTemos uma novidade especial para você...\n\nResponda essa mensagem para saber mais!'}
                                className="bg-secondary border-border text-foreground rounded-(--radius) text-sm focus:border-primary resize-none"
                            />
                            <p className="text-muted-foreground text-[10px]">
                                Variáveis: <code className="text-primary font-mono">{'{{nome}}'}</code> · <code className="text-primary font-mono">{'{{telefone}}'}</code>
                            </p>
                        </div>
                    )}

                    {whatsAppTab === 'preview' && (
                        <div className="rounded-(--radius) overflow-hidden border border-[#1f2c33]">
                            <WhatsAppMessagePreview body={currentBody} standalone />
                        </div>
                    )}
                </div>
            )}

            {/* ── SMS editor ── */}
            {currentChannel === 'sms' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Mensagem SMS</Label>
                        <GenerateWhatsAppAI
                            channel="sms"
                            campaignName={currentName}
                            onGenerated={(text) => setCurrentBody(text)}
                        />
                    </div>
                    <Textarea
                        rows={5}
                        value={currentBody}
                        onChange={(e) => setCurrentBody(e.target.value)}
                        placeholder={'Oi {{nome}}, temos uma oferta especial! Acesse [link]. Resp PARE p/ sair.'}
                        className="bg-secondary border-border text-foreground rounded-(--radius) text-sm focus:border-primary resize-none font-mono"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-[10px]">
                            Variáveis: <code className="text-primary font-mono">{'{{nome}}'}</code> · <code className="text-primary font-mono">{'{{telefone}}'}</code>
                        </p>
                        <div className="flex items-center gap-3">
                            <p className={`text-[10px] font-mono ${smsColor}`}>
                                {smsCount} chars
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                                {smsParts} SMS · {smsCount % SMS_LIMIT || SMS_LIMIT}/{SMS_LIMIT}
                            </p>
                        </div>
                    </div>
                    {smsCount > SMS_LIMIT && (
                        <div className="bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20 px-3 py-2 rounded-(--radius)">
                            <p className="text-[hsl(var(--warning))] text-xs">
                                Mensagem dividida em <strong>{smsParts} SMS</strong>. Cada SMS acima de 160 chars é cobrado separadamente.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {state?.error && (
                <InlineError message={state.error} size="sm" />
            )}

            <div className="flex justify-end">
                <Button type="submit" className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white border-0 rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <Save className="w-3.5 h-3.5" />
                    Salvar Alterações
                </Button>
            </div>
        </form>
    )
}
