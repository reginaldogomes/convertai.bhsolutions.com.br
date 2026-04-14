import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    CreateCampaignUseCase,
    UpdateCampaignUseCase,
    GetCampaignUseCase,
    SendCampaignUseCase,
} from '@/application/use-cases/campaigns'
import { Campaign } from '@/domain/entities/campaign'
import type { ICampaignRepository } from '@/domain/interfaces/campaign-repository'
import type { IContactRepository } from '@/domain/interfaces/contact-repository'
import type { IEmailService } from '@/domain/interfaces/email-service'
import type { IWhatsAppService } from '@/domain/interfaces/whatsapp-service'
import type { ISmsService } from '@/domain/interfaces/sms-service'
import type { ICampaignRecipientRepository } from '@/domain/interfaces/campaign-recipient-repository'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEmailCampaign(overrides: Partial<ConstructorParameters<typeof Campaign>[0]> = {}): Campaign {
    return new Campaign({
        id: 'camp-1',
        organizationId: 'org-1',
        name: 'Campanha Email',
        subject: 'Assunto teste',
        body: '<p>Olá {{nome}}</p>',
        channel: 'email',
        status: 'draft',
        sentAt: null,
        metrics: { open_rate: 0, click_rate: 0, bounce_rate: 0, total_sent: 0, total_failed: 0 },
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

function makeWhatsAppCampaign(overrides: Partial<ConstructorParameters<typeof Campaign>[0]> = {}): Campaign {
    return new Campaign({
        id: 'camp-2',
        organizationId: 'org-1',
        name: 'Campanha WhatsApp',
        subject: '',
        body: 'Olá {{nome}}!',
        channel: 'whatsapp',
        status: 'draft',
        sentAt: null,
        metrics: { open_rate: 0, click_rate: 0, bounce_rate: 0, total_sent: 0, total_failed: 0 },
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

const mockContacts = [
    { id: 'c1', organizationId: 'org-1', name: 'João', email: 'joao@test.com', phone: '+5531998811678', company: null, tags: [], notes: null, createdAt: '' },
    { id: 'c2', organizationId: 'org-1', name: 'Maria', email: 'maria@test.com', phone: '+5511912345678', company: null, tags: [], notes: null, createdAt: '' },
]

// ─── CreateCampaignUseCase ────────────────────────────────────────────────────

describe('CreateCampaignUseCase', () => {
    let repo: ICampaignRepository
    let useCase: CreateCampaignUseCase

    beforeEach(() => {
        repo = {
            create: vi.fn().mockResolvedValue(makeEmailCampaign()),
            findById: vi.fn(),
            findByOrgId: vi.fn(),
            update: vi.fn(),
            updateStatus: vi.fn(),
            countSentByOrgId: vi.fn(),
        }
        useCase = new CreateCampaignUseCase(repo)
    })

    it('creates a campaign successfully with valid data', async () => {
        const result = await useCase.execute('org-1', {
            name: 'Nova Campanha',
            subject: 'Assunto',
            body: '<p>Corpo</p>',
        })

        expect(result.ok).toBe(true)
        expect(repo.create).toHaveBeenCalledOnce()
    })

    it('returns validation error when name is empty', async () => {
        const result = await useCase.execute('org-1', { name: '', subject: 'Sub', body: 'Body' })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe('VALIDATION_ERROR')
        }
    })

    it('returns validation error when name exceeds 200 chars', async () => {
        const result = await useCase.execute('org-1', { name: 'x'.repeat(201), body: 'Body' })

        expect(result.ok).toBe(false)
    })

    it('defaults channel to email when not specified', async () => {
        await useCase.execute('org-1', { name: 'Campanha', body: 'Body' })

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ channel: 'email' })
        )
    })

    it('passes the correct channel when specified', async () => {
        await useCase.execute('org-1', { name: 'WA Camp', body: 'Msg', channel: 'whatsapp' })

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ channel: 'whatsapp' })
        )
    })

    it('returns validation error for invalid channel', async () => {
        const result = await useCase.execute('org-1', { name: 'Campanha', body: 'Body', channel: 'fax' })

        expect(result.ok).toBe(false)
    })

    it('returns error when repo.create returns null', async () => {
        vi.mocked(repo.create).mockResolvedValueOnce(null)
        const result = await useCase.execute('org-1', { name: 'Camp', body: 'Body' })

        expect(result.ok).toBe(false)
    })
})

