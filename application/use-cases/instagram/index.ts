import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { IInstagramContentRepository, IInstagramAccountRepository, IInstagramService, IInstagramAutoConfigRepository } from '@/domain/interfaces'
import { InstagramContent } from '@/domain/entities'
import type { InstagramContentRow, InstagramAutoConfigRow } from '@/types/instagram'

// --- Schemas ---

const createContentSchema = z.object({
    type: z.enum(['post', 'story', 'reel', 'carousel']),
    caption: z.string().max(2200, 'Legenda pode ter no máximo 2200 caracteres'),
    mediaUrls: z.array(z.string().url()).min(1, 'Pelo menos uma mídia é necessária'),
    thumbnailUrl: z.string().url().optional().nullable(),
    hashtags: z.array(z.string()).optional(),
})

const updateContentSchema = z.object({
    type: z.enum(['post', 'story', 'reel', 'carousel']).optional(),
    caption: z.string().max(2200).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    thumbnailUrl: z.string().url().optional().nullable(),
    hashtags: z.array(z.string()).optional(),
})

// --- List Contents ---

export class ListInstagramContentsUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string): Promise<InstagramContentRow[]> {
        return this.repo.findByOrgId(orgId)
    }
}

// --- Get Content ---

export class GetInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(id: string): Promise<Result<InstagramContent>> {
        const content = await this.repo.findById(id)
        if (!content) return failure(new EntityNotFoundError('Conteúdo'))
        return success(content)
    }
}

// --- Create Content ---

export class CreateInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, input: {
        type: string
        caption: string
        mediaUrls: string[]
        thumbnailUrl?: string | null
        hashtags?: string[]
    }): Promise<Result<InstagramContent>> {
        const parsed = createContentSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const content = await this.repo.create({
            organizationId: orgId,
            type: parsed.data.type,
            caption: parsed.data.caption,
            mediaUrls: parsed.data.mediaUrls,
            thumbnailUrl: parsed.data.thumbnailUrl,
            hashtags: parsed.data.hashtags,
        })

        if (!content) return failure(new ValidationError('Erro ao criar conteúdo'))
        return success(content)
    }
}

// --- Update Content ---

export class UpdateInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, contentId: string, input: {
        type?: string
        caption?: string
        mediaUrls?: string[]
        thumbnailUrl?: string | null
        hashtags?: string[]
    }): Promise<Result<InstagramContent>> {
        const parsed = updateContentSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const content = await this.repo.update(contentId, orgId, parsed.data)
        if (!content) return failure(new EntityNotFoundError('Conteúdo'))
        return success(content)
    }
}

// --- Delete Content ---

export class DeleteInstagramContentUseCase {
    constructor(private readonly repo: IInstagramContentRepository) {}

    async execute(orgId: string, contentId: string): Promise<Result<boolean>> {
        const content = await this.repo.findById(contentId)
        if (!content || content.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Conteúdo'))
        }
        if (!content.isDraft()) {
            return failure(new ValidationError('Apenas rascunhos podem ser excluídos'))
        }
        const deleted = await this.repo.delete(contentId, orgId)
        if (!deleted) return failure(new ValidationError('Erro ao excluir conteúdo'))
        return success(true)
    }
}

// --- Publish Content ---

export class PublishInstagramContentUseCase {
    constructor(
        private readonly contentRepo: IInstagramContentRepository,
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(orgId: string, contentId: string): Promise<Result<{ igPostId: string }>> {
        // Load content
        const content = await this.contentRepo.findById(contentId)
        if (!content || content.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Conteúdo'))
        }
        if (!content.canPublish()) {
            return failure(new ValidationError('Conteúdo não pode ser publicado'))
        }

        // Load IG account
        const account = await this.accountRepo.findByOrgId(orgId)
        if (!account) {
            return failure(new ValidationError('Conta do Instagram não conectada'))
        }

        // Mark as publishing
        await this.contentRepo.updateStatus(contentId, orgId, 'publishing')

        const fullCaption = content.hashtags.length > 0
            ? `${content.caption}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`
            : content.caption

        let result: { id: string } | null = null

        try {
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
            }
        } catch {
            await this.contentRepo.updateStatus(contentId, orgId, 'failed')
            return failure(new ValidationError('Erro ao publicar no Instagram'))
        }

        if (!result) {
            await this.contentRepo.updateStatus(contentId, orgId, 'failed')
            return failure(new ValidationError('Falha ao publicar no Instagram'))
        }

        await this.contentRepo.updateStatus(contentId, orgId, 'published', {
            ig_post_id: result.id,
            published_at: new Date().toISOString(),
        })

        return success({ igPostId: result.id })
    }
}

// --- Connect Account ---

export class ConnectInstagramAccountUseCase {
    constructor(
        private readonly accountRepo: IInstagramAccountRepository,
        private readonly igService: IInstagramService,
    ) {}

    async execute(orgId: string, code: string, redirectUri: string): Promise<Result<{ username: string }>> {
        // Exchange code for short-lived token
        const tokenResult = await this.igService.exchangeCodeForToken(code, redirectUri)
        if (!tokenResult) {
            return failure(new ValidationError('Falha ao conectar conta do Instagram'))
        }

        // Get long-lived token
        const longToken = await this.igService.getLongLivedToken(tokenResult.access_token)
        if (!longToken) {
            return failure(new ValidationError('Falha ao obter token de longa duração'))
        }

        // Get account info
        const accountInfo = await this.igService.getAccountInfo(longToken.access_token, tokenResult.user_id)

        const expiresAt = new Date(Date.now() + longToken.expires_in * 1000).toISOString()

        const saved = await this.accountRepo.upsert(orgId, {
            ig_user_id: tokenResult.user_id,
            ig_username: tokenResult.user_id, // Will be updated when we fetch profile
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
    constructor(private readonly accountRepo: IInstagramAccountRepository) {}

    async execute(orgId: string): Promise<Result<null>> {
        const deleted = await this.accountRepo.delete(orgId)
        if (!deleted) return failure(new ValidationError('Falha ao desconectar o Instagram'))
        return success(null)
    }
}

// --- Auto Content Config ---

const autoConfigSchema = z.object({
    niche: z.string().min(1, 'Nicho é obrigatório').max(200),
    brand_description: z.string().max(1000).optional().default(''),
    target_audience: z.string().max(500).optional().default(''),
    tone: z.string().optional().default('profissional'),
    language: z.string().optional().default('pt-BR'),
    content_types: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de conteúdo').optional().default(['post', 'reel']),
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
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

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
            if (!config || !config.niche) {
                return failure(new ValidationError('Configure o nicho antes de ativar'))
            }
        }
        const toggled = await this.repo.toggleActive(orgId, active)
        if (!toggled) return failure(new ValidationError('Erro ao alterar status'))
        return success(active)
    }
}
