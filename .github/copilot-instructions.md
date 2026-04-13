# GitHub Copilot Instructions — Convert AI (BHS Solutions)

Plataforma de CRM com IA para automação de marketing, geração de landing pages e engajamento multicanal.
Todo texto de UI, comentários de código e nomes de variáveis de negócio devem estar em **pt-BR**.

---

## Stack

- **Framework**: Next.js (App Router) com React Compiler ativado
- **Linguagem**: TypeScript strict
- **Estilização**: TailwindCSS 4 + shadcn/ui + CSS variables para theming
- **Banco**: Supabase (PostgreSQL) com `createAdminClient()` nos repositórios
- **IA**: Google Gemini via `@ai-sdk/google` (`gemini-2.5-flash` = padrão, `gemini-2.5-pro` = pro)
- **Comunicação**: Twilio (WhatsApp/SMS), Resend (email)
- **Ícones**: Lucide React exclusivamente

---

## Arquitetura em camadas (Clean Architecture)

```
domain/          → entidades, interfaces, value objects, errors (sem dependências externas)
infrastructure/  → repositórios Supabase, serviços externos (Twilio, Resend, RAG)
application/     → use cases + DI container (application/services/container.ts)
actions/         → Server Actions (camada RPC, ponte UI → use cases)
app/             → páginas e rotas Next.js (App Router)
components/      → componentes React reutilizáveis
lib/             → utilitários, configuração de SDKs externos
```

**Regra fundamental**: nunca importar infraestrutura diretamente nos componentes ou pages. Sempre usar `useCases.*` via Server Actions.

---

## Padrões obrigatórios

### 1. Server Actions (`actions/*.ts`)

```typescript
'use server'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { revalidatePath } from 'next/cache'

export async function minhaAction(prevState: unknown, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        // lógica...
        revalidatePath('/rota-afetada')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}
```

- Toda action **deve** chamar `getAuthContext()` primeiro (autenticação + org isolation)
- Retorno padrão: `{ success: boolean, error: string }` (useActionState compatível)
- `getErrorMessage(error)` de `@/actions/utils` para mensagens de erro normalizadas
- `revalidatePath()` após toda mutação que afete dados renderizados

### 2. Páginas server-component (`app/(dashboard)/*/page.tsx`)

```typescript
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'

export default async function MinhaPage() {
    const auth = await tryGetAuthContext()  // retorna null se não autenticado
    const dados = auth ? await useCases.listarAlgo().execute(auth.orgId) : []
    return <MeuClientComponent dados={dados} />
}
```

- Usar `tryGetAuthContext()` (nunca `getAuthContext()`) nas pages — retorna null ao invés de throw
- Toda query ao Supabase **deve** filtrar por `organization_id` (multi-tenant)
- Carregar dados no server component, passar para client component via props

### 3. Entidades de domínio (`domain/entities/*.ts`)

```typescript
interface MinhaEntityProps { id: string; organizationId: string; /* ... */ }

export class MinhaEntity {
    private constructor(private readonly props: MinhaEntityProps) {}
    static fromRow(row: DatabaseRow): MinhaEntity { return new MinhaEntity({ /* mapeamento */ }) }
    get id() { return this.props.id }
    isAtivo() { return this.props.status === 'active' }
}
```

- Construtor privado + `static fromRow()` para mapear linhas do banco
- Getters para todas as props
- Métodos de negócio no corpo da classe (`isDraft()`, `canSend()`, etc.)
- Sem dependências externas (sem imports de `@/infrastructure` ou `@/lib`)

### 4. Repositórios (`infrastructure/repositories/*.ts`)

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import type { IMinhaRepository } from '@/domain/interfaces'

