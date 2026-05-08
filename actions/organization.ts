'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { SupabaseUserRepository } from '@/infrastructure/repositories'
import { getErrorMessage } from './utils'
import { z } from 'zod'

const userRepo = new SupabaseUserRepository()

// ─── Multi-org actions ────────────────────────────────────────────────────────

export async function listUserOrganizations() {
    try {
        const { userId, orgId } = await getAuthContext()
        const memberships = await userRepo.listUserMemberships(userId)
        return { memberships, activeOrgId: orgId, error: null }
    } catch (err) {
        return { memberships: [], activeOrgId: null, error: getErrorMessage(err) }
    }
}

export async function createOrganization(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { userId } = await getAuthContext()
        const name = (formData.get('name') as string | null)?.trim()
        if (!name || name.length < 2) return { error: 'Nome da organização deve ter pelo menos 2 caracteres.', success: false }
        if (name.length > 100) return { error: 'Nome não pode ter mais de 100 caracteres.', success: false }

        const org = await userRepo.createOrganization(name)
        await userRepo.addMembership(userId, org.id, 'owner')
        await userRepo.switchActiveOrg(userId, org.id)

        revalidateTag('auth-context')
        revalidatePath('/', 'layout')
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
    redirect('/')
}

export async function switchOrganization(orgId: string) {
    const uuidSchema = z.string().uuid()
    if (!uuidSchema.safeParse(orgId).success) return { error: 'ID inválido.' }
    try {
        const { userId } = await getAuthContext()
        await userRepo.switchActiveOrg(userId, orgId)
        revalidateTag('auth-context')
        revalidatePath('/', 'layout')
        return { error: '' }
    } catch (err) {
        return { error: getErrorMessage(err) }
    }
}

export async function updateOrganization(
    _prevState: { error: string; success: boolean },
    formData: FormData
) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.updateOrganization().execute(orgId, {
            orgName: (formData.get('name') as string) || undefined,
            orgEmail: formData.get('email') as string | null,
            orgPhone: formData.get('phone') as string | null,
            orgWebsite: formData.get('website') as string | null,
            orgAddress: formData.get('address') as string | null,
            orgCity: formData.get('city') as string | null,
            orgState: formData.get('state') as string | null,
            orgZipCode: formData.get('zipCode') as string | null,
            orgCountry: formData.get('country') as string | null,
            orgDescription: formData.get('description') as string | null,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

function toPositiveInt(value: FormDataEntryValue | null, fallback: number): number {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.max(1, Math.floor(parsed))
}

export async function updateAiGovernancePolicy(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext();
        
        // A lógica foi movida para o use case `updateAiGovernance`
        await useCases.updateAiGovernance().execute(orgId, {
            dailyRequestsLimit: toPositiveInt(formData.get('dailyRequestsLimit'), 120),
            monthlyBudgetCents: toPositiveInt(formData.get('monthlyBudgetCents'), 3000),
            hardBlockEnabled: formData.get('hardBlockEnabled') === 'on',
        });

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false };
    }
}

export async function purgeAiUsageHistory(
    _prevState: { error: string; success: boolean; deletedCount: number },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()
        const retentionDays = toPositiveInt(formData.get('retentionDays'), 90);

        // A lógica foi movida para o use case `purgeKnowledgeBaseHistory`
        const deletedCount = await useCases
            .purgeKnowledgeBaseHistory()
            .execute(orgId, retentionDays);

        revalidatePath('/settings')
        return { error: '', success: true, deletedCount }
    } catch (err) {
        return { error: getErrorMessage(err), success: false, deletedCount: 0 }
    }
}

function safeText(value: FormDataEntryValue | null, maxLen = 4000): string {
    if (typeof value !== 'string') return ''
    return value.trim().slice(0, maxLen)
}

