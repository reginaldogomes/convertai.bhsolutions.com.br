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
    DeleteInstagramContentUseCase,
    PublishInstagramContentUseCase,
    ConnectInstagramAccountUseCase,
    DisconnectInstagramAccountUseCase,
    GetAutoConfigUseCase,
    SaveAutoConfigUseCase,
    ToggleAutoConfigUseCase,
} from '@/application/use-cases/instagram'

// Repository singletons
export const instagramContentRepo = new SupabaseInstagramContentRepository()
export const instagramAccountRepo = new SupabaseInstagramAccountRepository()
export const instagramAutoConfigRepo = new SupabaseInstagramAutoConfigRepository()

// Service singletons
export const instagramService = new MetaInstagramService()

// Use case factories
export const instagramUseCases = {
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
} as const
