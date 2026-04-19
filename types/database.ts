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
export type CampaignRecipientStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'read'
export type LandingPageStatus = 'draft' | 'published' | 'archived'
export type ProductType = 'product' | 'service'
export type ProductStatus = 'draft' | 'active' | 'archived'
export type ProductPriceType = 'one_time' | 'monthly' | 'yearly' | 'custom'
export type ChatSessionStatus = 'active' | 'lead_captured' | 'closed'
export type ChatMessageRole = 'user' | 'assistant' | 'system'
export type AnalyticsEventType = 'view' | 'chat_start' | 'lead_captured' | 'cta_click'
export type UserRole = 'owner' | 'admin' | 'agent' | 'viewer'
export type PlanId = 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
export type CreditTransactionType =
    | 'plan_renewal'
    | 'purchase'
    | 'usage_ai'
    | 'usage_whatsapp'
    | 'usage_sms'
    | 'usage_email'
    | 'admin_grant'
    | 'admin_deduct'
    | 'refund'

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
                    credits_balance: number
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
                    credits_balance?: number
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
            campaign_recipients: {
                Row: {
                    id: string
                    campaign_id: string
                    organization_id: string
                    contact_id: string | null
                    contact_name: string
                    recipient_address: string
                    status: CampaignRecipientStatus
                    twilio_sid: string | null
                    error_message: string | null
                    sent_at: string | null
                    delivered_at: string | null
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    campaign_id: string
                    organization_id: string
                    contact_id?: string | null
                    contact_name?: string
                    recipient_address: string
                    status?: CampaignRecipientStatus
                    twilio_sid?: string | null
                    error_message?: string | null
                    sent_at?: string | null
                    delivered_at?: string | null
                    read_at?: string | null
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['campaign_recipients']['Insert']>
                Relationships: [
                    { foreignKeyName: 'campaign_recipients_campaign_id_fkey'; columns: ['campaign_id']; referencedRelation: 'campaigns'; referencedColumns: ['id'] },
                    { foreignKeyName: 'campaign_recipients_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'campaign_recipients_contact_id_fkey'; columns: ['contact_id']; referencedRelation: 'contacts'; referencedColumns: ['id'] }
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
            automation_execution_logs: {
                Row: {
                    id: string
                    organization_id: string
                    automation_id: string
                    trigger_event: string
                    step_index: number
                    step_type: string
                    status: 'success' | 'error' | 'queued' | 'skipped'
                    contact_id: string | null
                    metadata_json: Json
                    error_message: string | null
                    executed_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    automation_id: string
                    trigger_event: string
                    step_index: number
                    step_type: string
                    status: 'success' | 'error' | 'queued' | 'skipped'
                    contact_id?: string | null
                    metadata_json?: Json
                    error_message?: string | null
                    executed_at?: string
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['automation_execution_logs']['Insert']>
                Relationships: [
                    { foreignKeyName: 'automation_execution_logs_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'automation_execution_logs_automation_id_fkey'; columns: ['automation_id']; referencedRelation: 'automations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'automation_execution_logs_contact_id_fkey'; columns: ['contact_id']; referencedRelation: 'contacts'; referencedColumns: ['id'] }
                ]
            }
            automation_job_queue: {
                Row: {
                    id: string
                    organization_id: string
                    automation_id: string
                    trigger_event: string
                    contact_id: string | null
                    source: string | null
                    message: string | null
                    metadata_json: Json
                    steps_json: Json
                    execute_after: string
                    status: 'pending' | 'processing' | 'done' | 'failed'
                    attempts: number
                    max_attempts: number
                    last_error: string | null
                    locked_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    automation_id: string
                    trigger_event: string
                    contact_id?: string | null
                    source?: string | null
                    message?: string | null
                    metadata_json?: Json
                    steps_json: Json
                    execute_after: string
                    status?: 'pending' | 'processing' | 'done' | 'failed'
                    attempts?: number
                    max_attempts?: number
                    last_error?: string | null
                    locked_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['automation_job_queue']['Insert']>
                Relationships: [
                    { foreignKeyName: 'automation_job_queue_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'automation_job_queue_automation_id_fkey'; columns: ['automation_id']; referencedRelation: 'automations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'automation_job_queue_contact_id_fkey'; columns: ['contact_id']; referencedRelation: 'contacts'; referencedColumns: ['id'] }
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
                    product_id: string | null
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
                    product_id?: string | null
                    status?: LandingPageStatus
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['landing_pages']['Insert']>
                Relationships: [
                    { foreignKeyName: 'landing_pages_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'landing_pages_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }
                ]
            }
            knowledge_base: {
                Row: {
                    id: string
                    organization_id: string
                    landing_page_id: string | null
                    product_id: string | null
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
                    product_id?: string | null
                    title: string
                    content: string
                    embedding?: string | null
                    metadata_json?: Json
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['knowledge_base']['Insert']>
                Relationships: [
                    { foreignKeyName: 'knowledge_base_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] },
                    { foreignKeyName: 'knowledge_base_landing_page_id_fkey'; columns: ['landing_page_id']; referencedRelation: 'landing_pages'; referencedColumns: ['id'] },
                    { foreignKeyName: 'knowledge_base_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }
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
            ads_conversion_outbox: {
                Row: {
                    id: string
                    dedupe_key: string
                    landing_page_id: string
                    event_type: string
                    session_id: string | null
                    visitor_id: string | null
                    metadata_json: Json
                    status: string
                    attempts: number
                    max_attempts: number
                    last_error: string | null
                    next_retry_at: string
                    locked_at: string | null
                    sent_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    dedupe_key: string
                    landing_page_id: string
                    event_type: string
                    session_id?: string | null
                    visitor_id?: string | null
                    metadata_json?: Json
                    status?: string
                    attempts?: number
                    max_attempts?: number
                    last_error?: string | null
                    next_retry_at?: string
                    locked_at?: string | null
                    sent_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['ads_conversion_outbox']['Insert']>
                Relationships: [
                    { foreignKeyName: 'ads_conversion_outbox_landing_page_id_fkey'; columns: ['landing_page_id']; referencedRelation: 'landing_pages'; referencedColumns: ['id'] },
                    { foreignKeyName: 'ads_conversion_outbox_session_id_fkey'; columns: ['session_id']; referencedRelation: 'chat_sessions'; referencedColumns: ['id'] }
                ]
            }

            products: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    slug: string
                    type: string
                    short_description: string
                    full_description: string
                    price: number | null
                    price_type: string | null
                    currency: string
                    features_json: Json
                    benefits_json: Json
                    faqs_json: Json
                    target_audience: string
                    differentials: string
                    tags: string[]
                    images: string[]
                    status: string
                    metadata_json: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    slug: string
                    type?: string
                    short_description?: string
                    full_description?: string
                    price?: number | null
                    price_type?: string | null
                    currency?: string
                    features_json?: Json
                    benefits_json?: Json
                    faqs_json?: Json
                    target_audience?: string
                    differentials?: string
                    tags?: string[]
                    images?: string[]
                    status?: string
                    metadata_json?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['products']['Insert']>
                Relationships: [
                    { foreignKeyName: 'products_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }

            instagram_accounts: {
                Row: {
                    id: string
                    organization_id: string
                    ig_user_id: string
                    ig_username: string
                    access_token: string
                    token_expires_at: string
                    page_id: string
                    followers_count: number
                    media_count: number
                    connected_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    ig_user_id: string
                    ig_username?: string
                    access_token: string
                    token_expires_at: string
                    page_id?: string
                    followers_count?: number
                    media_count?: number
                    connected_at?: string
                }
                Update: Partial<Database['public']['Tables']['instagram_accounts']['Insert']>
                Relationships: [
                    { foreignKeyName: 'instagram_accounts_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }

            instagram_contents: {
                Row: {
                    id: string
                    organization_id: string
                    type: string
                    caption: string
                    media_urls: string[]
                    thumbnail_url: string | null
                    hashtags: string[]
                    status: string
                    scheduled_at: string | null
                    published_at: string | null
                    ig_post_id: string | null
                    metrics: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    type?: string
                    caption?: string
                    media_urls?: string[]
                    thumbnail_url?: string | null
                    hashtags?: string[]
                    status?: string
                    scheduled_at?: string | null
                    published_at?: string | null
                    ig_post_id?: string | null
                    metrics?: Json
                    created_at?: string
                }
                Update: Partial<Database['public']['Tables']['instagram_contents']['Insert']>
                Relationships: [
                    { foreignKeyName: 'instagram_contents_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }

            instagram_auto_configs: {
                Row: {
                    id: string
                    organization_id: string
                    active: boolean
                    niche: string
                    brand_description: string
                    target_audience: string
                    tone: string
                    language: string
                    content_types: string[]
                    objectives: string[]
                    posts_per_week: number
                    hashtag_strategy: string
                    default_hashtags: string[]
                    visual_style: string
                    cta_style: string
                    avoid_topics: string
                    reference_profiles: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    active?: boolean
                    niche?: string
                    brand_description?: string
                    target_audience?: string
                    tone?: string
                    language?: string
                    content_types?: string[]
                    objectives?: string[]
                    posts_per_week?: number
                    hashtag_strategy?: string
                    default_hashtags?: string[]
                    visual_style?: string
                    cta_style?: string
                    avoid_topics?: string
                    reference_profiles?: string[]
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database['public']['Tables']['instagram_auto_configs']['Insert']>
                Relationships: [
                    { foreignKeyName: 'instagram_auto_configs_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            plans: {
                Row: {
                    id: PlanId
                    name: string
                    description: string
                    price_brl: number
                    monthly_credits: number
                    max_contacts: number
                    max_landing_pages: number
                    max_users: number
                    max_automations: number
                    features: string[]
                    is_active: boolean
                    sort_order: number
                    updated_at: string
                }
                Insert: never
                Update: never
                Relationships: []
            }
            organization_subscriptions: {
                Row: {
                    id: string
                    organization_id: string
                    plan_id: PlanId
                    status: SubscriptionStatus
                    current_period_start: string
                    current_period_end: string
                    cancel_at_period_end: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    plan_id: PlanId
                    status?: SubscriptionStatus
                    current_period_start?: string
                    current_period_end?: string
                    cancel_at_period_end?: boolean
                    notes?: string | null
                }
                Update: Partial<Database['public']['Tables']['organization_subscriptions']['Insert']>
                Relationships: [
                    { foreignKeyName: 'org_subscriptions_org_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
                ]
            }
            credit_transactions: {
                Row: {
                    id: string
                    organization_id: string
                    amount: number
                    type: CreditTransactionType
                    description: string
                    reference_id: string | null
                    balance_after: number
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    amount: number
                    type: CreditTransactionType
                    description: string
                    reference_id?: string | null
                    balance_after: number
                    created_by?: string | null
                }
                Update: never
                Relationships: []
            }
            credit_packs: {
                Row: {
                    id: string
                    name: string
                    credits: number
                    price_brl: number
                    is_active: boolean
                    sort_order: number
                }
                Insert: never
                Update: never
                Relationships: []
            }
            sites: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    created_at?: string
                    updated_at?: string | null
                }
                Update: Partial<Database['public']['Tables']['sites']['Insert']>
                Relationships: [
                    { foreignKeyName: 'sites_organization_id_fkey'; columns: ['organization_id']; referencedRelation: 'organizations'; referencedColumns: ['id'] }
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

/**
 * Utility type to extract the Row type for a given table name.
 * Usage: DatabaseRow<'contacts'>, DatabaseRow<'sites'>, etc.
 */
export type DatabaseRow<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row']
