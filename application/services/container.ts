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
    SupabaseCampaignRecipientRepository,
} from '@/infrastructure/repositories'
import { TwilioWhatsAppService } from '@/infrastructure/services/twilio-whatsapp-service'
import { SendGridEmailService } from '@/infrastructure/services/sendgrid-email-service'
import { ResendEmailService } from '@/infrastructure/services/resend-email-service'
import { TwilioSmsService } from '@/infrastructure/services/twilio-sms-service'
import { MockWhatsAppService, MockSmsService, MockEmailService } from '@/infrastructure/services/mock-services'
import { RagService } from '@/infrastructure/services/rag-service'
import { MetaInstagramService } from '@/infrastructure/services/meta-instagram-service'
import {
    SupabaseInstagramContentRepository,
    SupabaseInstagramAccountRepository,
    SupabaseInstagramAutoConfigRepository,
    SupabaseProductRepository,
    SupabasePlanRepository,
    SupabaseSiteRepository,
    SupabaseSubscriptionRepository,
    SupabaseCreditRepository,
    SupabaseCustomDomainRepository,
} from '@/infrastructure/repositories'

import { CreateContactUseCase, ListContactsUseCase, GetContactDetailUseCase, DeleteContactUseCase } from '@/application/use-cases/contacts'
import { CreateDealUseCase, MoveDealUseCase, ListDealsUseCase } from '@/application/use-cases/deals'
import { SendMessageUseCase, ListThreadsUseCase } from '@/application/use-cases/messages'
import { GetDashboardStatsUseCase } from '@/application/use-cases/dashboard'
import { CreateSiteUseCase, ListSitesUseCase, GetSiteDetailUseCase, UpdateSiteUseCase, DeleteSiteUseCase } from '@/application/use-cases/sites'
import { ListCustomDomainsUseCase, GetCustomDomainUseCase, AddCustomDomainUseCase, UpdateCustomDomainUseCase, CheckCustomDomainStatusUseCase, DeleteCustomDomainUseCase } from '@/application/use-cases/custom-domains'
import { CreateCampaignUseCase, UpdateCampaignUseCase, SendCampaignUseCase, GetCampaignUseCase, GetCrmContextUseCase } from '@/application/use-cases/campaigns'
import { ListCampaignsUseCase, ListContactSelectsUseCase, GetUserSettingsUseCase, ListRecipientsUseCase, UpdateOrganizationUseCase, GetCampaignRecipientsUseCase } from '@/application/use-cases/queries'
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
    DisconnectInstagramAccountUseCase,
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
import {
    GetPlansUseCase,
    GetSubscriptionUseCase,
    GetCreditTransactionsUseCase,
    GetCreditPacksUseCase,
    ChangePlanUseCase,
    GrantCreditsUseCase,
    GrantCreditsFromPackUseCase,
    ListAllSubscriptionsUseCase,
    ListAllPlansAdminUseCase,
    GetPlanByIdUseCase,
    UpsertPlanUseCase,
} from '@/application/use-cases/saas'
import {
    ListOrgMembersUseCase,
    InviteMemberUseCase,
    UpdateMemberRoleUseCase,
    RemoveMemberUseCase,
    TransferOwnershipUseCase,
} from '@/application/use-cases/members'

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
const campaignRecipientRepo = new SupabaseCampaignRecipientRepository()
const planRepo = new SupabasePlanRepository()
const subscriptionRepo = new SupabaseSubscriptionRepository()
const creditRepo = new SupabaseCreditRepository()
const siteRepo = new SupabaseSiteRepository()
const customDomainRepo = new SupabaseCustomDomainRepository()

// Service singletons
const DEV_MOCK = process.env.DEV_MOCK_INTEGRATIONS === 'true'
const whatsAppService = DEV_MOCK ? new MockWhatsAppService() : new TwilioWhatsAppService()
const emailService = DEV_MOCK
    ? new MockEmailService()
    : process.env.EMAIL_PROVIDER === 'sendgrid'
        ? new SendGridEmailService()
        : new ResendEmailService()
