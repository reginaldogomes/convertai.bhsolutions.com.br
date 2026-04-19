'use client'

import { CheckCheck } from 'lucide-react'

interface WhatsAppMessagePreviewProps {
    body: string
    /** Se true, mostra com o fundo verde do WhatsApp */
    standalone?: boolean
}

/**
 * Simula a aparência de uma mensagem no WhatsApp.
 * Interpreta quebras de linha, *negrito* e _itálico_ como o app faz.
 */
export function WhatsAppMessagePreview({ body, standalone = false }: WhatsAppMessagePreviewProps) {
    const formattedBody = formatWhatsAppText(body)

    return (
        <div className={standalone ? 'bg-[#0a1014] rounded-(--radius) p-4' : ''}>
            {standalone && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-bold">
                        W
                    </div>
                    <div>
                        <p className="text-white text-xs font-bold">Preview WhatsApp</p>
                        <p className="text-[#8696a0] text-[10px]">Como o destinatário verá</p>
                    </div>
                </div>
            )}

            {/* Wallpaper simulation */}
            <div
                className="rounded-(--radius) p-4 min-h-[120px] flex flex-col gap-2"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                    backgroundColor: standalone ? 'transparent' : '#0b141a',
                }}
            >
                {body.trim() ? (
                    <div className="flex justify-end">
                        <div
                            className="max-w-[80%] rounded-lg rounded-tr-none px-3 py-2 text-[13px] text-white leading-relaxed shadow-md"
                            style={{ backgroundColor: '#005c4b' }}
                        >
                            {/* Variáveis destacadas */}
                            <p
                                className="whitespace-pre-wrap break-words"
                                dangerouslySetInnerHTML={{ __html: formattedBody }}
                            />
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-[#8696a0]">agora</span>
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            </div>
                        </div>
                        {/* Tail */}
                        <div
                            className="w-0 h-0 self-start mt-0 ml-[-1px]"
                            style={{
                                borderLeft: '8px solid #005c4b',
                                borderBottom: '8px solid transparent',
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-[#8696a0] text-xs text-center my-auto">
                        Nenhuma mensagem digitada
                    </p>
                )}
            </div>

            {standalone && (
                <div className="mt-3 flex flex-col gap-0.5">
                    <p className="text-[#8696a0] text-[10px] uppercase tracking-wider">Variáveis disponíveis</p>
                    <div className="flex gap-2 flex-wrap mt-1">
                        {['{​{nome}​}', '{​{telefone}​}'].map(v => (
                            <code key={v} className="text-[10px] bg-white/5 text-[#00a884] px-1.5 py-0.5 rounded font-mono">
                                {v}
                            </code>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function formatWhatsAppText(text: string): string {
    // 1. Função para escapar caracteres HTML
    const escapeHtml = (unsafe: string) =>
        unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    // 2. Escapa o texto inteiro como primeira etapa para garantir a segurança
    let html = escapeHtml(text)

    // 3. Aplica formatação especial para variáveis (agora sobre o texto já seguro)
    html = html.replace(
        /\{\{(\w+)\}\}/g,
        '<span style="background:rgba(0,168,132,0.25);color:#25d366;border-radius:3px;padding:0 3px;font-size:12px;">{{$1}}</span>',
    )

    // Bold: *texto*
    html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')

    // Italic: _texto_
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>')

    // Strikethrough: ~texto~
    html = html.replace(/~([^~\n]+)~/g, '<s>$1</s>')

    // Monospace: ```texto```
    html = html.replace(/```([^`]+)```/g, '<code style="font-family:monospace;background:rgba(255,255,255,0.1);padding:0 2px;border-radius:2px;">$1</code>')

    // Converte quebras de linha para <br>
    html = html.replace(/\n/g, '<br/>')

    return html
}
