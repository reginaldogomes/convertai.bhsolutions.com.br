/**
 * Application Container — Unified Use Case Registry
 *
 * Composes all domain modules into a single `useCases` object
 * that maintains backward compatibility with all existing consumers.
 *
 * Architecture:
 *   modules/crm.module.ts        → Contacts, Deals, Messages
 *   modules/marketing.module.ts  → Campaigns, Landing Pages, KB, Analytics
 *   modules/org.module.ts        → Members, Organization
 *   modules/automation.module.ts → Automations
 *   modules/instagram.module.ts  → Instagram Content & Accounts
 *   modules/saas.module.ts       → Products, Plans, Credits, Sites, Domains
 *
 * Each module owns its repository singletons and use case factories.
 * Cross-module dependencies are injected via factory functions to prevent
 * circular imports.
 */
import { SupabaseChatSessionRepository } from '@/infrastructure/repositories'
import { GetDashboardStatsUseCase } from '@/application/use-cases/dashboard'

// Self-contained modules (no cross-module deps)
import { crmUseCases, contactRepo, dealRepo, messageRepo, whatsAppService, emailService, smsService } from './modules/crm.module'
import { automationUseCases, automationRepo } from './modules/automation.module'
import { instagramUseCases, instagramContentRepo } from './modules/instagram.module'

// Modules with cross-module deps (use factory pattern)
import { campaignRepo, landingPageRepo, analyticsRepo, knowledgeBaseRepo, ragService, createMarketingUseCases } from './modules/marketing.module'
import { createOrgUseCases, userRepo } from './modules/org.module'
import { saasUseCases, productRepo, creditRepo, planRepo, siteRepo, customDomainRepo } from './modules/saas.module'

// Standalone singleton
export const chatSessionRepo = new SupabaseChatSessionRepository()

// Compose cross-module factories with injected dependencies
const orgUseCases = createOrgUseCases(planRepo)
const marketingUseCases = createMarketingUseCases({
    contactRepo,
    dealRepo,
    userRepo,
    productRepo,
    creditRepo,
    emailService,
    whatsAppService,
    smsService,
})

/**
 * Unified use case factory — backward-compatible API.
 *
 * Usage:
 *   import { useCases } from '@/application/services/container'
 *   const result = await useCases.createContact().execute(orgId, input)
 */
export const useCases = {
    ...crmUseCases,
    ...marketingUseCases,
    ...orgUseCases,
    ...automationUseCases,
    ...instagramUseCases,
    ...saasUseCases,

    // Dashboard (cross-cutting — depends on repos from multiple modules)
    getDashboardStats: () => new GetDashboardStatsUseCase(
        contactRepo, messageRepo, campaignRepo, dealRepo,
        landingPageRepo, automationRepo, instagramContentRepo, analyticsRepo,
    ),
} as const

// ─── Re-export singletons for API routes & server actions ─────────────────────
// Prefer `useCases.xxx()` over direct repo access when possible.
export {
    contactRepo,
    landingPageRepo,
    knowledgeBaseRepo,
    analyticsRepo,
    ragService,
    userRepo,
    productRepo,
    creditRepo,
    subscriptionRepo,
    planRepo,
    siteRepo,
    customDomainRepo,
} from './modules'

export {
    instagramAccountRepo,
    instagramService,
    instagramAutoConfigRepo,
} from './modules'