export class SupabaseMinhaRepository implements IMinhaRepository {
    async findByOrgId(orgId: string): Promise<MinhaEntity[]> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('tabela')
            .select('id, organization_id, campo1, campo2')  // campos explícitos
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(MinhaEntity.fromRow)
    }
}
```

- Sempre `createAdminClient()` (nunca cliente do browser nos repositórios)
- Selects com campos explícitos, nunca `select('*')` em produção
- Filtro `organization_id` **obrigatório** em toda query

### 5. Use Cases (`application/use-cases/*/index.ts`)

```typescript
export class CriarAlgoUseCase {
    constructor(private readonly repo: IMinhaRepository) {}
    async execute(orgId: string, input: CriarAlgoInput): Promise<MinhaEntity> {
        // validação com Zod ou checagens manuais
        return this.repo.create({ ...input, organizationId: orgId })
    }
}
```

- Injetado via `application/services/container.ts` (DI manual)
- Adicionar ao objeto `useCases` no container após criar

---

## TailwindCSS 4 — diferenças importantes

| TW v3 (errado ✗) | TW v4 (correto ✓) |
|---|---|
| `rounded-md` para variável CSS | `rounded-(--radius)` |
| `bg-[var(--cor)]` | `bg-(--cor)` ou `bg-[hsl(var(--cor))]` |
| `text-[var(--cor)]` | `text-(--cor)` |

**CSS Variables do tema** (use sempre que disponíveis):
- Backgrounds: `bg-background`, `bg-card`, `bg-[hsl(var(--background-tertiary))]`
- Textos: `text-foreground`, `text-foreground-secondary`, `text-muted-foreground`
- Bordas: `border-border`
- Destaques: `text-primary`, `bg-primary`, `bg-primary/10`
- Estados: `text-destructive`, `text-[hsl(var(--success))]`

---

## Contrastes dinâmicos

Ao usar `backgroundColor` dinâmico baseado em cor primária do usuário (`primaryColor`), calcular texto com:

```typescript
import { getContrastTextColor } from '@/lib/utils'
// retorna '#ffffff' ou '#1a1a2e' com base em luminância WCAG
style={{ color: getContrastTextColor(primaryColor) }}
```

Nunca usar `text-white` hardcoded em elementos com fundo dinâmico.

---

## Componentes UI — convenções

### Labels de formulário
```tsx
<Label className="text-foreground-secondary text-xs uppercase tracking-wider">Campo</Label>
```

### Inputs / Textareas
```tsx
<Input className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9" />
```

### Feedback de ações (dentro de forms com useActionState)
```tsx
import { InlineNotice } from '@/components/ui/inline-notice'
{state.success && <InlineNotice variant="success" message="Salvo com sucesso." className="mb-4" size="sm" />}
{state.error && <InlineNotice variant="destructive" message={state.error} className="mb-4" size="sm" />}
```

### PageHeader (toda page do dashboard)
```tsx
import { PageHeader } from '@/components/layout/PageHeader'
<PageHeader category="Módulo" title="Título da Página" icon={LucideIcon} />
```

### Botões de ação principal
```tsx
<Button className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2">
    <Icon className="w-4 h-4" /> Ação
</Button>
```

---

## Estrutura de rotas (`app/`)

| Grupo | Propósito |
|---|---|
| `(auth)/` | Login, registro, forgot-password (sem sidebar) |
| `(dashboard)/` | Aplicação principal (com sidebar, auth obrigatória) |
| `(public)/p/[slug]` | Landing pages públicas (sem auth) |
| `(superadmin)/admin/` | Painel super admin (flag `isSuperAdmin`) |
| `api/` | API routes (webhooks, AI streaming, etc.) |

---

## Adicionando um novo módulo

Siga **exatamente** esta ordem:

1. **DB**: Migration em `supabase/migrations/` com FK `organization_id`
2. **Types**: Atualizar `types/database.ts`
3. **Entity**: `domain/entities/nome.ts` com `fromRow()` e métodos de negócio
4. **Interface**: `domain/interfaces/nome-repository.ts`
5. **Repository**: `infrastructure/repositories/nome-repository.ts` (implementa interface)
6. **Export**: Adicionar ao barrel de repositórios (`infrastructure/repositories/index.ts`)
7. **Use Cases**: `application/use-cases/nome/index.ts`
8. **Container**: Registrar repo e use cases em `application/services/container.ts`
9. **Actions**: `actions/nome.ts` com `'use server'`
10. **Page**: `app/(dashboard)/nome/page.tsx` (server) + componentes client
11. **Sidebar**: Adicionar nav item em `components/layout/Sidebar.tsx` com ícone Lucide

---

## Segurança (OWASP)

- **Toda** server action chama `getAuthContext()` antes de qualquer operação
- **Todo** repositório filtra por `organization_id` — sem exceções
- Dados de formulário validados antes de persistir (Zod ou checagens manuais)
- Webhooks externos (Twilio) com verificação de assinatura obrigatória
- Segredos apenas em variáveis de ambiente, nunca em código

---

## Personalização de conteúdo (campanhas)

Variáveis suportadas: `{{nome}}`, `{{email}}`, `{{telefone}}`
Substituídas na camada de use case antes do envio, nunca no frontend.

---

## RAG / Base de Conhecimento

- Tabela `knowledge_base` com embedding (pgvector)
- Indexar via `ragService.indexContent()` (injeta embedding do Gemini)
- Busca semântica via RPC `match_knowledge_base` no Supabase
- Entradas podem ser globais (org) ou vinculadas a uma landing page (`landing_page_id`)
- `metadata_json` armazena `source`, `entryType`, `tags`, `imageUrl`
- Após toda mutação na KB, chamar `revalidatePath('/knowledge-base')`

---

## API Routes (`app/api/*/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/infrastructure/auth'

