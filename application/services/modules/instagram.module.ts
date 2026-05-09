/**
 * Instagram Module Registry — Content, Accounts, Auto-Config
 *
 * Encapsulates repository singletons and use case factories
 * for the Instagram domain.
 */
import {
    SupabaseInstagramContentRepository,
    SupabaseInstagramAccountRepository,
    SupabaseInstagramAutoConfigRepository,
} from '@/infrastructure/repositories'
import { MetaInstagramService } from '@/infrastructure/services/meta-instagram-service'
import {
    ListInstagramContentsUseCase,
    GetInstagramContentUseCase,
    CreateInstagramContentUseCase,
    UpdateInstagramContentUseCase,
    ScheduleInstagramContentUseCase,
    DeleteInstagramContentUseCase,
    PublishInstagramContentUseCase,
    PublishScheduledPostsUseCase,
    SyncContentMetricsUseCase,
    SyncAllMetricsUseCase,
    RefreshInstagramTokensUseCase,
    ConnectInstagramAccountUseCase,
    DisconnectInstagramAccountUseCase,
    GetAutoConfigUseCase,
    SaveAutoConfigUseCase,
    ToggleAutoConfigUseCase,
    GenerateViralIdeaUseCase,
} from '@/application/use-cases/instagram'
import type { IRagService } from '@/domain/interfaces'

// Repository singletons
export const instagramContentRepo = new SupabaseInstagramContentRepository()
export const instagramAccountRepo = new SupabaseInstagramAccountRepository()
export const instagramAutoConfigRepo = new SupabaseInstagramAutoConfigRepository()

// Service singletons
export const instagramService = new MetaInstagramService()

// Use case factories
export function createInstagramUseCases(ragService: IRagService) {
    return {
        listInstagramContents: () => new ListInstagramContentsUseCase(instagramContentRepo),
        getInstagramContent: () => new GetInstagramContentUseCase(instagramContentRepo),
        createInstagramContent: () => new CreateInstagramContentUseCase(instagramContentRepo),
        updateInstagramContent: () => new UpdateInstagramContentUseCase(instagramContentRepo),
        scheduleInstagramContent: () => new ScheduleInstagramContentUseCase(instagramContentRepo),
        deleteInstagramContent: () => new DeleteInstagramContentUseCase(instagramContentRepo),
        publishInstagramContent: () => new PublishInstagramContentUseCase(instagramContentRepo, instagramAccountRepo, instagramService),
        publishScheduledPosts: () => new PublishScheduledPostsUseCase(instagramContentRepo, instagramAccountRepo, instagramService),
        syncContentMetrics: () => new SyncContentMetricsUseCase(instagramContentRepo, instagramAccountRepo, instagramService),
        syncAllMetrics: () => new SyncAllMetricsUseCase(instagramContentRepo, instagramAccountRepo, instagramService),
        refreshInstagramTokens: () => new RefreshInstagramTokensUseCase(instagramAccountRepo, instagramService),
        connectInstagramAccount: () => new ConnectInstagramAccountUseCase(instagramAccountRepo, instagramService),
        disconnectInstagram: () => new DisconnectInstagramAccountUseCase(instagramAccountRepo, instagramService),
        getAutoConfig: () => new GetAutoConfigUseCase(instagramAutoConfigRepo),
        saveAutoConfig: () => new SaveAutoConfigUseCase(instagramAutoConfigRepo),
        toggleAutoConfig: () => new ToggleAutoConfigUseCase(instagramAutoConfigRepo),
        generateViralIdea: () => new GenerateViralIdeaUseCase(ragService, instagramAutoConfigRepo),
    } as const
}
