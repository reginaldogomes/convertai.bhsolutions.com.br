import type { ChatSession, ChatMessage } from '@/domain/entities'
import type { ChatMessageRole } from '@/types/database'

export interface CreateChatSessionInput {
    landingPageId: string
    visitorId: string
}

export interface CreateChatMessageInput {
    sessionId: string
    role: ChatMessageRole
    content: string
}

export interface IChatSessionRepository {
    findById(id: string): Promise<ChatSession | null>
    findByVisitor(landingPageId: string, visitorId: string): Promise<ChatSession | null>
    create(input: CreateChatSessionInput): Promise<ChatSession | null>
    updateContactId(sessionId: string, contactId: string): Promise<boolean>
    updateStatus(sessionId: string, status: string): Promise<boolean>
    getMessages(sessionId: string): Promise<ChatMessage[]>
    addMessage(input: CreateChatMessageInput): Promise<ChatMessage | null>
    countByPageId(pageId: string): Promise<number>
}
