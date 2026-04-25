# Arquitetura de Sites com RAG - Configuração Dinâmica

## 📐 Visão Geral

Sistema modular para configuração de sites usando:
- **Estrutura baseada em Landing Pages** (comprovado)
- **RAG (Retrieval-Augmented Generation)** para sugerir configurações
- **config_json dinâmico** para armazenar seções modulares
- **Conhecimento organizado por site** para contextualização de IA

---

## 🗂️ Estrutura de Dados Expandida

### Tabela `sites` (ALTERADA)

```sql
ALTER TABLE sites ADD COLUMN (
  config_json jsonb NOT NULL DEFAULT '{}',
  primary_color varchar(7) DEFAULT '#3b82f6',
  logo_url varchar(2048),
  description text,
  theme varchar(20) DEFAULT 'light',
  status varchar(20) DEFAULT 'draft' -- draft, published, archived
);
```

**Estrutura do config_json:**
```json
{
  "theme": "light",
  "primaryColor": "#3b82f6",
  "logoUrl": "https://...",
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "order": 0,
      "visible": true,
      "content": {
        "headline": "Bem-vindo",
        "subheadline": "...",
        "ctaText": "Começar",
        "backgroundImage": "..."
      }
    },
    {
      "id": "features-1",
      "type": "features",
      "order": 1,
      "visible": true,
      "content": {
        "title": "Recursos",
        "items": [
          { "icon": "check", "title": "Rápido", "description": "..." }
        ]
      }
    },
    {
      "id": "contact-1",
      "type": "contact_form",
      "order": 2,
      "visible": true,
      "content": {
        "title": "Entre em contato",
        "successMessage": "Obrigado!",
        "fields": ["name", "email", "message"]
      }
    }
  ],
  "modules": {
    "chatbot": {
      "enabled": true,
      "name": "Assistente",
      "welcomeMessage": "Olá! 👋",
      "systemPrompt": "Você é um assistente..."
    },
    "analytics": {
      "enabled": true,
      "trackingId": "GA-xxx"
    },
    "seo": {
      "enabled": true,
      "metaDescription": "...",
      "keywords": ["..."]
    },
    "integrations": {
      "whatsapp": { "enabled": false, "phoneNumber": null },
      "email": { "enabled": true, "listId": "..." },
      "slack": { "enabled": false, "webhookUrl": null }
    }
  }
}
```

### Tabela `site_knowledge_base` (NOVA)

Similar ao `knowledge_base` mas específica do site:

```sql
CREATE TABLE site_knowledge_base (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES sites(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  
  title varchar(255) NOT NULL,
  content text NOT NULL,
  source varchar(100), -- 'manual', 'imported', 'generated'
  
  embedding vector(768),
  metadata_json jsonb, -- { tags: [], category: 'branding', ... }
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp
);
```

### Tabela `site_sections` (ALTERNATIVA - NORMALIZADA)

Para sites com muitas seções complexas:

```sql
CREATE TABLE site_sections (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES sites(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  
  type varchar(50) NOT NULL, -- 'hero', 'features', 'contact_form', etc
  title varchar(255),
  order_index int NOT NULL,
  visible boolean DEFAULT true,
  
  content_json jsonb NOT NULL, -- conteúdo específico do tipo
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp
);

CREATE INDEX idx_site_sections_site_id ON site_sections(site_id, order_index);
```

---

## 🏗️ Arquitetura de Camadas

### 1. **Domain Layer**

#### Entidade: `SiteConfig`

```typescript
interface SiteConfigProps {
  id: string
  organizationId: string
  siteName: string
  
  // Branding
  primaryColor: string
  logoUrl: string | null
  theme: 'light' | 'dark'
  
  // Módulos
  chatbotEnabled: boolean
  chatbotConfig?: ChatbotConfig
  analyticsEnabled: boolean
  seoEnabled: boolean
  integrations: SiteIntegrations
  
  // Seções
  sections: SiteSection[]
  
  // Metadata
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date | null
}

// Tipos de seções (similar a Landing Pages)
type SiteSection = 
  | HeroSection
  | FeaturesSection
  | ContactFormSection
  | TestimonialsSection
  | PricingSection
  | FaqSection
  | CtaBannerSection
  | VideoSection
  | StatsSection
  | LogoCloudSection
  | GallerySection

interface BaseSection {
  id: string
  type: string
  order: number
  visible: boolean
}

interface HeroSection extends BaseSection {
  type: 'hero'
  content: {
    headline: string
    subheadline?: string
    backgroundImage?: string
    ctaText?: string
    ctaLink?: string
  }
}

// ... mais tipos de seções
```

