import type { CampaignRecipientStatus } from '@/types/database'

export interface CampaignRecipientProps {
    id: string
    campaignId: string
    organizationId: string
    contactId: string | null
    contactName: string
    recipientAddress: string
    status: CampaignRecipientStatus
    twilioSid: string | null
    errorMessage: string | null
    sentAt: string | null
    deliveredAt: string | null
    readAt: string | null
    createdAt: string
}

export class CampaignRecipient {
    private constructor(private readonly props: CampaignRecipientProps) {}

    get id() { return this.props.id }
    get campaignId() { return this.props.campaignId }
    get organizationId() { return this.props.organizationId }
    get contactId() { return this.props.contactId }
    get contactName() { return this.props.contactName }
    get recipientAddress() { return this.props.recipientAddress }
    get status() { return this.props.status }
    get twilioSid() { return this.props.twilioSid }
    get errorMessage() { return this.props.errorMessage }
    get sentAt() { return this.props.sentAt }
    get deliveredAt() { return this.props.deliveredAt }
    get readAt() { return this.props.readAt }
    get createdAt() { return this.props.createdAt }

    isDelivered(): boolean {
        return this.props.status === 'delivered' || this.props.status === 'read'
    }

    isFailed(): boolean {
        return this.props.status === 'failed'
    }

    static fromRow(row: {
        id: string
        campaign_id: string
        organization_id: string
        contact_id: string | null
        contact_name: string
        recipient_address: string
        status: string
        twilio_sid: string | null
        error_message: string | null
        sent_at: string | null
        delivered_at: string | null
        read_at: string | null
        created_at: string
    }): CampaignRecipient {
        return new CampaignRecipient({
            id: row.id,
            campaignId: row.campaign_id,
            organizationId: row.organization_id,
            contactId: row.contact_id,
            contactName: row.contact_name,
            recipientAddress: row.recipient_address,
            status: row.status as CampaignRecipientStatus,
            twilioSid: row.twilio_sid,
            errorMessage: row.error_message,
            sentAt: row.sent_at,
            deliveredAt: row.delivered_at,
            readAt: row.read_at,
            createdAt: row.created_at,
        })
    }
}
