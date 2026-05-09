import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { IInstagramContentRepository, IInstagramAccountRepository, IInstagramService, IInstagramAutoConfigRepository } from '@/domain/interfaces/instagram-repository'
import type { IRagService } from '@/domain/interfaces'
import { InstagramContent } from '@/domain/entities'
import type { InstagramContentRow, InstagramAutoConfigRow } from '@/types/instagram'
import { MetaApiError } from '@/infrastructure/services/meta-instagram-service'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createContentSchema = z.object({
    type: z.enum(['post', 'story', 'reel', 'carousel']),
    caption: z.string().max(2200, 'Legenda pode ter no máximo 2200 caracteres'),
    mediaUrls: z.array(z.string().url()).min(1, 'Pelo menos uma mídia é necessária'),
    thumbnailUrl: z.string().url().optional().nullable(),
    hashtags: z.array(z.string()).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
})

const updateContentSchema = z.object({
    type: z.enum(['post', 'story', 'reel', 'carousel']).optional(),
    caption: z.string().max(2200).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    thumbnailUrl: z.string().url().optional().nullable(),
    hashtags: z.array(z.string()).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
})

// ─── List Contents ────────────────────────────────────────────────────────────

export class ListInstagramContentsUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}
    async execute(orgId: string): Promise<InstagramContentRow[]> {
        return this.repo.findByOrgId(orgId)
    }
}

// ─── Get Content ──────────────────────────────────────────────────────────────

export class GetInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}
    async execute(id: string): Promise<Result<InstagramContent>> {
        const content = await this.repo.findById(id)
        if (!content) return failure(new EntityNotFoundError('Conteúdo'))
        return success(content)
    }
}

// ─── Create Content ───────────────────────────────────────────────────────────

export class CreateInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, input: {
        type: string
        caption: string
        mediaUrls: string[]
        thumbnailUrl?: string | null
        hashtags?: string[]
        scheduledAt?: string | null
    }): Promise<Result<InstagramContent>> {
        const parsed = createContentSchema.safeParse(input)
        if (!parsed.success) return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))

        // Scheduled date must be in the future
        if (parsed.data.scheduledAt && new Date(parsed.data.scheduledAt) <= new Date()) {
            return failure(new ValidationError('A data de agendamento deve ser no futuro'))
        }

        const content = await this.repo.create({
            organizationId: orgId,
            ...parsed.data,
        })
        if (!content) return failure(new ValidationError('Erro ao criar conteúdo'))
        return success(content)
    }
}

// ─── Update Content ───────────────────────────────────────────────────────────

export class UpdateInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, contentId: string, input: {
        type?: string
        caption?: string
        mediaUrls?: string[]
        thumbnailUrl?: string | null
        hashtags?: string[]
        scheduledAt?: string | null
    }): Promise<Result<InstagramContent>> {
        const parsed = updateContentSchema.safeParse(input)
        if (!parsed.success) return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))

        const content = await this.repo.update(contentId, orgId, parsed.data)
        if (!content) return failure(new EntityNotFoundError('Conteúdo'))
        return success(content)
    }
}

// ─── Schedule Content ─────────────────────────────────────────────────────────

export class ScheduleInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, contentId: string, scheduledAt: string): Promise<Result<InstagramContent>> {
        const date = new Date(scheduledAt)
        if (isNaN(date.getTime())) return failure(new ValidationError('Data de agendamento inválida'))
        if (date <= new Date()) return failure(new ValidationError('A data de agendamento deve ser no futuro'))

        const content = await this.repo.update(contentId, orgId, { scheduledAt })
        if (!content) return failure(new EntityNotFoundError('Conteúdo'))
        return success(content)
    }
}

// ─── Delete Content ───────────────────────────────────────────────────────────

export class DeleteInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, contentId: string): Promise<Result<boolean>> {
        const content = await this.repo.findById(contentId)
        if (!content || content.organizationId !== orgId) return failure(new EntityNotFoundError('Conteúdo'))
        if (content.isPublished()) return failure(new ValidationError('Conteúdos publicados não podem ser excluídos'))

