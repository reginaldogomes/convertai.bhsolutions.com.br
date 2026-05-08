/**
 * Module Registry Barrel Export
 *
 * Re-exports all repository singletons and services from domain modules.
 * For use case access, import from the container directly.
 */

// CRM
export { contactRepo, dealRepo, messageRepo, whatsAppService, emailService, smsService } from './crm.module'

// Marketing
export { campaignRepo, landingPageRepo, knowledgeBaseRepo, analyticsRepo, campaignRecipientRepo, ragService } from './marketing.module'

// Organization
export { userRepo } from './org.module'

// Automation
export { automationRepo } from './automation.module'

// Instagram
export { instagramContentRepo, instagramAccountRepo, instagramAutoConfigRepo, instagramService } from './instagram.module'

// SaaS
export { productRepo, planRepo, subscriptionRepo, creditRepo, siteRepo, customDomainRepo } from './saas.module'
