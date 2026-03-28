// Plan limits and usage types

export type ResourceKey =
    | 'contacts'
    | 'landing_pages'
    | 'emails_monthly'
    | 'whatsapp_monthly'
    | 'automations'
    | 'knowledge_base'

export interface PlanLimits {
    landingPagesLimit: number      // -1 = unlimited
    contactsLimit: number
    emailsMonthlyLimit: number
    whatsappMonthlyLimit: number
    automationsLimit: number
    knowledgeBaseLimit: number
}

export interface PlanUsage {
    landingPages: number
    contacts: number
    emailsThisMonth: number
    whatsappThisMonth: number
    automations: number
    knowledgeBase: number
}

export interface PlanConfig {
    id: string
    name: string
    limits: PlanLimits
    priceBrl: number
    updatedAt: string
}

export interface LimitCheckResult {
    allowed: boolean
    current: number
    limit: number       // -1 = unlimited
    label: string
}

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
    contacts: 'contatos',
    landing_pages: 'landing pages',
    emails_monthly: 'emails mensais',
    whatsapp_monthly: 'mensagens WhatsApp mensais',
    automations: 'automações ativas',
    knowledge_base: 'documentos de base de conhecimento',
}

export function isUnlimited(limit: number): boolean {
    return limit === -1
}

export function isAtLimit(limit: number, current: number): boolean {
    if (isUnlimited(limit)) return false
    return current >= limit
}

export function getLimitPercentage(limit: number, current: number): number {
    if (isUnlimited(limit)) return 0
    if (limit === 0) return current > 0 ? 100 : 0
    return Math.min(100, Math.round((current / limit) * 100))
}

export function formatLimit(limit: number): string {
    return limit === -1 ? 'Ilimitado' : limit.toLocaleString('pt-BR')
}