// ─── UpdateCampaignUseCase ────────────────────────────────────────────────────

describe('UpdateCampaignUseCase', () => {
    let repo: ICampaignRepository
    let useCase: UpdateCampaignUseCase

    beforeEach(() => {
        repo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByOrgId: vi.fn(),
            update: vi.fn().mockResolvedValue(makeEmailCampaign({ name: 'Atualizada' })),
            updateStatus: vi.fn(),
            countSentByOrgId: vi.fn(),
        }
        useCase = new UpdateCampaignUseCase(repo)
    })

    it('updates campaign successfully', async () => {
        const result = await useCase.execute('org-1', 'camp-1', { name: 'Novo Nome' })

        expect(result.ok).toBe(true)
        expect(repo.update).toHaveBeenCalledWith('camp-1', 'org-1', expect.objectContaining({ name: 'Novo Nome' }))
    })

    it('returns EntityNotFoundError when update returns null', async () => {
        vi.mocked(repo.update).mockResolvedValueOnce(null)
        const result = await useCase.execute('org-1', 'camp-1', { name: 'X' })

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('ENTITY_NOT_FOUND')
    })

    it('validates name length on update', async () => {
        const result = await useCase.execute('org-1', 'camp-1', { name: 'n'.repeat(201) })

        expect(result.ok).toBe(false)
    })
})

// ─── GetCampaignUseCase ───────────────────────────────────────────────────────

describe('GetCampaignUseCase', () => {
    let repo: ICampaignRepository
    let useCase: GetCampaignUseCase

    beforeEach(() => {
        repo = {
            create: vi.fn(),
            findById: vi.fn().mockResolvedValue(makeEmailCampaign()),
            findByOrgId: vi.fn(),
            update: vi.fn(),
            updateStatus: vi.fn(),
            countSentByOrgId: vi.fn(),
        }
        useCase = new GetCampaignUseCase(repo)
    })

    it('returns campaign when found for the correct org', async () => {
        const result = await useCase.execute('org-1', 'camp-1')

        expect(result.ok).toBe(true)
    })

    it('returns EntityNotFoundError when campaign belongs to different org', async () => {
        vi.mocked(repo.findById).mockResolvedValueOnce(makeEmailCampaign({ organizationId: 'other-org' }))
        const result = await useCase.execute('org-1', 'camp-1')

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('ENTITY_NOT_FOUND')
    })

    it('returns EntityNotFoundError when campaign is not found', async () => {
        vi.mocked(repo.findById).mockResolvedValueOnce(null)
        const result = await useCase.execute('org-1', 'camp-1')

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('ENTITY_NOT_FOUND')
    })
})

// ─── SendCampaignUseCase ──────────────────────────────────────────────────────

