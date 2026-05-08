/**
 * CRM Module Registry — Contacts, Deals, Messages
 *
 * Encapsulates repository singletons and use case factories
 * for the CRM domain.
 */
import {
    SupabaseContactRepository,
    SupabaseDealRepository,
    SupabaseMessageRepository,
} from '@/infrastructure/repositories'
import { TwilioWhatsAppService } from '@/infrastructure/services/twilio-whatsapp-service'
import { SendGridEmailService } from '@/infrastructure/services/sendgrid-email-service'
import { ResendEmailService } from '@/infrastructure/services/resend-email-service'
import { TwilioSmsService } from '@/infrastructure/services/twilio-sms-service'
import { MockWhatsAppService, MockSmsService, MockEmailService } from '@/infrastructure/services/mock-services'
import { CreateContactUseCase, ListContactsUseCase, GetContactDetailUseCase, DeleteContactUseCase } from '@/application/use-cases/contacts'
import { CreateDealUseCase, MoveDealUseCase, ListDealsUseCase } from '@/application/use-cases/deals'
import { SendMessageUseCase, ListThreadsUseCase } from '@/application/use-cases/messages'

// Repository singletons
export const contactRepo = new SupabaseContactRepository()
export const dealRepo = new SupabaseDealRepository()
export const messageRepo = new SupabaseMessageRepository()

// Service singletons
const DEV_MOCK = process.env.DEV_MOCK_INTEGRATIONS === 'true'
export const whatsAppService = DEV_MOCK ? new MockWhatsAppService() : new TwilioWhatsAppService()
export const emailService = DEV_MOCK
    ? new MockEmailService()
    : process.env.EMAIL_PROVIDER === 'sendgrid'
        ? new SendGridEmailService()
        : new ResendEmailService()
export const smsService = DEV_MOCK ? new MockSmsService() : new TwilioSmsService()

// Use case factories
export const crmUseCases = {
    createContact: () => new CreateContactUseCase(contactRepo),
    listContacts: () => new ListContactsUseCase(contactRepo),
    getContactDetail: () => new GetContactDetailUseCase(contactRepo, messageRepo, dealRepo),
    deleteContact: () => new DeleteContactUseCase(contactRepo),

    createDeal: () => new CreateDealUseCase(dealRepo),
    moveDeal: () => new MoveDealUseCase(dealRepo),
    listDeals: () => new ListDealsUseCase(dealRepo),

    sendMessage: () => new SendMessageUseCase(messageRepo, contactRepo, whatsAppService, emailService, smsService),
    listThreads: () => new ListThreadsUseCase(messageRepo),
} as const
