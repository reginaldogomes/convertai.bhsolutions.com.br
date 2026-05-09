/**
 * Marketing Module Registry — Campaigns, Landing Pages, Knowledge Base, Analytics
 *
 * Encapsulates repository singletons and use case factories
 * for the Marketing domain.
 */
import {
    SupabaseCampaignRepository,
    SupabaseLandingPageRepository,
    SupabaseKnowledgeBaseRepository,
    SupabaseAnalyticsRepository,
    SupabaseCampaignRecipientRepository,
} from '@/infrastructure/repositories'
import { RagService } from '@/infrastructure/services/rag-service'
import { CreateCampaignUseCase, UpdateCampaignUseCase, SendCampaignUseCase, GetCampaignUseCase, GetCrmContextUseCase } from '@/application/use-cases/campaigns'
import { ListCampaignsUseCase, ListContactSelectsUseCase, GetUserSettingsUseCase, ListRecipientsUseCase, UpdateOrganizationUseCase, GetCampaignRecipientsUseCase } from '@/application/use-cases/queries'
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
    UpdateKnowledgeBaseEntryUseCase,
    DeleteKnowledgeBaseEntryUseCase,
    PurgeKnowledgeBaseHistoryUseCase,
    UploadKnowledgeBaseImageUseCase,
} from '@/application/use-cases/landing-pages'
import type { IContactRepository, IDealRepository, IWhatsAppService, IEmailService, ISmsService, IProductRepository, ICreditRepository, IUserRepository } from '@/domain/interfaces'

// Repository singletons
export const campaignRepo = new SupabaseCampaignRepository()
export const landingPageRepo = new SupabaseLandingPageRepository()
export const knowledgeBaseRepo = new SupabaseKnowledgeBaseRepository()
export const analyticsRepo = new SupabaseAnalyticsRepository()
export const campaignRecipientRepo = new SupabaseCampaignRecipientRepository()

// Service singletons
export const ragService = new RagService(knowledgeBaseRepo)

/**
 * Cross-module dependencies injected from the container.
 * This avoids circular imports between modules.
 */
interface MarketingDeps {
    contactRepo: IContactRepository
    dealRepo: IDealRepository
    userRepo: IUserRepository
    productRepo: IProductRepository
    creditRepo: ICreditRepository
    emailService: IEmailService
    whatsAppService: IWhatsAppService
    smsService: ISmsService
}

/**
 * Creates marketing use cases with injected cross-module dependencies.
 */
export function createMarketingUseCases(deps: MarketingDeps) {
    return {
        // Campaigns
        createCampaign: () => new CreateCampaignUseCase(campaignRepo),
        updateCampaign: () => new UpdateCampaignUseCase(campaignRepo),
        sendCampaign: () => new SendCampaignUseCase(campaignRepo, deps.contactRepo, deps.emailService, deps.whatsAppService, deps.smsService, campaignRecipientRepo, deps.creditRepo),
        getCampaign: () => new GetCampaignUseCase(campaignRepo),
        getCrmContext: () => new GetCrmContextUseCase(deps.contactRepo, deps.dealRepo, campaignRepo, deps.userRepo),

        // Queries
        listCampaigns: () => new ListCampaignsUseCase(campaignRepo),
        listContactSelects: () => new ListContactSelectsUseCase(deps.contactRepo),
        getUserSettings: () => new GetUserSettingsUseCase(deps.userRepo),
        listRecipients: () => new ListRecipientsUseCase(deps.contactRepo),
        getCampaignRecipients: () => new GetCampaignRecipientsUseCase(campaignRecipientRepo),
        updateOrganization: () => new UpdateOrganizationUseCase(deps.userRepo),

        // Landing Pages
        createLandingPage: () => new CreateLandingPageUseCase(landingPageRepo, deps.productRepo, knowledgeBaseRepo, ragService),
        updateLandingPage: () => new UpdateLandingPageUseCase(landingPageRepo),
        getLandingPage: () => new GetLandingPageUseCase(landingPageRepo),
        publishLandingPage: () => new PublishLandingPageUseCase(landingPageRepo),
        deleteLandingPage: () => new DeleteLandingPageUseCase(landingPageRepo),
        listLandingPages: () => new ListLandingPagesUseCase(landingPageRepo),

        // Knowledge Base
        addKnowledgeBase: () => new AddKnowledgeBaseUseCase(knowledgeBaseRepo, ragService),
        listKnowledgeBase: () => new ListKnowledgeBaseUseCase(knowledgeBaseRepo),
        updateKnowledgeBaseEntry: () => new UpdateKnowledgeBaseEntryUseCase(knowledgeBaseRepo, ragService),
        deleteKnowledgeBaseEntry: () => new DeleteKnowledgeBaseEntryUseCase(knowledgeBaseRepo),
        purgeKnowledgeBaseHistory: () => new PurgeKnowledgeBaseHistoryUseCase(knowledgeBaseRepo),
        uploadKnowledgeBaseImage: () => new UploadKnowledgeBaseImageUseCase(knowledgeBaseRepo, ragService),

        // Analytics
        getLandingPageAnalytics: () => new GetLandingPageAnalyticsUseCase(analyticsRepo),
    } as const
}
