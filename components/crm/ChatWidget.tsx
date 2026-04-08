'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChatBubble } from './ChatBubble'
import { BRAND } from '@/lib/brand'
import { buildAdsMetadata, captureAttributionFromCurrentPage } from '@/lib/ads-attribution'

interface ChatWidgetProps {
    pageId: string
    chatbotName: string
    welcomeMessage: string
    primaryColor: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

const CHAT_DEBUG = process.env.NEXT_PUBLIC_CHAT_DEBUG === 'true'

function logChatClient(event: string, payload: Record<string, unknown>) {
    if (!CHAT_DEBUG) return
    console.debug(`[chat-widget] ${event}`, payload)
}

function TypingDots() {
    return (
        <span className="inline-flex items-center gap-1 py-0.5">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce-dot opacity-50" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce-dot opacity-50" style={{ animationDelay: '160ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce-dot opacity-50" style={{ animationDelay: '320ms' }} />
        </span>
    )
}

function getVisitorId(): string {
    if (typeof window === 'undefined') return ''
    let id = localStorage.getItem('ag_visitor_id')
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('ag_visitor_id', id)
    }
    return id
}

export function ChatWidget({ pageId, chatbotName, welcomeMessage, primaryColor }: ChatWidgetProps) {
    const sessionStorageKey = `ag_chat_session_${pageId}`
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'assistant', content: welcomeMessage },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    useEffect(() => {
        if (isOpen) inputRef.current?.focus()
    }, [isOpen])

    useEffect(() => {
        captureAttributionFromCurrentPage()
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const storedSessionId = localStorage.getItem(sessionStorageKey)
        if (storedSessionId) {
            setSessionId(storedSessionId)
        }
    }, [sessionStorageKey])

    const sendMessage = async () => {
        const text = input.trim()
        if (!text || isLoading) return

        const visitorId = getVisitorId()
        const startedAt = performance.now()
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const adsMetadata = buildAdsMetadata('chat_start')

            const res = await fetch(`/api/chat/${pageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    visitorId,
                    sessionId,
                    attribution: adsMetadata.attribution,
                    eventId: adsMetadata.eventId,
                }),
            })

            const responseSessionId = res.headers.get('x-chat-session-id')
            const requestId = res.headers.get('x-chat-request-id')
            if (responseSessionId) {
                setSessionId(responseSessionId)
                localStorage.setItem(sessionStorageKey, responseSessionId)
            }

            logChatClient('request_started', {
                requestId,
                pageId,
                hasSession: Boolean(sessionId || responseSessionId),
                visitorId,
                status: res.status,
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || 'Chat error')
            }

            // Read streaming response
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            const assistantId = crypto.randomUUID()
            let assistantContent = ''
            let buffer = ''
            let isDataProtocol = false

            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    buffer += chunk

                    if (!isDataProtocol && /(^|\n)0:/.test(buffer)) {
                        isDataProtocol = true
                    }

                    if (isDataProtocol) {
                        const lines = buffer.split('\n')
                        buffer = lines.pop() ?? ''

                        for (const line of lines) {
                            if (!line.startsWith('0:')) continue

                            try {
                                const textContent = JSON.parse(line.slice(2))
                                assistantContent += textContent
                                setMessages(prev =>
                                    prev.map(m =>
                                        m.id === assistantId
                                            ? { ...m, content: assistantContent }
                                            : m
                                    )
                                )
                            } catch {
                                // Skip malformed chunks
                            }
                        }
                    } else {
                        assistantContent += chunk
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === assistantId
                                    ? { ...m, content: assistantContent }
                                    : m
                            )
                        )
                    }
                }

                const finalChunk = decoder.decode()
                if (finalChunk) {
                    if (isDataProtocol) {
                        buffer += finalChunk
                    } else {
                        assistantContent += finalChunk
                    }
                }

                if (isDataProtocol && buffer.startsWith('0:')) {
                    try {
                        const textContent = JSON.parse(buffer.slice(2))
                        assistantContent += textContent
                    } catch {
                        // Ignore trailing malformed chunk
                    }
                    setMessages(prev =>
                        prev.map(m =>
                            m.id === assistantId
                                ? { ...m, content: assistantContent }
                                : m
                        )
                    )
                }

                logChatClient('stream_completed', {
                    requestId,
                    responseLength: assistantContent.length,
                    protocol: isDataProtocol ? 'data' : 'text',
                    elapsedMs: Math.round(performance.now() - startedAt),
                })
            } else {
                const textResponse = await res.text()
                assistantContent = textResponse
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId
                            ? { ...m, content: assistantContent }
                            : m
                    )
                )

                logChatClient('text_completed', {
                    requestId,
                    responseLength: assistantContent.length,
                    elapsedMs: Math.round(performance.now() - startedAt),
                })
            }
        } catch {
            logChatClient('request_failed', {
                pageId,
                elapsedMs: Math.round(performance.now() - startedAt),
            })
            setMessages(prev => [
                ...prev,
                { id: crypto.randomUUID(), role: 'assistant', content: 'Desculpe, houve um erro. Tente novamente.' },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl',
                    'surface-overlay',
                    'transition-all duration-200 hover:scale-105 hover:shadow-2xl',
                    'focus-visible:outline-none',
                    isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
                )}
                style={{ backgroundColor: primaryColor }}
                aria-label="Abrir chat"
            >
                <MessageSquare className="w-6 h-6 text-white relative z-10" />
                <span
                    className="absolute inset-0 rounded-full animate-pulse-ring"
                    style={{ backgroundColor: primaryColor }}
                />
            </button>

            {/* Chat Window */}
            <Card
                className={cn(
                    'fixed bottom-6 right-6 z-50 flex h-[min(720px,85dvh)] w-[calc(100vw-2rem)] max-w-105 flex-col overflow-hidden p-0',
                    'origin-bottom-right rounded-2xl border-border',
                    'transition-all duration-300',
                    isOpen
                        ? 'opacity-100 scale-100 animate-widget-open pointer-events-auto'
                        : 'opacity-0 scale-90 pointer-events-none'
                )}
            >
                {/* Header */}
                <div
                    className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <MessageSquare className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight truncate">{chatbotName}</p>
                            <div className="mt-1">
                                <Badge className="border-white/30 bg-white/15 text-[10px] text-white hover:bg-white/20">Online agora</Badge>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/20 active:bg-white/30"
                        aria-label="Fechar chat"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Messages */}
                <div className="gradient-mesh bg-background flex-1 space-y-3 overflow-y-auto p-4 scroll-smooth">
                    {messages.map((msg) => (
                        <ChatBubble
                            key={msg.id}
                            role={msg.role}
                            content={msg.content}
                            primaryColor={primaryColor}
                        >
                            <TypingDots />
                        </ChatBubble>
                    ))}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-card shrink-0 border-t border-border px-3 pb-3 pt-2.5">
                    <form
                        onSubmit={(e) => { e.preventDefault(); sendMessage() }}
                        className="flex items-center gap-2"
                    >
                        <Input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className={cn(
                                'h-10 flex-1 rounded-xl bg-background',
                                'border-border focus-visible:ring-ring/30'
                            )}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                'h-10 w-10 shrink-0 rounded-xl text-white flex items-center justify-center',
                                'transition-all duration-150 shadow-sm',
                                'hover:opacity-90 hover:scale-105 active:scale-95',
                                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100'
                            )}
                            style={{ backgroundColor: primaryColor }}
                            aria-label="Enviar mensagem"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </form>
                    <p className="mt-2 select-none text-center text-[10px] text-muted-foreground">
                        Powered by {BRAND.poweredBy}
                    </p>
                </div>
            </Card>
        </>
    )
}
