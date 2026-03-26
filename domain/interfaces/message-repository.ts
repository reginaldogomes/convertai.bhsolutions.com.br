import type { Message } from '@/domain/entities'
import type { MessageChannel, MessageDirection } from '@/types/database'

export interface CreateMessageInput {
    organizationId: string
    contactId: string
    channel: MessageChannel
    content: string
    direction: MessageDirection
}

export interface RawMessageWithContact {
    id: string
    organization_id: string
    contact_id: string
    channel: MessageChannel
    content: string
    direction: MessageDirection
    metadata: unknown
    created_at: string
    contacts: { id: string; name: string; phone: string | null } | null
}

export interface IMessageRepository {
    findByOrgId(orgId: string): Promise<RawMessageWithContact[]>
    findByContactId(contactId: string, limit?: number): Promise<Message[]>
    create(input: CreateMessageInput): Promise<Message | null>
    countInboundByOrgId(orgId: string): Promise<number>
}
