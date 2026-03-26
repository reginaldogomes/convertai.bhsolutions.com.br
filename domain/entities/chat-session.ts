import type { ChatSessionStatus, ChatMessageRole } from '@/types/database'

export interface ChatSessionProps {
    id: string
    landingPageId: string
    contactId: string | null
    visitorId: string
    status: ChatSessionStatus
    createdAt: string
    updatedAt: string
}

export interface ChatMessageProps {
    id: string
    sessionId: string
    role: ChatMessageRole
    content: string
    createdAt: string
}

export class ChatSession {
    constructor(public readonly props: ChatSessionProps) {}

    get id() { return this.props.id }
    get landingPageId() { return this.props.landingPageId }
    get contactId() { return this.props.contactId }
    get visitorId() { return this.props.visitorId }
    get status() { return this.props.status }
    get createdAt() { return this.props.createdAt }
    get updatedAt() { return this.props.updatedAt }

    isActive(): boolean { return this.status === 'active' }
    hasLead(): boolean { return this.contactId !== null }

    static fromRow(row: {
        id: string
        landing_page_id: string
        contact_id: string | null
        visitor_id: string
        status: string
        created_at: string
        updated_at: string
    }): ChatSession {
        return new ChatSession({
            id: row.id,
            landingPageId: row.landing_page_id,
            contactId: row.contact_id,
            visitorId: row.visitor_id,
            status: row.status as ChatSessionStatus,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        })
    }
}

export class ChatMessage {
    constructor(public readonly props: ChatMessageProps) {}

    get id() { return this.props.id }
    get sessionId() { return this.props.sessionId }
    get role() { return this.props.role }
    get content() { return this.props.content }
    get createdAt() { return this.props.createdAt }

    isUser(): boolean { return this.role === 'user' }
    isAssistant(): boolean { return this.role === 'assistant' }

    static fromRow(row: {
        id: string
        session_id: string
        role: string
        content: string
        created_at: string
    }): ChatMessage {
        return new ChatMessage({
            id: row.id,
            sessionId: row.session_id,
            role: row.role as ChatMessageRole,
            content: row.content,
            createdAt: row.created_at,
        })
    }
}
