/**
 * SaaS Module Registry — Products, Plans, Subscriptions, Credits, Sites, Domains
 *
 * Encapsulates repository singletons and use case factories
 * for the SaaS/billing domain.
 */
import {
    SupabaseProductRepository,
    SupabasePlanRepository,
    SupabaseSiteRepository,
    SupabaseSubscriptionRepository,
    SupabaseCreditRepository,
    SupabaseCustomDomainRepository,
} from '@/infrastructure/repositories'
import {
    CreateProductUseCase,
    UpdateProductUseCase,
    GetProductUseCase,
    ToggleProductStatusUseCase,
    DeleteProductUseCase,
    ListProductsUseCase,
    ListActiveProductsUseCase,
} from '@/application/use-cases/products'
import {
    GetPlansUseCase,
    GetSubscriptionUseCase,
    GetCreditTransactionsUseCase,
    GetCreditPacksUseCase,
    ChangePlanUseCase,
    GrantCreditsUseCase,
    GrantCreditsFromPackUseCase,
    ListAllSubscriptionsUseCase,
    ListAllPlansAdminUseCase,
    GetPlanByIdUseCase,
    UpsertPlanUseCase,
} from '@/application/use-cases/saas'
import { CreateSiteUseCase, ListSitesUseCase, GetSiteDetailUseCase, UpdateSiteUseCase, DeleteSiteUseCase } from '@/application/use-cases/sites'
import { ListCustomDomainsUseCase, GetCustomDomainUseCase, AddCustomDomainUseCase, UpdateCustomDomainUseCase, CheckCustomDomainStatusUseCase, DeleteCustomDomainUseCase } from '@/application/use-cases/custom-domains'

// Repository singletons
export const productRepo = new SupabaseProductRepository()
export const planRepo = new SupabasePlanRepository()
export const subscriptionRepo = new SupabaseSubscriptionRepository()
export const creditRepo = new SupabaseCreditRepository()
export const siteRepo = new SupabaseSiteRepository()
export const customDomainRepo = new SupabaseCustomDomainRepository()

// Use case factories
export const saasUseCases = {
    // Products
    createProduct: () => new CreateProductUseCase(productRepo),
    updateProduct: () => new UpdateProductUseCase(productRepo),
    getProduct: () => new GetProductUseCase(productRepo),
    toggleProductStatus: () => new ToggleProductStatusUseCase(productRepo),
    deleteProduct: () => new DeleteProductUseCase(productRepo),
    listProducts: () => new ListProductsUseCase(productRepo),
    listActiveProducts: () => new ListActiveProductsUseCase(productRepo),

    // Plans & Subscriptions & Credits
    getPlans: () => new GetPlansUseCase(planRepo),
    getSubscription: () => new GetSubscriptionUseCase(subscriptionRepo),
    getCreditTransactions: () => new GetCreditTransactionsUseCase(creditRepo),
    getCreditPacks: () => new GetCreditPacksUseCase(creditRepo),
    changePlan: () => new ChangePlanUseCase(planRepo, subscriptionRepo, creditRepo),
    grantCredits: () => new GrantCreditsUseCase(creditRepo),
    grantCreditsFromPack: () => new GrantCreditsFromPackUseCase(creditRepo),
    listAllSubscriptions: () => new ListAllSubscriptionsUseCase(subscriptionRepo),
    listAllPlansAdmin: () => new ListAllPlansAdminUseCase(planRepo),
    getPlanById: () => new GetPlanByIdUseCase(planRepo),
    upsertPlan: () => new UpsertPlanUseCase(planRepo),

    // Sites
    listSites: () => new ListSitesUseCase(siteRepo),
    getSiteDetail: () => new GetSiteDetailUseCase(siteRepo),
    createSite: () => new CreateSiteUseCase(siteRepo),
    updateSite: () => new UpdateSiteUseCase(siteRepo),
    deleteSite: () => new DeleteSiteUseCase(siteRepo),

    // Custom Domains
    listCustomDomains: () => new ListCustomDomainsUseCase(customDomainRepo),
    getCustomDomain: () => new GetCustomDomainUseCase(customDomainRepo),
    addCustomDomain: () => new AddCustomDomainUseCase(customDomainRepo),
    updateCustomDomain: () => new UpdateCustomDomainUseCase(customDomainRepo),
    checkCustomDomainStatus: () => new CheckCustomDomainStatusUseCase(customDomainRepo),
    deleteCustomDomain: () => new DeleteCustomDomainUseCase(customDomainRepo),
} as const