        const deleted = await this.repo.delete(contentId, orgId)
        if (!deleted) return failure(new ValidationError('Erro ao excluir conteúdo'))
        return success(true)
    }
}

// ─── Publish Content ──────────────────────────────────────────────────────────

export class PublishInstagramContentUseCase {
    constructor(
        private readonly contentRepo: IInstagramContentRepository,
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(orgId: string, contentId: string): Promise<Result<{ igPostId: string }>> {
        const content = await this.contentRepo.findById(contentId)
        if (!content || content.organizationId !== orgId) return failure(new EntityNotFoundError('Conteúdo'))
        if (!content.canPublish()) return failure(new ValidationError('Conteúdo não pode ser publicado'))

        const account = await this.accountRepo.findByOrgId(orgId)
        if (!account) return failure(new ValidationError('Conta do Instagram não conectada'))

        // Check token expiry before attempting publish
        if (new Date(account.token_expires_at) <= new Date()) {
            return failure(new ValidationError('Token do Instagram expirado — reconecte sua conta'))
        }

        await this.contentRepo.updateStatus(contentId, orgId, 'publishing')

        const fullCaption = content.hashtags.length > 0
            ? `${content.caption}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`
            : content.caption

        try {
            let result: { id: string }

            switch (content.type) {
                case 'post':
                    result = await this.igService.publishPost(account.access_token, account.ig_user_id, content.mediaUrls[0], fullCaption)
                    break
                case 'carousel':
                    result = await this.igService.publishCarousel(account.access_token, account.ig_user_id, content.mediaUrls, fullCaption)
                    break
                case 'reel':
                    result = await this.igService.publishReel(account.access_token, account.ig_user_id, content.mediaUrls[0], fullCaption)
                    break
                case 'story':
                    result = await this.igService.publishStory(account.access_token, account.ig_user_id, content.mediaUrls[0])
                    break
                default:
                    await this.contentRepo.updateStatus(contentId, orgId, 'failed')
                    return failure(new ValidationError('Tipo de conteúdo não suportado'))
            }

            await this.contentRepo.updateStatus(contentId, orgId, 'published', {
                ig_post_id: result.id,
                published_at: new Date().toISOString(),
            })

            return success({ igPostId: result.id })

        } catch (err) {
            const errMessage = err instanceof MetaApiError ? err.message : 'Erro ao publicar no Instagram'
            await this.contentRepo.updateStatus(contentId, orgId, 'failed')
            return failure(new ValidationError(errMessage))
        }
    }
}

// ─── Publish Scheduled Posts (Cron) ──────────────────────────────────────────

export class PublishScheduledPostsUseCase {
    constructor(
        private readonly contentRepo: IInstagramContentRepository,
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(): Promise<{ published: number; failed: number }> {
        const due = await this.contentRepo.findScheduledDue()
        let published = 0
        let failed = 0

        for (const row of due) {
            const content = InstagramContent.fromRow(row)
            const account = await this.accountRepo.findByOrgId(content.organizationId)
            if (!account || new Date(account.token_expires_at) <= new Date()) {
                await this.contentRepo.updateStatus(content.id, content.organizationId, 'failed')
                failed++
                continue
            }

            const fullCaption = content.hashtags.length > 0
                ? `${content.caption}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`
                : content.caption

            try {
                let result: { id: string }
                switch (content.type) {
                    case 'carousel':
                        result = await this.igService.publishCarousel(account.access_token, account.ig_user_id, content.mediaUrls, fullCaption)
                        break
                    case 'reel':
                        result = await this.igService.publishReel(account.access_token, account.ig_user_id, content.mediaUrls[0], fullCaption)
                        break
                    case 'story':
                        result = await this.igService.publishStory(account.access_token, account.ig_user_id, content.mediaUrls[0])
                        break
                    default:
                        result = await this.igService.publishPost(account.access_token, account.ig_user_id, content.mediaUrls[0], fullCaption)
                }
                await this.contentRepo.updateStatus(content.id, content.organizationId, 'published', {
                    ig_post_id: result.id,
                    published_at: new Date().toISOString(),
                })
                published++
            } catch {
                await this.contentRepo.updateStatus(content.id, content.organizationId, 'failed')
                failed++
            }
        }

        return { published, failed }
    }
}

// ─── Sync Metrics ─────────────────────────────────────────────────────────────

export class SyncContentMetricsUseCase {
    constructor(
        private readonly contentRepo: IInstagramContentRepository,
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(orgId: string, contentId: string): Promise<Result<boolean>> {
        const content = await this.contentRepo.findById(contentId)
        if (!content || content.organizationId !== orgId) return failure(new EntityNotFoundError('Conteúdo'))
        if (!content.igPostId) return failure(new ValidationError('Post ainda não publicado no Instagram'))

        const account = await this.accountRepo.findByOrgId(orgId)
        if (!account) return failure(new ValidationError('Conta do Instagram não conectada'))

        const metrics = await this.igService.getMediaInsights(account.access_token, content.igPostId)
        if (!metrics) return failure(new ValidationError('Falha ao buscar métricas'))

        await this.contentRepo.updateMetrics(content.id, metrics)
        return success(true)
    }
}

export class SyncAllMetricsUseCase {
    constructor(
        private readonly contentRepo: IInstagramContentRepository,
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(sinceHours = 168): Promise<{ synced: number; failed: number }> {
        const posts = await this.contentRepo.findPublishedForMetrics(sinceHours)
        let synced = 0; let failed = 0

        for (const row of posts) {
            if (!row.ig_post_id) continue
            const account = await this.accountRepo.findByOrgId(row.organization_id)
            if (!account) continue
            const metrics = await this.igService.getMediaInsights(account.access_token, row.ig_post_id)
            if (metrics) {
                await this.contentRepo.updateMetrics(row.id, metrics)
                synced++
            } else {
                failed++
            }
        }

        return { synced, failed }
    }
}

// ─── Token Refresh (Cron) ─────────────────────────────────────────────────────

export class RefreshInstagramTokensUseCase {
    constructor(
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(daysThreshold = 15): Promise<{ refreshed: number; failed: number }> {
        const accounts = await this.accountRepo.findAllExpiringSoon(daysThreshold)
        let refreshed = 0; let failed = 0

        for (const account of accounts) {
            const newToken = await this.igService.refreshLongLivedToken(account.access_token)
            if (newToken) {
                const expiresAt = new Date(Date.now() + newToken.expires_in * 1000).toISOString()
                await this.accountRepo.updateToken(account.organization_id, newToken.access_token, expiresAt)
                refreshed++
            } else {
                failed++
            }
        }

        return { refreshed, failed }
    }
}

// ─── Connect / Disconnect Account ─────────────────────────────────────────────

export class ConnectInstagramAccountUseCase {
    constructor(
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(orgId: string, code: string, redirectUri: string): Promise<Result<{ username: string }>> {
        const tokenResult = await this.igService.exchangeCodeForToken(code, redirectUri)
        if (!tokenResult) return failure(new ValidationError('Falha ao conectar conta do Instagram'))

        const longToken = await this.igService.getLongLivedToken(tokenResult.access_token)
        if (!longToken) return failure(new ValidationError('Falha ao obter token de longa duração'))

        const accountInfo = await this.igService.getAccountInfo(longToken.access_token, tokenResult.user_id)
        const expiresAt = new Date(Date.now() + longToken.expires_in * 1000).toISOString()

        const saved = await this.accountRepo.upsert(orgId, {
            ig_user_id: tokenResult.user_id,
            ig_username: tokenResult.user_id,
            access_token: longToken.access_token,
            token_expires_at: expiresAt,
            page_id: '',
            followers_count: accountInfo?.followers_count ?? 0,
            media_count: accountInfo?.media_count ?? 0,
        })

        if (!saved) return failure(new ValidationError('Erro ao salvar conta'))
        return success({ username: tokenResult.user_id })
    }
}

export class DisconnectInstagramAccountUseCase {
    constructor(
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(orgId: string): Promise<Result<null>> {
        const account = await this.accountRepo.findByOrgId(orgId)
        // Revoke token at Meta (best-effort)
        if (account) {
            this.igService.revokeToken(account.access_token).catch(() => {})
        }

        const deleted = await this.accountRepo.delete(orgId)
        if (!deleted) return failure(new ValidationError('Falha ao desconectar o Instagram'))
        return success(null)
    }
}

// ─── Auto Content Config ──────────────────────────────────────────────────────

const autoConfigSchema = z.object({
    niche: z.string().min(1, 'Nicho é obrigatório').max(200),
    brand_description: z.string().max(1000).optional().default(''),
    target_audience: z.string().max(500).optional().default(''),
    tone: z.string().optional().default('profissional'),
    language: z.string().optional().default('pt-BR'),
    content_types: z.array(z.string()).min(1, 'Selecione pelo menos um tipo').optional().default(['post', 'reel']),
    objectives: z.array(z.string()).min(1, 'Selecione pelo menos um objetivo').optional().default(['engajamento', 'autoridade']),
    posts_per_week: z.number().int().min(1).max(14).optional().default(3),
    hashtag_strategy: z.enum(['trending', 'niche', 'branded', 'mix']).optional().default('mix'),
    default_hashtags: z.array(z.string()).optional().default([]),
    visual_style: z.string().optional().default('moderno'),
    cta_style: z.string().optional().default('sutil'),
    avoid_topics: z.string().max(500).optional().default(''),
    reference_profiles: z.array(z.string()).optional().default([]),
})

export class GetAutoConfigUseCase {
    constructor(private readonly repo: IInstagramAutoConfigRepository) {}
    async execute(orgId: string): Promise<InstagramAutoConfigRow | null> {
        return this.repo.findByOrgId(orgId)
    }
}

export class SaveAutoConfigUseCase {
    constructor(private readonly repo: IInstagramAutoConfigRepository) {}