function parseTagList(value: FormDataEntryValue | null): string[] {
    if (typeof value !== 'string') return []

    return Array.from(
        new Set(
            value
                .split(',')
                .map((tag) => tag.trim().toLowerCase())
                .filter((tag) => tag.length >= 2)
                .slice(0, 20),
        ),
    )
}

const profileConfig = {
    pessoal: {
        title: 'Perfil Pessoal',
        metadataType: 'personal',
        errorMessage: 'Preencha ao menos um campo para salvar o perfil pessoal.',
        fields: [
            { key: 'bio', label: 'Apresentação pessoal (bio)', len: 5000, tag: false },
            { key: 'expertise', label: 'Área de especialização', len: 800, tag: true },
            { key: 'audience', label: 'Público / audiência', len: 1200, tag: true },
            { key: 'personalValues', label: 'Valores e missão pessoal', len: 2000, tag: false },
            { key: 'communicationStyle', label: 'Estilo de comunicação e tom de voz', len: 1200, tag: false },
            { key: 'servicesOffered', label: 'Serviços, produtos ou conteúdos que ofereço', len: 4000, tag: false },
            { key: 'achievements', label: 'Conquistas, cases e resultados', len: 2500, tag: false },
            { key: 'personalFaq', label: 'Perguntas frequentes sobre mim', len: 4000, tag: false },
        ],
        header: 'PERFIL PESSOAL — PROFISSIONAL / CRIADOR',
    },
    empresa: {
        title: 'Perfil Estratégico da Empresa',
        metadataType: 'organization_strategy',
        errorMessage: 'Preencha ao menos um campo para salvar na base de conhecimento.',
        fields: [
            { key: 'companySummary', label: 'Resumo da empresa', len: 5000, tag: false },
            { key: 'niche', label: 'Nicho de atuação', len: 800, tag: true },
            { key: 'targetAudience', label: 'Público-alvo', len: 1200, tag: true },
            { key: 'culture', label: 'Cultura e valores', len: 2000, tag: false },
            { key: 'brandVoice', label: 'Tom de voz e posicionamento', len: 1200, tag: false },
            { key: 'productsAndServices', label: 'Produtos e serviços', len: 4000, tag: false },
            { key: 'differentiators', label: 'Diferenciais competitivos', len: 2500, tag: false },
            { key: 'objectionsAndFaq', label: 'Objeções comuns e respostas', len: 4000, tag: false },
        ],
        header: 'PERFIL ESTRATEGICO DA EMPRESA',
    },
}