#### Interface: `ISiteRepository`

```typescript
interface ISiteRepository {
  // CRUD básico
  findById(id: string, orgId: string): Promise<Site | null>
  findByOrgId(orgId: string): Promise<Site[]>
  create(orgId: string, input: CreateSiteInput): Promise<Site>
  update(id: string, orgId: string, input: UpdateSiteInput): Promise<Site>
  delete(id: string, orgId: string): Promise<void>
  
  // Config
  getConfig(id: string, orgId: string): Promise<SiteConfig | null>
  updateConfig(id: string, orgId: string, config: SiteConfig): Promise<Site>
  
  // Seções
  addSection(siteId: string, section: SiteSection): Promise<SiteSection>
  updateSection(siteId: string, sectionId: string, updates: Partial<SiteSection>): Promise<SiteSection>
  deleteSection(siteId: string, sectionId: string): Promise<void>
  reorderSections(siteId: string, newOrder: Array<{ id: string; order: number }>): Promise<void>
}

interface ISiteKnowledgeBaseRepository {
  // Gerenciar conhecimento contextual do site
  findBySiteId(siteId: string, orgId: string): Promise<SiteKnowledgeEntry[]>
  create(entry: CreateKnowledgeEntryInput): Promise<SiteKnowledgeEntry>
  updateEmbedding(id: string, embedding: number[]): Promise<boolean>
  searchSimilar(embedding: number[], siteId: string, limit?: number): Promise<KnowledgeBaseMatch[]>
  delete(id: string): Promise<void>
}
```

### 2. **Application Layer (Use Cases)**

#### Use Cases de Configuração

```typescript
// site-configuration/index.ts

export class GetSiteConfigUseCase {
  execute(siteId: string, orgId: string): Promise<SiteConfig>
}

export class UpdateSiteGeneralUseCase {
  execute(siteId: string, orgId: string, input: {
    name?: string
    primaryColor?: string
    logoUrl?: string
    theme?: 'light' | 'dark'
  }): Promise<SiteConfig>
}

export class EnableChatbotUseCase {
  execute(siteId: string, orgId: string, config: ChatbotConfig): Promise<SiteConfig>
}

export class EnableAnalyticsUseCase {
  execute(siteId: string, orgId: string, trackingId: string): Promise<SiteConfig>
}

export class UpdateIntegrationsUseCase {
  execute(siteId: string, orgId: string, integrations: Partial<SiteIntegrations>): Promise<SiteConfig>
}

// site-sections/index.ts

export class AddSiteSectionUseCase {
  execute(siteId: string, orgId: string, section: CreateSiteSection): Promise<SiteSection>
}

export class UpdateSiteSectionUseCase {
  execute(siteId: string, orgId: string, sectionId: string, updates: Partial<SiteSection>): Promise<SiteSection>
}

export class DeleteSiteSectionUseCase {
  execute(siteId: string, orgId: string, sectionId: string): Promise<void>
}

export class ReorderSiteSectionsUseCase {
  execute(siteId: string, orgId: string, newOrder: Array<{ id: string; order: number }>): Promise<SiteConfig>
}

// ai-suggestions/index.ts

export class GenerateSiteConfigSuggestionsUseCase {
  constructor(
    private ragService: IRagService,
    private siteKbRepo: ISiteKnowledgeBaseRepository
  ) {}
  
  async execute(siteId: string, orgId: string, prompt: string): Promise<SiteConfigSuggestion> {
    // 1. Buscar conhecimento contextual do site via RAG
    const relevantKnowledge = await this.ragService.search(prompt, siteId)
    
    // 2. Usar contexto para gerar sugestões com IA
    // 3. Retornar seções, cores, textos sugeridos
  }
}

export class GenerateSiteSectionUseCase {
  constructor(private ragService: IRagService) {}
  
  async execute(siteId: string, sectionType: string, brief: string): Promise<SiteSection> {
    // 1. Buscar contexto do site
    // 2. Gerar seção usando IA
    // 3. Retornar seção formatada
  }
}
```

### 3. **Infrastructure Layer**

#### Repository: `SupabaseSiteRepository` (EXPANDIDO)

