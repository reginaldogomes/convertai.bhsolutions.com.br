import {
    SupabaseContactRepository,
    SupabaseDealRepository,
    SupabaseMessageRepository,
    SupabaseCampaignRepository,
    SupabaseAutomationRepository,
    SupabaseUserRepository,
    SupabaseLandingPageRepository,
    SupabaseKnowledgeBaseRepository,
    SupabaseChatSessionRepository,
    SupabaseAnalyticsRepository,
} from '@/infrastructure/repositories'
import { TwilioWhatsAppService } from '@/infrastructure/services/twilio-whatsapp-service'
import { ResendEmailService } from '@/infrastructure/services/resend-email-service'
import { RagService } from '@/infrastructure/services/rag-service'

import { CreateContactUseCase, ListContactsUseCase, GetContactDetailUseCase } from '@/application/use-cases/contacts'
import { CreateDealUseCase, MoveDealUseCase, ListDealsUseCase } from '@/application/use-cases/deals'
import { SendMessageUseCase, ListThreadsUseCase } from '@/application/use-cases/messages'
import { GetDashboardStatsUseCase } from '@/application/use-cases/dashboard'
import { CreateCampaignUseCase, UpdateCampaignUseCase, SendCampaignUseCase, GetCampaignUseCase, GetCrmContextUseCase } from '@/application/use-cases/campaigns'
import { ListCampaignsUseCase, ListAutomationsUseCase, ListContactSelectsUseCase, GetUserSettingsUseCase, ListRecipientsUseCase } from '@/application/use-cases/queries'
import {
    CreateLandingPageUseCase,
    UpdateLandingPageUseCase,
    GetLandingPageUseCase,
    PublishLandingPageUseCase,
    AddKnowledgeBaseUseCase,
    ListLandingPagesUseCase,
    ListKnowledgeBaseUseCase,
    GetLandingPageAnalyticsUseCase,
} from '@/application/use-cases/landing-pages'

// Repository singletons (stateless, safe to reuse)
const contactRepo = new SupabaseContactRepository()
const dealRepo = new SupabaseDealRepository()
const messageRepo = new SupabaseMessageRepository()
const campaignRepo = new SupabaseCampaignRepository()
const automationRepo = new SupabaseAutomationRepository()
const userRepo = new SupabaseUserRepository()
const landingPageRepo = new SupabaseLandingPageRepository()
const knowledgeBaseRepo = new SupabaseKnowledgeBaseRepository()
const chatSessionRepo = new SupabaseChatSessionRepository()
const analyticsRepo = new SupabaseAnalyticsRepository()

// Service singletons
const whatsAppService = new TwilioWhatsAppService()
const emailService = new ResendEmailService()
const ragService = new RagService(knowledgeBaseRepo)

// Use case factory — creates use cases with injected dependencies
export const useCases = {
    // Contacts
    createContact: () => new CreateContactUseCase(contactRepo),
    listContacts: () => new ListContactsUseCase(contactRepo),
    getContactDetail: () => new GetContactDetailUseCase(contactRepo, messageRepo, dealRepo),

    // Deals
    createDeal: () => new CreateDealUseCase(dealRepo),
    moveDeal: () => new MoveDealUseCase(dealRepo),
    listDeals: () => new ListDealsUseCase(dealRepo),

    // Messages
    sendMessage: () => new SendMessageUseCase(messageRepo, contactRepo, whatsAppService),
    listThreads: () => new ListThreadsUseCase(messageRepo),

    // Dashboard
    getDashboardStats: () => new GetDashboardStatsUseCase(contactRepo, messageRepo, campaignRepo, dealRepo),

    // Campaigns
    createCampaign: () => new CreateCampaignUseCase(campaignRepo),
    updateCampaign: () => new UpdateCampaignUseCase(campaignRepo),
    sendCampaign: () => new SendCampaignUseCase(campaignRepo, contactRepo, emailService),
    getCampaign: () => new GetCampaignUseCase(campaignRepo),
    getCrmContext: () => new GetCrmContextUseCase(contactRepo, dealRepo, campaignRepo, userRepo),

    // Queries (simple read-only use cases)
    listCampaigns: () => new ListCampaignsUseCase(campaignRepo),
    listAutomations: () => new ListAutomationsUseCase(automationRepo),
    listContactSelects: () => new ListContactSelectsUseCase(contactRepo),
    getUserSettings: () => new GetUserSettingsUseCase(userRepo),
    listRecipients: () => new ListRecipientsUseCase(contactRepo),

    // Landing Pages
    createLandingPage: () => new CreateLandingPageUseCase(landingPageRepo),
    updateLandingPage: () => new UpdateLandingPageUseCase(landingPageRepo),
    getLandingPage: () => new GetLandingPageUseCase(landingPageRepo),
    publishLandingPage: () => new PublishLandingPageUseCase(landingPageRepo),
    listLandingPages: () => new ListLandingPagesUseCase(landingPageRepo),

    // Knowledge Base
    addKnowledgeBase: () => new AddKnowledgeBaseUseCase(knowledgeBaseRepo, ragService),
    listKnowledgeBase: () => new ListKnowledgeBaseUseCase(knowledgeBaseRepo),

    // Analytics
    getLandingPageAnalytics: () => new GetLandingPageAnalyticsUseCase(analyticsRepo),
} as const

// Export singletons needed by API routes
export { landingPageRepo, knowledgeBaseRepo, chatSessionRepo, contactRepo as contactRepoSingleton, analyticsRepo, ragService }
