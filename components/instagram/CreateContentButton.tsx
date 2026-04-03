'use client'

import { useState, useActionState, useEffect } from 'react'
import { createInstagramContent } from '@/actions/instagram'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Image, Film, Clock, SquareStack } from 'lucide-react'
import { toast } from 'sonner'

const CONTENT_TYPES = [
    { value: 'post', label: 'Post', icon: Image },
    { value: 'story', label: 'Story', icon: Clock },
    { value: 'reel', label: 'Reel', icon: Film },
    { value: 'carousel', label: 'Carrossel', icon: SquareStack },
]

export function CreateContentButton() {
    const [open, setOpen] = useState(false)
    const [contentType, setContentType] = useState('post')
    const [mediaUrls, setMediaUrls] = useState<string[]>([''])
    const [state, action, isPending] = useActionState(createInstagramContent, { error: '', success: false })

    useEffect(() => {
        if (state.success) {
            toast.success('Conteúdo criado com sucesso!')
            queueMicrotask(() => {
                setOpen(false)
                setMediaUrls([''])
            })
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    Novo Conteúdo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Criar Conteúdo</DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-4">
                    {/* Type Selection */}
                    <div className="space-y-2">
                        <Label>Tipo de Conteúdo</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {CONTENT_TYPES.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setContentType(value)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                                        contentType === value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border bg-muted/40 hover:border-primary/50'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="type" value={contentType} />
                    </div>

                    {/* Caption */}
                    <div className="space-y-2">
                        <Label htmlFor="caption">Legenda</Label>
                        <Textarea
                            id="caption"
                            name="caption"
                            placeholder="Escreva a legenda do seu conteúdo..."
                            rows={4}
                            maxLength={2200}
                        />
                    </div>

                    {/* Media URLs */}
                    <div className="space-y-2">
                        <Label>URLs de Media</Label>
                        {mediaUrls.map((url, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value={url}
                                    onChange={(e) => {
                                        const updated = [...mediaUrls]
                                        updated[i] = e.target.value
                                        setMediaUrls(updated)
                                    }}
                                />
                                {mediaUrls.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setMediaUrls(mediaUrls.filter((_, j) => j !== i))}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        ))}
                        {contentType === 'carousel' && mediaUrls.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setMediaUrls([...mediaUrls, ''])}
                            >
                                + Adicionar mídia
                            </Button>
                        )}
                        <input type="hidden" name="media_urls" value={JSON.stringify(mediaUrls.filter(Boolean))} />
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-2">
                        <Label htmlFor="hashtags">Hashtags (separadas por vírgula)</Label>
                        <Input
                            id="hashtags"
                            name="hashtags"
                            placeholder="marketing, digital, instagram"
                        />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Criando...' : 'Criar Conteúdo'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