describe('SendCampaignUseCase', () => {
    let campaignRepo: ICampaignRepository
    let contactRepo: IContactRepository
    let emailService: IEmailService
    let whatsAppService: IWhatsAppService
    let smsService: ISmsService
    let recipientRepo: ICampaignRecipientRepository
    let useCase: SendCampaignUseCase

    beforeEach(() => {
        campaignRepo = {
            create: vi.fn(),
            findById: vi.fn().mockResolvedValue(makeEmailCampaign()),
            findByOrgId: vi.fn(),
            update: vi.fn(),
            updateStatus: vi.fn().mockResolvedValue(true),
            countSentByOrgId: vi.fn(),
        }

        contactRepo = {
            findByOrgId: vi.fn().mockResolvedValue([]),
            findById: vi.fn(),
            findWithEmailByOrgId: vi.fn().mockResolvedValue(mockContacts),
            findWithPhoneByOrgId: vi.fn().mockResolvedValue(mockContacts),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            existsByEmail: vi.fn(),
            countByOrgId: vi.fn(),
            upsertFromLead: vi.fn(),
        }

        emailService = {
            send: vi.fn(),
            sendBatch: vi.fn().mockResolvedValue({ sent: 2, failed: 0 }),
        }

        whatsAppService = {
            send: vi.fn().mockResolvedValue({ sid: 'MOCK_SID', status: 'queued' }),
        }

        smsService = {
            send: vi.fn(),
            sendBatch: vi.fn().mockResolvedValue({ sent: 2, failed: 0 }),
        }

        recipientRepo = {
            bulkCreate: vi.fn().mockResolvedValue(undefined),
            findByCampaignId: vi.fn(),
            updateStatus: vi.fn(),
        }

        useCase = new SendCampaignUseCase(
            campaignRepo,
            contactRepo,
            emailService,
            whatsAppService,
            smsService,
            recipientRepo,
        )
    })

    // ── Email channel ──────────────────────────────────────────────────────────

    describe('email channel', () => {
        it('sends email campaign successfully', async () => {
            const result = await useCase.execute('org-1', 'camp-1')

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.sent).toBe(2)
                expect(result.value.failed).toBe(0)
            }
        })

        it('calls sendBatch with correct recipient addresses', async () => {
            await useCase.execute('org-1', 'camp-1')

            expect(emailService.sendBatch).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ to: 'joao@test.com' }),
                    expect.objectContaining({ to: 'maria@test.com' }),
                ])
            )
        })

        it('personalizes body with contact name', async () => {
            const campaign = makeEmailCampaign({ body: '<p>Olá {{nome}}, seu email é {{email}}</p>' })
            vi.mocked(campaignRepo.findById).mockResolvedValue(campaign)

            await useCase.execute('org-1', 'camp-1')

            const calls = vi.mocked(emailService.sendBatch).mock.calls[0][0] as Array<{ html: string }>
            expect(calls[0].html).toContain('João')
            expect(calls[0].html).toContain('joao@test.com')
            expect(calls[0].html).not.toContain('{{nome}}')
        })

        it('returns error when no contacts with email are found', async () => {
            vi.mocked(contactRepo.findWithEmailByOrgId).mockResolvedValue([])
            const result = await useCase.execute('org-1', 'camp-1')

            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
        })

        it('returns error when campaign is not draft (canSend fails)', async () => {
            vi.mocked(campaignRepo.findById).mockResolvedValue(makeEmailCampaign({ status: 'sent' }))
            const result = await useCase.execute('org-1', 'camp-1')

            expect(result.ok).toBe(false)
        })

        it('saves recipients via bulkCreate after sending', async () => {
            await useCase.execute('org-1', 'camp-1')

            expect(recipientRepo.bulkCreate).toHaveBeenCalledOnce()
            const rows = vi.mocked(recipientRepo.bulkCreate).mock.calls[0][0]
            expect(rows).toHaveLength(2)
        })

        it('updates campaign status to sent after sending', async () => {
            await useCase.execute('org-1', 'camp-1')

            expect(campaignRepo.updateStatus).toHaveBeenCalledWith(
                'camp-1',
                'org-1',
                'sent',
                expect.objectContaining({ total_sent: 2 })
            )
        })
    })

    // ── WhatsApp channel ───────────────────────────────────────────────────────

    describe('whatsapp channel', () => {
        beforeEach(() => {
            vi.mocked(campaignRepo.findById).mockResolvedValue(makeWhatsAppCampaign())
        })

        it('sends whatsapp campaign successfully', async () => {
            const result = await useCase.execute('org-1', 'camp-2')

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.sent).toBe(2)
                expect(result.value.failed).toBe(0)
            }
        })

        it('calls whatsAppService.send for each contact', async () => {
            await useCase.execute('org-1', 'camp-2')

            expect(whatsAppService.send).toHaveBeenCalledTimes(2)
        })

        it('marks recipient as failed for invalid phone numbers', async () => {
            vi.mocked(contactRepo.findWithPhoneByOrgId).mockResolvedValue([
                { ...mockContacts[0], phone: 'invalid' },
            ])

            const result = await useCase.execute('org-1', 'camp-2')

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.failed).toBe(1)
                expect(result.value.sent).toBe(0)
            }
        })

        it('records failed recipients when send throws', async () => {
            vi.mocked(whatsAppService.send).mockRejectedValueOnce(new Error('Twilio error'))

            const result = await useCase.execute('org-1', 'camp-2')

            if (result.ok) {
                expect(result.value.failed).toBeGreaterThan(0)
            }
        })

        it('returns error when no contacts with phone are found', async () => {
            vi.mocked(contactRepo.findWithPhoneByOrgId).mockResolvedValue([])
            const result = await useCase.execute('org-1', 'camp-2')

            expect(result.ok).toBe(false)
        })
    })

    // ── SMS channel ────────────────────────────────────────────────────────────

    describe('sms channel', () => {
        beforeEach(() => {
            vi.mocked(campaignRepo.findById).mockResolvedValue(
                new Campaign({
                    id: 'camp-3',
                    organizationId: 'org-1',
                    name: 'SMS Campaign',
                    subject: '',
                    body: 'Olá {{nome}}!',
                    channel: 'sms',
                    status: 'draft',
                    sentAt: null,
                    metrics: { open_rate: 0, click_rate: 0, bounce_rate: 0, total_sent: 0, total_failed: 0 },
                    createdAt: '2026-01-01T00:00:00Z',
                })
            )
        })

        it('sends SMS campaign successfully', async () => {
            const result = await useCase.execute('org-1', 'camp-3')

            expect(result.ok).toBe(true)
            expect(smsService.sendBatch).toHaveBeenCalledOnce()
        })

        it('filters out contacts with invalid phones', async () => {
            vi.mocked(contactRepo.findWithPhoneByOrgId).mockResolvedValue([
                { ...mockContacts[0], phone: 'invalid-phone' },
                mockContacts[1],
            ])

            await useCase.execute('org-1', 'camp-3')

            const smsCalls = vi.mocked(smsService.sendBatch).mock.calls[0][0] as Array<{ to: string }>
            // Only contact with valid phone should be included
            expect(smsCalls).toHaveLength(1)
            expect(smsCalls[0].to).toBe('+5511912345678')
        })
    })

    // ── Cross-cutting ──────────────────────────────────────────────────────────

    describe('cross-cutting concerns', () => {
        it('returns EntityNotFoundError when campaign not found', async () => {
            vi.mocked(campaignRepo.findById).mockResolvedValue(null)
            const result = await useCase.execute('org-1', 'unknown-id')

            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.error.code).toBe('ENTITY_NOT_FOUND')
        })

        it('rejects campaigns belonging to a different org', async () => {
            vi.mocked(campaignRepo.findById).mockResolvedValue(
                makeEmailCampaign({ organizationId: 'other-org' })
            )
            const result = await useCase.execute('org-1', 'camp-1')

            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.error.code).toBe('ENTITY_NOT_FOUND')
        })

        it('returns error for unknown channel', async () => {
            vi.mocked(campaignRepo.findById).mockResolvedValue(
                new Campaign({
                    id: 'camp-x',
                    organizationId: 'org-1',
                    name: 'X',
                    subject: '',
                    body: 'Body',
                    channel: 'fax',
                    status: 'draft',
                    sentAt: null,
                    metrics: { open_rate: 0, click_rate: 0, bounce_rate: 0, total_sent: 0, total_failed: 0 },
                    createdAt: '2026-01-01T00:00:00Z',
                })
            )
            const result = await useCase.execute('org-1', 'camp-x')

            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
        })
    })
})