const smsService = DEV_MOCK ? new MockSmsService() : new TwilioSmsService()
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

    // Sites
    listSites: () => new ListSitesUseCase(siteRepo),
    getSiteDetail: () => new GetSiteDetailUseCase(siteRepo),
    createSite: () => new CreateSiteUseCase(siteRepo),
    updateSite: () => new UpdateSiteUseCase(siteRepo),
    deleteSite: () => new DeleteSiteUseCase(siteRepo),

    // Custom Domains
    listCustomDomains: () => new ListCustomDomainsUseCase(customDomainRepo),
    getCustomDomain: () => new GetCustomDomainUseCase(customDomainRepo),
    addCustomDomain: () => new AddCustomDomainUseCase(customDomainRepo),
    updateCustomDomain: () => new UpdateCustomDomainUseCase(customDomainRepo),
    checkCustomDomainStatus: () => new CheckCustomDomainStatusUseCase(customDomainRepo),
    deleteCustomDomain: () => new DeleteCustomDomainUseCase(customDomainRepo),

    // Dashboard
    getDashboardStats: () => new GetDashboardStatsUseCase(
        contactRepo, messageRepo, campaignRepo, dealRepo,
        landingPageRepo, automationRepo, instagramContentRepo, analyticsRepo,
    ),

    // Campaigns
    createCampaign: () => new CreateCampaignUseCase(campaignRepo),
    updateCampaign: () => new UpdateCampaignUseCase(campaignRepo),
    sendCampaign: () => new SendCampaignUseCase(campaignRepo, contactRepo, emailService, whatsAppService, smsService, campaignRecipientRepo, creditRepo),
    getCampaign: () => new GetCampaignUseCase(campaignRepo),
    getCrmContext: () => new GetCrmContextUseCase(contactRepo, dealRepo, campaignRepo, userRepo),

    // Queries (simple read-only use cases)
    listCampaigns: () => new ListCampaignsUseCase(campaignRepo),
    listContactSelects: () => new ListContactSelectsUseCase(contactRepo),
    getUserSettings: () => new GetUserSettingsUseCase(userRepo),
    listRecipients: () => new ListRecipientsUseCase(contactRepo),
    getCampaignRecipients: () => new GetCampaignRecipientsUseCase(campaignRecipientRepo),
    updateOrganization: () => new UpdateOrganizationUseCase(userRepo),

    // Automations
    listAutomations: () => new ListAutomationsUseCase(automationRepo),
    getAutomation: () => new GetAutomationUseCase(automationRepo),
    createAutomation: () => new CreateAutomationUseCase(automationRepo),
    updateAutomation: () => new UpdateAutomationUseCase(automationRepo),
    toggleAutomation: () => new ToggleAutomationUseCase(automationRepo),
    deleteAutomation: () => new DeleteAutomationUseCase(automationRepo),

    // Landing Pages
    createLandingPage: () => new CreateLandingPageUseCase(landingPageRepo, productRepo, knowledgeBaseRepo, ragService),
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
    disconnectInstagram: () => new DisconnectInstagramAccountUseCase(instagramAccountRepo),
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

    // SaaS / Planos / Créditos
    getPlans: () => new GetPlansUseCase(planRepo),
    getSubscription: () => new GetSubscriptionUseCase(subscriptionRepo),
    getCreditTransactions: () => new GetCreditTransactionsUseCase(creditRepo),
    getCreditPacks: () => new GetCreditPacksUseCase(creditRepo),
    changePlan: () => new ChangePlanUseCase(planRepo, subscriptionRepo, creditRepo),
    grantCredits: () => new GrantCreditsUseCase(creditRepo),
    grantCreditsFromPack: () => new GrantCreditsFromPackUseCase(creditRepo),
    listAllSubscriptions: () => new ListAllSubscriptionsUseCase(subscriptionRepo),
    listAllPlansAdmin: () => new ListAllPlansAdminUseCase(planRepo),
    getPlanById: () => new GetPlanByIdUseCase(planRepo),
    upsertPlan: () => new UpsertPlanUseCase(planRepo),

    // Gestão de membros da organização
    listOrgMembers: () => new ListOrgMembersUseCase(userRepo),
    inviteMember: () => new InviteMemberUseCase(userRepo, planRepo),
    updateMemberRole: () => new UpdateMemberRoleUseCase(userRepo),
    removeMember: () => new RemoveMemberUseCase(userRepo),
    transferOwnership: () => new TransferOwnershipUseCase(userRepo),
} as const

// Export singletons needed by API routes and server actions
export { landingPageRepo, knowledgeBaseRepo, chatSessionRepo, contactRepo, analyticsRepo, ragService, userRepo, instagramAccountRepo, instagramService, instagramAutoConfigRepo, productRepo, creditRepo, subscriptionRepo, planRepo, siteRepo, customDomainRepo }