export async function saveKnowledgeBaseProfile(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()
        const profileType = (safeText(formData.get('profileType'), 10) || 'empresa') as 'empresa' | 'pessoal'
        const config = profileConfig[profileType]

        const fieldValues = config.fields.map(f => safeText(formData.get(f.key), f.len))
        if (fieldValues.every(v => v.length === 0)) {
            return { error: config.errorMessage, success: false }
        }

        const autoTagValues = config.fields.reduce<string[]>((acc, f, i) => {
            if (f.tag) acc.push(fieldValues[i])
            return acc
        }, [])

        const autoTags = autoTagValues
            .flatMap((value) => value.split(/[,;\n]/g))
            .map((value) => value.trim().toLowerCase())
            .filter((value) => value.length >= 2)

        const customTags = parseTagList(formData.get('tags'))
        const tags = Array.from(new Set([...customTags, ...autoTags])).slice(0, 24)

        const contentBody = config.fields
            .map((field, i) => `${field.label}:\n${fieldValues[i] || 'Não informado.'}`)
            .join('\n\n')

        const content = [config.header, `Atualizado em: ${new Date().toISOString()}`, '', contentBody].join('\n')

        const metadata = {
            source: 'settings_knowledge_base',
            profileType: config.metadataType,
            tags,
            updatedAt: new Date().toISOString(),
        }

        const result = await useCases.addKnowledgeBase().execute(orgId, { title: config.title, content, metadata })
        if (!result.ok) {
            return { error: `Falha ao salvar perfil: ${result.error.message}`, success: false }
        }

        revalidatePath('/settings')
        revalidatePath('/knowledge-base')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function updateKnowledgeBaseEntry(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()
        const entryId = safeText(formData.get('entryId'), 128)
        const title = safeText(formData.get('title'), 300)
        const content = safeText(formData.get('content'), 8000)
        const tags = parseTagList(formData.get('tags'))

        if (!entryId) return { error: 'Entrada inválida.', success: false }
        if (!title || !content) return { error: 'Título e conteúdo são obrigatórios.', success: false }

        // A lógica foi movida para o use case `updateKnowledgeBaseEntry`
        await useCases.updateKnowledgeBaseEntry().execute(orgId, entryId, {
            title,
            content,
            tags,
        })

        revalidatePath('/settings')
        revalidatePath('/knowledge-base')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function deleteKnowledgeBaseEntry(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()
        const entryId = safeText(formData.get('entryId'), 128)

        if (!entryId) return { error: 'Entrada inválida.', success: false }

        // A lógica foi movida para o use case `deleteKnowledgeBaseEntry`
        await useCases.deleteKnowledgeBaseEntry().execute(orgId, entryId)

        revalidatePath('/settings')
        revalidatePath('/knowledge-base')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

const MAX_KB_IMAGE_BYTES = 8 * 1024 * 1024
const KB_IMAGE_BUCKET = 'knowledge-base-assets'
const ALLOWED_KB_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function sanitizeFileName(fileName: string): string {
    return fileName
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 120)
}

export async function uploadKnowledgeBaseImage(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()
        const title = safeText(formData.get('imageTitle'), 300)
        const description = safeText(formData.get('imageDescription'), 4000)
        const extractedText = safeText(formData.get('imageExtractedText'), 5000)
        const tags = parseTagList(formData.get('imageTags'))
        const file = formData.get('imageFile') as File | null

        if (!file) return { error: 'Selecione uma imagem para upload.', success: false }
        if (!title) return { error: 'Informe um título para a imagem.', success: false }
        if (!ALLOWED_KB_IMAGE_TYPES.has(file.type)) {
            return { error: 'Formato inválido. Use JPG, PNG ou WEBP.', success: false }
        }
        if (file.size <= 0 || file.size > MAX_KB_IMAGE_BYTES) {
            return { error: 'Imagem muito grande. Limite de 8MB por arquivo.', success: false }
        }

        // A lógica de upload e criação da entrada foi movida para um use case
        await useCases.uploadKnowledgeBaseImage().execute(orgId, {
            title,
            description,
            extractedText,
            tags,
            file,
        })

        revalidatePath('/settings')
        revalidatePath('/knowledge-base')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export type { KnowledgeEntryType } from '@/lib/knowledge-base-constants'

export async function saveKnowledgeBaseEntry(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()

        const title   = safeText(formData.get('title'), 300)
        const content = safeText(formData.get('content'), 8000)
        const type    = safeText(formData.get('type'), 30) || 'geral'
        const tags    = parseTagList(formData.get('tags'))

        if (!title) return { error: 'Título é obrigatório.', success: false }
        if (!content || content.length < 20) return { error: 'Conteúdo deve ter ao menos 20 caracteres.', success: false }

        const metadata = {
            source: 'knowledge_base_page',
            entryType: type,
            tags,
            updatedAt: new Date().toISOString(),
        }

        // Padroniza o uso de use cases para manipulação de dados, em vez de acesso direto ao DB.
        // Assumindo que `addKnowledgeBase` aceita metadados e cuida da indexação.
        const result = await useCases.addKnowledgeBase().execute(orgId, {
            title,
            content,
            metadata,
            landingPageId: null,
        })

        if (!result.ok) {
            return { error: `Falha ao salvar na base de conhecimento: ${result.error.message}`, success: false }
        }

        revalidatePath('/knowledge-base')
        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}