    async execute(orgId: string, input: Record<string, unknown>): Promise<Result<InstagramAutoConfigRow>> {
        const parsed = autoConfigSchema.safeParse(input)
        if (!parsed.success) return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))

        const config = await this.repo.upsert(orgId, parsed.data)
        if (!config) return failure(new ValidationError('Erro ao salvar configuração'))
        return success(config)
    }
}

export class ToggleAutoConfigUseCase {
    constructor(private readonly repo: IInstagramAutoConfigRepository) {}

    async execute(orgId: string, active: boolean): Promise<Result<boolean>> {
        if (active) {
            const config = await this.repo.findByOrgId(orgId)
            if (!config?.niche) return failure(new ValidationError('Configure o nicho antes de ativar'))
        }
        const toggled = await this.repo.toggleActive(orgId, active)
        if (!toggled) return failure(new ValidationError('Erro ao alterar status'))
        return success(active)
    }
}

// ─── Generate Viral Content (RAG-powered) ────────────────────────────────────

export class GenerateViralIdeaUseCase {
    constructor(
        private readonly ragService: IRagService,
        private readonly autoConfigRepo: IInstagramAutoConfigRepository,
    ) {}

    /**
     * Fetches RAG context from org's knowledge base for use
     * in the viral content generation prompt.
     */
    async getContext(orgId: string, topic: string): Promise<{
        ragContext: string
        autoConfig: InstagramAutoConfigRow | null
    }> {
        const [matches, autoConfig] = await Promise.all([
            this.ragService.search(topic, orgId).catch(() => []),
            this.autoConfigRepo.findByOrgId(orgId),
        ])

        const ragContext = this.ragService.formatContextForLLM(matches)
        return { ragContext, autoConfig }
    }
}
