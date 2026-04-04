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
import { SendGridEmailService } from '@/infrastructure/services/sendgrid-email-service'
import { ResendEmailService } from '@/infrastructure/services/resend-email-service'
import { TwilioSmsService } from '@/infrastructure/services/twilio-sms-service'
import { RagService } from '@/infrastructure/services/rag-service'
import { MetaInstagramService } from '@/infrastructure/services/meta-instagram-service'
import {
    SupabaseInstagramContentRepository,
    SupabaseInstagramAccountRepository,
    SupabaseInstagramAutoConfigRepository,
    SupabaseProductRepository,
} from '@/infrastructure/repositories'

import { CreateContactUseCase, ListContactsUseCase, GetContactDetailUseCase, DeleteContactUseCase } from '@/application/use-cases/contacts'
import { CreateDealUseCase, MoveDealUseCase, ListDealsUseCase } from '@/application/use-cases/deals'
import { SendMessageUseCase, ListThreadsUseCase } from '@/application/use-cases/messages'
import { GetDashboardStatsUseCase } from '@/application/use-cases/dashboard'
import { CreateCampaignUseCase, UpdateCampaignUseCase, SendCampaignUseCase, GetCampaignUseCase, GetCrmContextUseCase } from '@/application/use-cases/campaigns'
import { ListCampaignsUseCase, ListContactSelectsUseCase, GetUserSettingsUseCase, ListRecipientsUseCase, UpdateOrganizationUseCase } from '@/application/use-cases/queries'
import {
    ListAutomationsUseCase,
    GetAutomationUseCase,
    CreateAutomationUseCase,
    UpdateAutomationUseCase,
    ToggleAutomationUseCase,
    DeleteAutomationUseCase,
} from '@/application/use-cases/automations'
import {
    CreateLandingPageUseCase,
    UpdateLandingPageUseCase,
    GetLandingPageUseCase,
    PublishLandingPageUseCase,
    DeleteLandingPageUseCase,
    AddKnowledgeBaseUseCase,
    ListLandingPagesUseCase,
    ListKnowledgeBaseUseCase,
    GetLandingPageAnalyticsUseCase,
} from '@/application/use-cases/landing-pages'
import {
    ListInstagramContentsUseCase,
    GetInstagramContentUseCase,
    CreateInstagramContentUseCase,
    UpdateInstagramContentUseCase,
    DeleteInstagramContentUseCase,
    PublishInstagramContentUseCase,
    ConnectInstagramAccountUseCase,
    GetAutoConfigUseCase,
    SaveAutoConfigUseCase,
    ToggleAutoConfigUseCase,
} from '@/application/use-cases/instagram'
import {
    CreateProductUseCase,
    UpdateProductUseCase,
    GetProductUseCase,
    ToggleProductStatusUseCase,
    DeleteProductUseCase,
    ListProductsUseCase,
    ListActiveProductsUseCase,
} from '@/application/use-cases/products'

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
const instagramContentRepo = new SupabaseInstagramContentRepository()
const instagramAccountRepo = new SupabaseInstagramAccountRepository()
const instagramAutoConfigRepo = new SupabaseInstagramAutoConfigRepository()
const productRepo = new SupabaseProductRepository()

// Service singletons
const whatsAppService = new TwilioWhatsAppService()
const emailService = process.env.EMAIL_PROVIDER === 'sendgrid'
    ? new SendGridEmailService()
    : new ResendEmailService()
const smsService = new TwilioSmsService()
const ragService = new RagService(knowledgeBaseRepo)
const instagramService = new MetaInstagramService()

