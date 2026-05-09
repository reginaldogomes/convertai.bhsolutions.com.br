/**
 * Application Container — Unified Use Case Registry
 *
 * Architecture:
 *   modules/crm.module.ts        → Contacts, Deals, Messages
 *   modules/marketing.module.ts  → Campaigns, Landing Pages, KB, Analytics
 *   modules/org.module.ts        → Members, Organization
 *   modules/automation.module.ts → Automations
 *   modules/instagram.module.ts  → Instagram Content & Accounts
 *   modules/saas.module.ts       → Products, Plans, Credits, Sites, Domains
 */
import { SupabaseChatSessionRepository } from '@/infrastructure/repositories'
import { GetDashboardStatsUseCase } from '@/application/use-cases/dashboard'

// Self-contained modules
import { crmUseCases, contactRepo, dealRepo, messageRepo, whatsAppService, emailService, smsService } from './modules/crm.module'
import { automationUseCases, automationRepo } from './modules/automation.module'
import { instagramContentRepo, createInstagramUseCases } from './modules/instagram.module'

// Modules with cross-module deps
import { campaignRepo, landingPageRepo, analyticsRepo, knowledgeBaseRepo, ragService, createMarketingUseCases } from './modules/marketing.module'
import { createOrgUseCases, userRepo } from './modules/org.module'
import { saasUseCases, productRepo, creditRepo, planRepo, siteRepo, customDomainRepo } from './modules/saas.module'

// Standalone singleton
export const chatSessionRepo = new SupabaseChatSessionRepository()

// Compose cross-module factories
const orgUseCases = createOrgUseCases(planRepo)
const marketingUseCases = createMarketingUseCases({
    contactRepo, dealRepo, userRepo, productRepo, creditRepo,
    emailService, whatsAppService, smsService,
})

// Instagram receives ragService for RAG-powered generation
const instagramUseCases = createInstagramUseCases(ragService)

export const useCases = {
    ...crmUseCases,
    ...marketingUseCases,
    ...orgUseCases,
    ...automationUseCases,
    ...instagramUseCases,
    ...saasUseCases,

    getDashboardStats: () => new GetDashboardStatsUseCase(
        contactRepo, messageRepo, campaignRepo, dealRepo,
        landingPageRepo, automationRepo, instagramContentRepo, analyticsRepo,
    ),
} as const

// ─── Re-export singletons ──────────────────────────────────────────────────────
export {
    contactRepo, landingPageRepo, knowledgeBaseRepo,
    analyticsRepo, ragService, userRepo, productRepo,
    creditRepo, subscriptionRepo, planRepo, siteRepo, customDomainRepo,
} from './modules'

export {
    instagramAccountRepo, instagramService, instagramAutoConfigRepo,
} from './modules'