```typescript
export class SupabaseSiteRepository implements ISiteRepository {
  async getConfig(id: string, orgId: string): Promise<SiteConfig | null> {
    const site = await this.findById(id, orgId)
    if (!site) return null
    
    return {
      ...site,
      // Parsear config_json
      sections: site.config.sections,
      modules: site.config.modules,
      // ...
    }
  }
  
  async updateConfig(id: string, orgId: string, config: SiteConfig): Promise<Site> {
    const { error } = await admin
      .from('sites')
      .update({
        config_json: config,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', orgId)
    
    if (error) throw new DomainError('UPDATE_FAILED', error.message)
    
    return this.findById(id, orgId)
  }
  
  async addSection(siteId: string, section: SiteSection): Promise<SiteSection> {
    // 1. Buscar config atual
    // 2. Adicionar nova seção no array
    // 3. Atualizar no BD
    // 4. Retornar seção
  }
}

export class SupabaseSiteKnowledgeBaseRepository implements ISiteKnowledgeBaseRepository {
  // Implementar métodos de KB específicos de site
}
```

#### RAG Service Estendido

```typescript
export class RagService implements IRagService {
  async searchForSite(
    query: string, 
    siteId: string, 
    orgId: string, 
    limit: number = 8
  ): Promise<KnowledgeBaseMatch[]> {
    const embedding = await this.generateEmbedding(query)
    
    // Buscar no contexto específico do site PRIMEIRO
    const siteMatches = await this.knowledgeBaseRepo.searchSimilar(
      embedding, 
      siteId: siteId,
      limit: limit
    )
    
    return siteMatches
  }
  
  async generateSectionSuggestions(
    siteId: string,
    sectionType: string,
    brief: string
  ): Promise<SiteSection> {
    // 1. Buscar conhecimento do site
    const context = await this.searchForSite(brief, siteId, DEFAULT_ORG_ID)
    const contextForLLM = this.formatContextForLLM(context)
    
    // 2. Gerar com IA usando contexto
    const prompt = `
      Gere uma seção de tipo "${sectionType}" para um site.
      Briefing: ${brief}
      
      ${contextForLLM}
      
      Retorne em JSON com a estrutura específica do tipo.
    `
    
    const { object } = await generateObject({
      model: this.model,
      schema: SECTION_SCHEMAS[sectionType],
      prompt,
    })
    
    return {
      id: generateId(),
      type: sectionType,
      content: object,
      visible: true,
      order: 999, // Será reordenado depois
    }
  }
}
```

### 4. **Application Layer (Actions)**

```typescript
// actions/site-configuration.ts

'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'

export async function updateSiteGeneral(prevState: unknown, formData: FormData) {
  try {
    const { orgId } = await getAuthContext()
    const siteId = formData.get('siteId') as string
    
    const config = await useCases.updateSiteGeneral().execute(siteId, orgId, {
      name: formData.get('name') as string,
      primaryColor: formData.get('primaryColor') as string,
      logoUrl: formData.get('logoUrl') as string,
      theme: formData.get('theme') as 'light' | 'dark',
    })
    
    revalidatePath(`/sites/${siteId}/settings`)
    return { success: true, config }
  } catch (error) {
    return { error: getErrorMessage(error), success: false }
  }
}

export async function generateSectionWithAI(siteId: string, sectionType: string, brief: string) {
  try {
    const { orgId } = await getAuthContext()
    
    const section = await useCases.generateSiteSection().execute(
      siteId, 
      orgId, 
      sectionType, 
      brief
    )
    
    return { success: true, section }
  } catch (error) {
    return { error: getErrorMessage(error), success: false }
  }
}
```

---

## 🎨 UI Layer - Componentes

### Rotas de Configuração

```
/sites/[id]/
├── page.tsx                           # Visão geral do site
├── settings/
│   ├── page.tsx                       # Redirecionador
│   ├── general/page.tsx               # Nome, logo, cores, tema
│   ├── sections/
│   │   ├── page.tsx                   # Listar/ordenar seções
│   │   └── [sectionId]/page.tsx       # Editar seção específica
│   ├── modules/
│   │   ├── page.tsx                   # Seletor de módulos
│   │   ├── chatbot/page.tsx           # Config de chatbot
│   │   ├── analytics/page.tsx         # Config de analytics
│   │   ├── seo/page.tsx               # Config de SEO
│   │   └── integrations/page.tsx      # Config de integrações
│   └── knowledge-base/
│       └── page.tsx                   # Gerenciar KB do site
├── publish/page.tsx                   # Preview + Publicar
└── analytics/page.tsx                 # Métricas do site
```

