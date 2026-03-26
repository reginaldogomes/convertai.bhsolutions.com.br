'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

    const sendMessage = async () => {
        const text = input.trim()
        if (!text || isLoading) return

        const visitorId = getVisitorId()
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const res = await fetch(`/api/chat/${pageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, visitorId, sessionId }),
            })

            if (!res.ok) throw new Error('Chat error')

            // Read streaming response
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            const assistantId = crypto.randomUUID()
            let assistantContent = ''

            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    // Parse Vercel AI SDK data stream format
                    const lines = chunk.split('\n')
                    for (const line of lines) {
                        if (line.startsWith('0:')) {
                            // Text delta
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
                            } catch { /* skip unparseable chunks */ }
                        }
                    }
                }
            }

            // Extract sessionId from cookie or response header if available
            if (!sessionId) {
                // The session will be tracked server-side; we just keep the conversation going
                setSessionId(assistantId) // placeholder — real session is server-managed
            }
        } catch {
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
                    'fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full',
                    'shadow-xl ring-1 ring-black/10',
                    'transition-all duration-200 hover:scale-110 hover:shadow-2xl',
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
            <div
                className={cn(
                    'fixed bottom-6 right-6 z-50 flex flex-col',
                    'w-[calc(100vw-3rem)] max-w-95 h-140 max-h-[85dvh]',
                    'rounded-2xl overflow-hidden',
                    'border border-gray-200 dark:border-gray-700/60',
                    'bg-white dark:bg-gray-900',
                    'shadow-2xl shadow-black/15',
                    'transition-all duration-300 origin-bottom-right',
                    isOpen
                        ? 'opacity-100 scale-100 animate-widget-open pointer-events-auto'
                        : 'opacity-0 scale-90 pointer-events-none'
                )}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3.5 shrink-0"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight truncate">{chatbotName}</p>
                            <p className="text-[11px] text-white/70 leading-tight mt-0.5">Online · resposta imediata</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors shrink-0 ml-2"
                        aria-label="Fechar chat"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/80 dark:bg-gray-800/40 scroll-smooth">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                'flex animate-message-in',
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                    msg.role === 'user'
                                        ? 'text-white rounded-tr-sm shadow-sm'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600/50 rounded-tl-sm shadow-sm'
                                )}
                                style={msg.role === 'user' ? { backgroundColor: primaryColor } : undefined}
                            >
                                {msg.content ? msg.content : <TypingDots />}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 pt-2.5 pb-3 border-t border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 shrink-0">
                    <form
                        onSubmit={(e) => { e.preventDefault(); sendMessage() }}
                        className="flex items-center gap-2"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className={cn(
                                'flex-1 px-3.5 py-2.5 text-sm rounded-xl',
                                'border border-gray-200 dark:border-gray-600/80',
                                'bg-gray-50 dark:bg-gray-800',
                                'text-gray-900 dark:text-gray-100',
                                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                                'focus:outline-none focus:border-gray-300 dark:focus:border-gray-500',
                                'transition-colors duration-150 disabled:opacity-60'
                            )}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0',
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
                    <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2 select-none">
                        Powered by Antigravity
                    </p>
                </div>
            </div>
        </>
    )
}
