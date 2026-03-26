'use client'

import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  primaryColor: string
  children?: React.ReactNode
}

export function ChatBubble({ role, content, primaryColor, children }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full animate-message-in', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-br-sm text-white'
            : 'rounded-bl-sm border border-border bg-card text-card-foreground'
        )}
        style={isUser ? { backgroundColor: primaryColor } : undefined}
      >
        {content || children}
      </div>
    </div>
  )
}