export async function POST(req: NextRequest) {
    try {
        const { orgId } = await getAuthContext()
        const body = await req.json()
        // lógica...
        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
```

- `getAuthContext()` obrigatório antes de qualquer lógica
- Validar body com Zod antes de usar os dados
- Para streaming de IA usar `streamText` do `ai` SDK com `result.toDataStreamResponse()`
- Webhooks externos (Twilio, Meta) verificam assinatura **antes** de processar — nunca usar `getAuthContext()` em webhooks públicos
- Rotas públicas (ex: `/api/landing-pages/lead`) validam `orgId` pelo slug/id da entidade, não via sessão

---

## Client Components

- Adicionar `'use client'` **apenas** quando necessário: event handlers, hooks, estado interativo
- Preferir `useActionState` (React 19) para formulários com server actions — não usar `useState` + `fetch` manual
- Estado local de UI (ex: tab ativa, modal aberto): `useState`
- Estado global de aplicação ou cache: `Zustand` ou `useQuery` (TanStack Query)
- Nunca buscar dados no client component via `fetch` se pode ser prop do server component pai
- Com React Compiler ativo, **não** usar `useMemo`/`useCallback` preventivamente — só onde há evidência de custo real

```typescript
// ✓ Correto — useActionState para form
const [state, action, pending] = useActionState(minhaAction, { error: '', success: false })

// ✗ Evitar — fetch manual em client component
const [data, setData] = useState(null)
useEffect(() => { fetch('/api/...').then(...) }, [])
```

---

## TypeScript strict

- Proibido `any` explícito — usar `unknown` e narrowing, ou `// eslint-disable-next-line @typescript-eslint/no-explicit-any` com comentário justificando
- Type assertions (`as`) apenas quando inevitável (ex: cast de resposta DB não tipada); adicionar comentário explicando
- Funções exportadas devem ter tipo de retorno explícito
- Evitar `!` (non-null assertion) — preferir optional chaining `?.` e `?? fallback`
- Props de componentes: interface nomeada (não inline), sem `React.FC`

```typescript
// ✓
interface Props { name: string; count: number }
export function MeuComponente({ name, count }: Props) { ... }

// ✗
export const MeuComponente: React.FC<{ name: string; count: number }> = ({ name, count }) => { ... }
```

---

## Nomenclatura e organização de arquivos

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componente React | `PascalCase.tsx` | `CreateCampaignButton.tsx` |
| Page / Layout | `page.tsx` / `layout.tsx` | (padrão Next.js) |
| Use Case / Repository | `kebab-case.ts` | `send-campaign.ts` |
| Server Action | `kebab-case.ts` em `actions/` | `actions/campaigns.ts` |
| Migration Supabase | `NNN_descricao_curta.sql` | `013_products.sql` |
| Hook customizado | `camelCase` prefixado com `use` | `useGenerateSections.ts` |
| Tipo/Interface de domínio | `PascalCase` | `CampaignStatus`, `AuthenticatedContext` |

---

## Imports

- Sempre usar caminhos absolutos via `@/` — nunca `../../` que sobe mais de um nível
- Ordem: externos → internos `@/` → tipos
- Nunca importar infraestrutura em componentes ou páginas — apenas via server actions ou use cases

```typescript
// ✓
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'

// ✗
import { useCases } from '../../../application/services/container'
import { createAdminClient } from '@/lib/supabase/admin' // em um componente
```

---

## Tratamento de erros — `error.tsx`

Toda rota do dashboard com potencial de erro deve ter `error.tsx` adjacente:

```typescript
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => { console.error(error) }, [error])
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <p className="text-foreground font-bold">Algo deu errado</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
            <Button onClick={reset} variant="outline" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                Tentar novamente
            </Button>
        </div>
    )
}
```

- `reset()` tenta re-renderizar o segmento sem recarregar a página
- Não expor stack traces para o usuário — apenas `error.message`
- `error.tsx` já existe em `app/(dashboard)/error.tsx` como fallback global do dashboard
