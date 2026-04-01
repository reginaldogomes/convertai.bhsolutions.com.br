export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type PipelineStage =
    | 'novo_lead'
    | 'contato'
    | 'proposta'
    | 'negociacao'
    | 'fechado_ganho'
    | 'fechado_perdido'

export type MessageChannel = 'whatsapp' | 'email' | 'sms'
export type MessageDirection = 'inbound' | 'outbound'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent'
export type LandingPageStatus = 'draft' | 'published' | 'archived'
export type ChatSessionStatus = 'active' | 'lead_captured' | 'closed'
export type ChatMessageRole = 'user' | 'assistant' | 'system'
export type AnalyticsEventType = 'view' | 'chat_start' | 'lead_captured' | 'cta_click'
export type UserRole = 'owner' | 'admin' | 'agent' | 'viewer'

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    website: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    zip_code: string | null
                    country: string | null
                    logo_url: string | null
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    website?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    zip_code?: string | null
                    country?: string | null
                    logo_url?: string | null
                    description?: string | null
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['organizations']['Insert']>
                Relationships: []
            }
            users: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    email: string
                    role: UserRole
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    organization_id: string
                    name: string
                    email: string
                    role?: UserRole
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: Partial<Omit<Database['public']['Tables']['users']['Insert'], 'id'>>
                Relationships: [
                    { foreignKeyName: 'users_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            contacts: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    company: string | null
                    tags: string[]
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    tags?: string[]
                    notes?: string | null
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['contacts']['Insert']>
                Relationships: [
                    { foreignKeyName: 'contacts_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            deals: {
                Row: {
                    id: string
                    organization_id: string
                    contact_id: string
                    title: string
                    pipeline_stage: PipelineStage
                    value: number
                    status: 'open' | 'won' | 'lost'
                    assigned_to: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    contact_id: string
                    title: string
                    pipeline_stage?: PipelineStage
                    value?: number
                    status?: 'open' | 'won' | 'lost'
                    assigned_to?: string | null
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['deals']['Insert']>
                Relationships: [
                    { foreignKeyName: 'deals_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'deals_contact_id_fkey'; columns: ['contact_id']; referencedRelation: 'contacts'; referencedColumns: ['id'] },
                    { foreignKeyName: 'deals_assigned_to_fkey'; columns: ['assigned_to']; referencedRelation: 'users'; referencedColumns: ['id'] }
                ]
            }
            messages: {
                Row: {
                    id: string
                    organization_id: string
                    contact_id: string
                    channel: MessageChannel
                    content: string
                    direction: MessageDirection
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    contact_id: string
                    channel: MessageChannel
                    content: string
                    direction: MessageDirection
                    metadata?: Json
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['messages']['Insert']>
                Relationships: [
                    { foreignKeyName: 'messages_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'messages_contact_id_fkey'; columns: ['contact_id']; referencedRelation: 'contacts'; referencedColumns: ['id'] }
                ]
            }
            campaigns: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    subject: string
                    body: string
                    channel: string
                    status: CampaignStatus
                    sent_at: string | null
                    metrics: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    subject: string
                    body: string
                    channel?: string
                    status?: CampaignStatus
                    sent_at?: string | null
                    metrics?: Json
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
                Relationships: [
                    { foreignKeyName: 'campaigns_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            automations: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    trigger_event: string
                    workflow_json: Json
                    active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    trigger_event: string
                    workflow_json: Json
                    active?: boolean
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['automations']['Insert']>
                Relationships: [
                    { foreignKeyName: 'automations_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            landing_pages: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    slug: string
                    headline: string
                    subheadline: string
                    cta_text: string
                    config_json: Json
                    chatbot_name: string
                    chatbot_welcome_message: string
                    chatbot_system_prompt: string
                    status: LandingPageStatus
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    slug: string
                    headline?: string
                    subheadline?: string
                    cta_text?: string
                    config_json?: Json
                    chatbot_name?: string
                    chatbot_welcome_message?: string
                    chatbot_system_prompt?: string
                    status?: LandingPageStatus
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['landing_pages']['Insert']>
                Relationships: [
                    { foreignKeyName: 'landing_pages_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            knowledge_base: {
                Row: {
                    id: string
                    organization_id: string
                    landing_page_id: string | null
                    title: string
                    content: string
                    embedding: string | null
                    metadata_json: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    landing_page_id?: string | null
                    title: string
                    content: string
                    embedding?: string | null
                    metadata_json?: Json
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['knowledge_base']['Insert']>
                Relationships: [
                    { foreignKeyName: 'knowledge_base_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'knowledge_base_landing_page_id_fkey'; columns: ['landing_page_id']; referencedRelation: 'landing_pages'; referencedColumns: ['id'] }
                ]
            }
            chat_sessions: {
                Row: {
                    id: string
                    landing_page_id: string
                    contact_id: string | null
                    visitor_id: string
                    status: ChatSessionStatus
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landing_page_id: string
                    contact_id?: string | null
                    visitor_id: string
                    status?: ChatSessionStatus
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
                Relationships: [
                    { foreignKeyName: 'chat_sessions_landing_page_id_fkey'; columns: ['landing_page_id']; referencedRelation: 'landing_pages'; referencedColumns: ['id'] },
                    { foreignKeyName: 'chat_sessions_contact_id_fkey'; columns: ['contact_id']; referencedRelation: 'contacts'; referencedColumns: ['id'] }
                ]
            }
            chat_messages: {
                Row: {
                    id: string
                    session_id: string
                    role: ChatMessageRole
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    role: ChatMessageRole
                    content: string
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
                Relationships: [
                    { foreignKeyName: 'chat_messages_session_id_fkey'; columns: ['session_id']; referencedRelation: 'chat_sessions'; referencedColumns: ['id'] }
                ]
            }
            page_analytics: {
                Row: {
                    id: string
                    landing_page_id: string
                    event_type: AnalyticsEventType
                    session_id: string | null
                    visitor_id: string | null
                    metadata_json: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    landing_page_id: string
                    event_type: AnalyticsEventType
                    session_id?: string | null
                    visitor_id?: string | null
                    metadata_json?: Json
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['page_analytics']['Insert']>
                Relationships: [
                    { foreignKeyName: 'page_analytics_landing_page_id_fkey'; columns: ['landing_page_id']; referencedRelation: 'landing_pages'; referencedColumns: ['id'] },
                    { foreignKeyName: 'page_analytics_session_id_fkey'; columns: ['session_id']; referencedRelation: 'chat_sessions'; referencedColumns: ['id'] }
                ]
            }

        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            match_knowledge_base: {
                Args: {
                    query_embedding: string
                    match_org_id: string
                    match_page_id: string | null
                    match_threshold: number
                    match_count: number
                }
                Returns: Array<{
                    id: string
                    title: string
                    content: string
                    similarity: number
                }>
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
