# Auditoria técnica enterprise — ConvertAI

Data: 2026-05-06  
Escopo: Next.js App Router, React, TypeScript, Supabase, APIs públicas, camada de aplicação/domínio/infraestrutura e DX.

## Sumário executivo

A codebase já iniciou uma migração para Clean Architecture com `domain`, `application` e `infrastructure`, mas ainda carrega padrões típicos de desenvolvimento assistido por IA/Copilot: abstrações incompletas, arquivos órfãos, tipagem enfraquecida, uso amplo de service role em repositórios, validação inconsistente em APIs públicas e drift entre dependências modernas e código gerado para versões anteriores.

As correções aplicadas nesta etapa focam riscos críticos sem alterar UI: recuperação do type-check, hardening do cliente Supabase administrativo, compatibilidade com AI SDK atual e rate limiting nas APIs públicas de chat/analytics.

## Problemas por criticidade

### Crítico

1. **Type-check quebrado por configuração inválida do TypeScript**
   - Impacto: `tsc --noEmit` falhava antes de analisar a aplicação, bloqueando CI/CD, refatorações seguras e detecção de regressões.
   - Solução aplicada: ajustar `ignoreDeprecations` para um valor aceito pelo TypeScript instalado.

2. **Uso de `maxTokens` incompatível com AI SDK atual**
   - Impacto: rotas de geração por IA e Server Actions não passavam na tipagem, indicando drift de API e risco de falha em runtime após upgrades.
   - Solução aplicada: migrar chamadas para `maxOutputTokens`, API compatível com a versão instalada.

3. **Cliente Supabase com service role sem barreira server-only explícita**
   - Impacto: uma importação acidental a partir de Client Components poderia expor fluxo administrativo no bundle ou mascarar falhas de segurança.
   - Solução aplicada: marcar o módulo como `server-only`, validar variáveis obrigatórias e desabilitar persistência/refresh de sessão no client administrativo.

4. **APIs públicas de chat e analytics sem throttling local**
   - Impacto: risco de abuso financeiro em chamadas de IA, spam de eventos, exaustão de banco e degradação da experiência.
   - Solução aplicada: adicionar rate limit incremental por IP, visitante e landing page, com headers `x-ratelimit-*` e status `429`.

### Alto

1. **Service role usado como padrão nos repositórios**
   - Impacto: bypass de RLS fica distribuído e depende exclusivamente de checagens na aplicação. Um use case mal composto pode vazar dados entre organizações.
   - Melhor solução: criar dois data sources explícitos: `TenantSupabaseDataSource` com usuário/RLS para operações autenticadas e `AdminSupabaseDataSource` apenas para webhooks, jobs e operações privilegiadas auditadas.

2. **Proxy/middleware consulta Supabase administrativo para domínios customizados**
   - Impacto: acopla roteamento de borda a credenciais administrativas e a joins sensíveis ao schema.
   - Melhor solução: materializar uma tabela/cache KV de roteamento de domínios, sem service role no proxy, com invalidação em publish/update de domínio.

3. **Preview público por `?preview=1` sem token assinado**
   - Impacto: drafts podem ser descobertos se o slug vazar.
   - Melhor solução: usar token curto assinado por HMAC, validado em Server Component/Route Handler, ou preview mode via cookies seguros.

4. **TypeScript ainda revela dezenas de inconsistências após desbloqueio do type-check**
   - Impacto: contratos de domínio, testes, Supabase generated types e telas divergem entre si.
   - Melhor solução: migrar por fatias, começando por Settings/Sites e repositories de Subscription, bloqueando novos erros no CI.

### Médio

1. **Arquivos órfãos e nomes `page.tsx` fora de `app`**
   - Impacto: ruído cognitivo e risco de importações incorretas.
   - Melhor solução: remover arquivos vazios e proibir por lint regra local.

2. **Dependências TanStack Query instaladas sem uso arquitetural**
   - Impacto: bundle/dependências e expectativa de cache client-side sem Provider ou query keys padronizadas.
   - Melhor solução: manter Server Components como default e introduzir TanStack Query apenas em ilhas interativas com query key factory por feature.

3. **Vários componentes client-side grandes**
   - Impacto: bundle maior e hidratação desnecessária.
   - Melhor solução: decompor em shells server-side + action buttons client-side, usando dynamic imports para editores pesados como TipTap.

4. **Imagens de landing pages usam `<img>` em pontos de LCP**
   - Impacto: otimização menor, lazy loading inconsistente e possível LCP pior.
   - Melhor solução: migrar imagens hero/galeria/testimonials para `next/image` com `sizes`, domínio remoto e fallback.

### Baixo

1. **Warnings de lint por imports/variáveis não usados**
   - Impacto: reduz sinal/ruído do lint.
   - Melhor solução: cleanup contínuo por feature para evitar PRs gigantes.

2. **Observabilidade parcial**
   - Impacto: requestId existe em APIs específicas, mas não há correlação full-stack uniforme.
   - Melhor solução: padronizar logger estruturado com requestId, orgId, route, duration e outcome.

## Migração arquitetural gradual recomendada

1. **Fase 1 — Segurança e contratos**
   - Consolidar validação Zod em todas as Route Handlers e Server Actions públicas.
   - Introduzir DTOs explícitos entre Supabase rows e entidades de domínio.
   - Separar clients admin/tenant de Supabase.

2. **Fase 2 — Feature-based architecture**
   - Mover módulos por bounded context: `features/contacts`, `features/campaigns`, `features/landing-pages`, mantendo `domain/application/infrastructure` compartilhados apenas quando houver reutilização real.
   - Criar query key factories e server action adapters por feature.

3. **Fase 3 — Performance e cache**
   - Definir política por rota: estática ISR para landing pages publicadas, dinâmica para dashboard autenticado, streaming para telas analíticas.
   - Usar `unstable_cache`/tags para leituras públicas e invalidar por publish/update.
   - Dynamic import para editores, modais pesados e SDKs de terceiros.

4. **Fase 4 — Enterprise readiness**
   - Feature flags para módulos beta.
   - Error boundaries por segmento do App Router.
   - Telemetria com OpenTelemetry, métricas de filas e budget de IA.
   - CI com `lint`, `tsc --noEmit`, testes unitários e build em PR.

## Refatorações aplicadas nesta etapa

- Corrigido valor inválido de `ignoreDeprecations` no `tsconfig`.
- Adicionado rate limiter reutilizável para APIs públicas.
- Chat público passou a validar payload com Zod e retornar 400 estruturado.
- Chat e analytics públicos passaram a responder 429 com headers padronizados quando excedidos.
- Cliente Supabase admin agora é server-only, valida ambiente e não persiste sessão.
- Chamadas AI SDK foram migradas de `maxTokens` para `maxOutputTokens`.
