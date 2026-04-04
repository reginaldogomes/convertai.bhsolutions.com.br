'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { updateCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, Code, Eye, Type, MessageSquare, Mail, Phone } from 'lucide-react'
import { GenerateCampaignAI } from './GenerateCampaignAI'
import { HtmlPreview } from './HtmlPreview'

const RichTextEditor = dynamic(() => import('./RichTextEditor').then(m => m.RichTextEditor), {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-secondary rounded-(--radius)" />,
})

const initialState = { error: '', success: false }

type EditorTab = 'code' | 'visual' | 'preview'
type CampaignChannel = 'email' | 'sms' | 'whatsapp'

const channelOptions = [
    { value: 'email' as const, label: 'Email', icon: Mail },
    { value: 'sms' as const, label: 'SMS', icon: Phone },
    { value: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
]

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

    useEffect(() => {
        if (state?.success) {
            toast.success('Campanha atualizada!')
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
        { id: 'visual', label: 'Editor Visual', icon: <Type className="w-3.5 h-3.5" /> },
        { id: 'code', label: 'Código HTML', icon: <Code className="w-3.5 h-3.5" /> },
        { id: 'preview', label: 'Visualizar Email', icon: <Eye className="w-3.5 h-3.5" /> },
    ]

    return (
        <form ref={formRef} action={action} className="space-y-6">
            <input type="hidden" name="campaign_id" value={campaignId} />
            <input type="hidden" name="channel" value={currentChannel} />
            {/* Hidden input to submit body value */}
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

            <div className="space-y-3">
                {currentChannel === 'email' ? (
                    <>
                        {/* Tab bar + AI button */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-(--radius) border border-border">
                                {tabs.map((tab) => (
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
                                    Variáveis: {"{{nome}}"}, {"{{email}}"}
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

                        {/* Code tab */}
                        {activeTab === 'code' && (
                            <Textarea
                                id="body-code"
                                rows={20}
                                value={currentBody}
                                onChange={(e) => setCurrentBody(e.target.value)}
                                className="bg-secondary border-border text-foreground rounded-(--radius) text-sm focus:border-primary resize-none font-mono text-xs leading-relaxed"
                            />
                        )}

                        {/* Visual (RTE) tab */}
                        {activeTab === 'visual' && (
                            <RichTextEditor
                                content={currentBody}
                                onChange={setCurrentBody}
                            />
                        )}

                        {/* Preview tab */}
                        {activeTab === 'preview' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider">
                                    <Eye className="w-3.5 h-3.5" />
                                    Preview — como o destinatário verá o email
                                </div>
                                <div className="max-w-[640px] mx-auto shadow-lg rounded-(--radius) overflow-hidden">
                                    <HtmlPreview html={currentBody} />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* SMS / WhatsApp — plain text editor */
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                Mensagem {currentChannel === 'sms' ? 'SMS' : 'WhatsApp'}
                            </Label>
                            <p className="text-muted-foreground text-[10px]">
                                Variáveis: {"{{nome}}"}, {"{{telefone}}"}
                                {currentChannel === 'sms' && ' • Limite: 160 caracteres por SMS'}
                            </p>
                        </div>
                        <Textarea
                            rows={8}
                            value={currentBody}
                            onChange={(e) => setCurrentBody(e.target.value)}
                            placeholder={currentChannel === 'sms' ? 'Digite a mensagem SMS...' : 'Digite a mensagem WhatsApp...'}
                            className="bg-secondary border-border text-foreground rounded-(--radius) text-sm focus:border-primary resize-none"
                        />
                        {currentChannel === 'sms' && (
                            <p className={`text-[10px] ${currentBody.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {currentBody.length}/160 caracteres
                            </p>
                        )}
                    </div>
                )}
            </div>

            {state?.error && (
                <p className="text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded-(--radius)">{state.error}</p>
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