// Use case factory — creates use cases with injected dependencies
export const useCases = {
    // Contacts
    createContact: () => new CreateContactUseCase(contactRepo),
    listContacts: () => new ListContactsUseCase(contactRepo),
    getContactDetail: () => new GetContactDetailUseCase(contactRepo, messageRepo, dealRepo),
    deleteContact: () => new DeleteContactUseCase(contactRepo),

    // Deals
    createDeal: () => new CreateDealUseCase(dealRepo),
    moveDeal: () => new MoveDealUseCase(dealRepo),
    listDeals: () => new ListDealsUseCase(dealRepo),

    // Messages
    sendMessage: () => new SendMessageUseCase(messageRepo, contactRepo, whatsAppService, emailService, smsService),
    listThreads: () => new ListThreadsUseCase(messageRepo),

    // Dashboard
    getDashboardStats: () => new GetDashboardStatsUseCase(
        contactRepo, messageRepo, campaignRepo, dealRepo,
        landingPageRepo, automationRepo, instagramContentRepo, analyticsRepo,
    ),

    // Campaigns
    createCampaign: () => new CreateCampaignUseCase(campaignRepo),
    updateCampaign: () => new UpdateCampaignUseCase(campaignRepo),
    sendCampaign: () => new SendCampaignUseCase(campaignRepo, contactRepo, emailService, whatsAppService, smsService),
    getCampaign: () => new GetCampaignUseCase(campaignRepo),
    getCrmContext: () => new GetCrmContextUseCase(contactRepo, dealRepo, campaignRepo, userRepo),

    // Queries (simple read-only use cases)
    listCampaigns: () => new ListCampaignsUseCase(campaignRepo),
    listContactSelects: () => new ListContactSelectsUseCase(contactRepo),
    getUserSettings: () => new GetUserSettingsUseCase(userRepo),
    listRecipients: () => new ListRecipientsUseCase(contactRepo),
    updateOrganization: () => new UpdateOrganizationUseCase(userRepo),

    // Automations
    listAutomations: () => new ListAutomationsUseCase(automationRepo),
    getAutomation: () => new GetAutomationUseCase(automationRepo),
    createAutomation: () => new CreateAutomationUseCase(automationRepo),
    updateAutomation: () => new UpdateAutomationUseCase(automationRepo),
    toggleAutomation: () => new ToggleAutomationUseCase(automationRepo),
    deleteAutomation: () => new DeleteAutomationUseCase(automationRepo),

    // Landing Pages
    createLandingPage: () => new CreateLandingPageUseCase(landingPageRepo),
    updateLandingPage: () => new UpdateLandingPageUseCase(landingPageRepo),
    getLandingPage: () => new GetLandingPageUseCase(landingPageRepo),
    publishLandingPage: () => new PublishLandingPageUseCase(landingPageRepo),
    deleteLandingPage: () => new DeleteLandingPageUseCase(landingPageRepo),
    listLandingPages: () => new ListLandingPagesUseCase(landingPageRepo),

    // Knowledge Base
    addKnowledgeBase: () => new AddKnowledgeBaseUseCase(knowledgeBaseRepo, ragService),
    listKnowledgeBase: () => new ListKnowledgeBaseUseCase(knowledgeBaseRepo),

    // Analytics
    getLandingPageAnalytics: () => new GetLandingPageAnalyticsUseCase(analyticsRepo),

    // Instagram
    listInstagramContents: () => new ListInstagramContentsUseCase(instagramContentRepo),
    getInstagramContent: () => new GetInstagramContentUseCase(instagramContentRepo),
    createInstagramContent: () => new CreateInstagramContentUseCase(instagramContentRepo),
    updateInstagramContent: () => new UpdateInstagramContentUseCase(instagramContentRepo),
    deleteInstagramContent: () => new DeleteInstagramContentUseCase(instagramContentRepo),
    publishInstagramContent: () => new PublishInstagramContentUseCase(instagramContentRepo, instagramAccountRepo, instagramService),
    connectInstagramAccount: () => new ConnectInstagramAccountUseCase(instagramAccountRepo, instagramService),
    getAutoConfig: () => new GetAutoConfigUseCase(instagramAutoConfigRepo),
    saveAutoConfig: () => new SaveAutoConfigUseCase(instagramAutoConfigRepo),
    toggleAutoConfig: () => new ToggleAutoConfigUseCase(instagramAutoConfigRepo),

    // Products
    createProduct: () => new CreateProductUseCase(productRepo),
    updateProduct: () => new UpdateProductUseCase(productRepo),
    getProduct: () => new GetProductUseCase(productRepo),
    toggleProductStatus: () => new ToggleProductStatusUseCase(productRepo),
    deleteProduct: () => new DeleteProductUseCase(productRepo),
    listProducts: () => new ListProductsUseCase(productRepo),
    listActiveProducts: () => new ListActiveProductsUseCase(productRepo),
} as const

// Export singletons needed by API routes and server actions
export { landingPageRepo, knowledgeBaseRepo, chatSessionRepo, contactRepo, analyticsRepo, ragService, userRepo, instagramAccountRepo, instagramService, instagramAutoConfigRepo, productRepo }
