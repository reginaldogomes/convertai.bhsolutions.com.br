'use client'

import { useState } from 'react'
import { Clock, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { scheduleInstagramContent } from '@/actions/instagram'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
    contentId: string
    currentScheduledAt?: string | null
}

function toLocalDatetimeValue(isoString?: string | null): string {
    if (!isoString) return ''
    const d = new Date(isoString)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function minDatetime(): string {
    const d = new Date(Date.now() + 5 * 60 * 1000) // min 5 min from now
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ScheduleButton({ contentId, currentScheduledAt }: Props) {
    const [open, setOpen] = useState(false)
    const [datetime, setDatetime] = useState(toLocalDatetimeValue(currentScheduledAt) || '')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSchedule() {
        if (!datetime) { toast.error('Selecione uma data e hora'); return }
        setLoading(true)
        try {
            const result = await scheduleInstagramContent(contentId, new Date(datetime).toISOString())
            if (result.success) {
                toast.success('Post agendado com sucesso!')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao agendar')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                <Clock className="w-3.5 h-3.5" />
                {currentScheduledAt ? 'Reagendar' : 'Agendar'}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={e => e.target === e.currentTarget && setOpen(false)}
                >
                    <div className="bg-card border border-border rounded-(--radius) w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="font-bold text-sm">Agendar Publicação</span>
                            </div>
                            <button onClick={() => setOpen(false)}>
                                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Data e Hora de Publicação</Label>
                                <input
                                    type="datetime-local"
                                    value={datetime}
                                    min={minDatetime()}
                                    onChange={e => setDatetime(e.target.value)}
                                    className="w-full h-9 px-3 rounded-(--radius) border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {datetime && (
                                <p className="text-xs text-muted-foreground">
                                    Publicará em: <strong className="text-foreground">
                                        {new Date(datetime).toLocaleString('pt-BR', {
                                            weekday: 'long', day: '2-digit', month: 'long',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </strong>
                                </p>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={handleSchedule}
                                    disabled={loading || !datetime}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    {loading ? 'Agendando...' : 'Agendar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
