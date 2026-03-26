import type { MessageChannel, MessageDirection } from '@/types/database'

export interface MessageProps {
    id: string
    organizationId: string
    contactId: string
    channel: MessageChannel
    content: string
    direction: MessageDirection
    metadata: unknown
    createdAt: string
}

export interface MessageThread {
    contact: { id: string; name: string; phone: string | null }
    messages: Message[]
    lastActivity: string
}

export class Message {
    constructor(public readonly props: MessageProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get contactId() { return this.props.contactId }
    get channel() { return this.props.channel }
    get content() { return this.props.content }
    get direction() { return this.props.direction }
    get createdAt() { return this.props.createdAt }

    isInbound(): boolean {
        return this.direction === 'inbound'
    }

    static groupByThread(messages: Message[], contactMap: Map<string, { id: string; name: string; phone: string | null }>): MessageThread[] {
        const threadMap = new Map<string, MessageThread>()

        for (const msg of messages) {
            const contact = contactMap.get(msg.contactId)
            if (!contact) continue

            const existing = threadMap.get(msg.contactId)
            if (existing) {
                existing.messages.push(msg)
            } else {
                threadMap.set(msg.contactId, {
                    contact,
                    messages: [msg],
                    lastActivity: msg.createdAt,
                })
            }
        }

        return Array.from(threadMap.values())
    }

    static fromRow(row: {
        id: string
        organization_id: string
        contact_id: string
        channel: MessageChannel
        content: string
        direction: MessageDirection
        metadata: unknown
        created_at: string
    }): Message {
        return new Message({
            id: row.id,
            organizationId: row.organization_id,
            contactId: row.contact_id,
            channel: row.channel,
            content: row.content,
            direction: row.direction,
            metadata: row.metadata,
            createdAt: row.created_at,
        })
    }
}
