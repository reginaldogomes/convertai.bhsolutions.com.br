import { z } from 'zod'
import { type Result, success, failure, ValidationError } from '@/domain/errors'
import type { IContactRepository } from '@/domain/interfaces'
import type { Contact } from '@/domain/entities'

const phoneRegex = /^\+?[\d\s()-]{8,20}$/

const createContactSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Telefone inválido').optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    tags: z.string().optional(),
    notes: z.string().optional().or(z.literal('')),
})

export class CreateContactUseCase {
    constructor(private readonly contactRepo: IContactRepository) {}

    async execute(orgId: string, input: {
        name: string
        email?: string
        phone?: string
        company?: string
        tags?: string
        notes?: string
    }): Promise<Result<Contact>> {
        const parsed = createContactSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const tagArray = parsed.data.tags
            ? parsed.data.tags.split(',').map(t => t.trim()).filter(Boolean)
            : []

        const contact = await this.contactRepo.create({
            organizationId: orgId,
            name: parsed.data.name,
            email: parsed.data.email || null,
            phone: parsed.data.phone || null,
            company: parsed.data.company || null,
            tags: tagArray,
            notes: parsed.data.notes || null,
        })

        if (!contact) return failure(new ValidationError('Erro ao criar contato'))
        return success(contact)
    }
}