### Componentes Dinâmicos

```typescript
// components/site-builder/SectionEditor.tsx
export function SectionEditor({ section, onUpdate }: Props) {
  // Renderiza editor específico para cada tipo de seção
  const Component = SECTION_EDITORS[section.type]
  return <Component section={section} onChange={onUpdate} />
}

// components/site-builder/SectionTypeSelector.tsx
export function SectionTypeSelector({ onSelect }: Props) {
  // Lista de tipos disponíveis com preview
  return <SelectableGrid items={SECTION_TYPES} onChange={onSelect} />
}

// components/site-builder/AISuggestions.tsx
export function AISuggestions({ siteId, onApply }: Props) {
  // Painel com sugestões de IA
  // - "Que tipo de seção adicionar?"
  // - "Sugerir cores baseado na marca"
  // - "Gerar conteúdo de contato"
}

// components/site-config/ModuleToggle.tsx
export function ModuleToggle({ module, enabled, onToggle }: Props) {
  // Toggle para habilitar/desabilitar módulos
}

// components/site-config/IntegrationSetup.tsx
export function IntegrationSetup({ integration, onSetup }: Props) {
  // Formulário para configurar integrações
}
```

---

## 📊 Fluxo de Uso

### Cenário 1: Criar e Configurar Site

```
1. Usuário clica "Criar Site"
2. Form: Nome do site
3. Redireciona para /sites/[id]/settings/general
4. Usuário configura:
   - Logo, cores, tema
   - Módulos (chatbot, analytics, etc)
5. Clica "Adicionar Seção"
6. Escolhe tipo (hero, features, contact, etc)
7. Sistema sugere conteúdo via IA + RAG
8. Usuário ajusta conforme necessário
9. Publica site
```

### Cenário 2: Usar RAG para Sugestões

```
1. Usuário adiciona "Conhecimento da Empresa" na KB
   - Missão, valores, produtos, diferencial
2. Ao gerar seções, IA busca contexto do site
3. Suggestions são contextualizadas:
   - "Features" com base nos produtos
   - "Testimonials" com voice & tone correto
   - "CTA" alignado com objetivos
```

### Cenário 3: Gerenciar Módulos

```
1. Usuário ativa "Chatbot"
2. Form aparece com opções:
   - Nome do assistente
   - Welcome message
   - System prompt
   - Modo learning (usar KB do site)
3. Após salvar, chatbot fica disponível no site published
```

---

## 🔄 Integração com Sistemas Existentes

### Knowledge Base
- Sites compartilham KB global (org) OU
- Sites têm KB específica (mais contextualizado)
- RAG busca em ambas com prioridade para KB local

### Landing Pages
- Site = Container principal
- Landing Pages = Página específica do site
- Cada LP pode ter chatbot próprio (ou herdar do site)

### Custom Domains
- Site → pode ter múltiplos custom domains
- Rota: /sites/[id]/settings/domains

### Integrations
- Whatsapp, Email, Slack
- Vinculadas ao site para automatizações

---

## 📋 Checklist de Implementação

- [ ] 1. Expandir tabela `sites` com config_json
- [ ] 2. Criar tabela `site_knowledge_base`
- [ ] 3. Criar entidades (`SiteConfig`, `SiteSection`)
- [ ] 4. Expandir interfaces de repositório
- [ ] 5. Implementar repositories
- [ ] 6. Criar use cases de configuração
- [ ] 7. Criar use cases de geração com IA
- [ ] 8. Registrar no container
- [ ] 9. Criar server actions
- [ ] 10. Criar componentes de UI
- [ ] 11. Criar rotas `/sites/[id]/settings/*`
- [ ] 12. Integrar RAG service
- [ ] 13. Testar fluxo completo
- [ ] 14. Documentar para usuários

---

## 🚀 Próximas Fases (Prioridade)

**Fase 1 (ATUAL):** Estrutura base com config_json
**Fase 2:** UI dinâmica para seções
**Fase 3:** RAG + IA para sugestões
**Fase 4:** Módulos avançados (analytics, integrações)
**Fase 5:** Publishing + preview
