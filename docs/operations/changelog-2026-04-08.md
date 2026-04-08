# Changelog - 2026-04-08

## Resumo

Consolidação de duas frentes principais:

1. Hardening de API (observabilidade, request id, validação de payload e erros seguros).
2. Padronização de feedback visual no frontend (erro, aviso, sucesso e confirmações destrutivas).

## API Hardening

### Entregas

1. Logger compartilhado por rota com escopo e correlação por request id.
2. Header de correlação padronizado (`x-request-id`, mantendo `x-chat-request-id` no chat stream).
3. Erros 4xx/5xx mais consistentes e sem vazamento de detalhes internos.
4. Validação de payload com Zod nas rotas críticas de entrada.
5. Checklist de cobertura por rota criado e documentado.

### Artefatos

1. docs/operations/sprint-1-api-hardening-checklist.md
2. lib/api-observability.ts

## Frontend UX/Feedback

### Entregas

1. Erros de IA padronizados com referência de request id no cliente.
2. Tratamento de erro consistente em fluxos CRM e Instagram (stream e JSON).
3. Componente único para erro inline.
4. Componente único para avisos/sucesso/info/destrutivo inline.
5. Header único para modais de confirmação destrutiva.
6. Substituição de blocos visuais duplicados por componentes reutilizáveis.

### Artefatos

1. lib/client-api-error.ts
2. components/ui/inline-error.tsx
3. components/ui/inline-notice.tsx
4. components/ui/danger-confirmation-header.tsx
5. docs/operations/ui-feedback-guidelines.md

## Documentação

1. README atualizado com links para padrões operacionais.
2. Checklist de hardening com referência cruzada para guideline de UI.

## Impacto

1. Diagnóstico de incidentes mais rápido via request id.
2. Menor inconsistência de tratamento de erro entre rotas e telas.
3. Redução de markup repetido de feedback visual.
4. Menor custo de manutenção para novos fluxos.

## Compatibilidade

1. Sem breaking changes de contrato funcional planejado para usuários finais.
2. Mantida compatibilidade do chat com `x-chat-request-id`.

## Governança de IA (Fase 1)

### Entregas

1. Estrutura de banco para políticas de quota e trilha de auditoria de uso de IA por organização.
2. Novo utilitário backend para enforcement de limites e registro de consumo/custo estimado.
3. Bloqueio automático com respostas consistentes para limite diário (429) e orçamento mensal (402).
4. Integração inicial nas rotas críticas de IA (campaigns, landing pages, products e Instagram).

### Artefatos

1. supabase/migrations/015_ai_governance.sql
2. lib/ai-governance.ts
3. app/api/campaigns/generate/route.ts
4. app/api/landing-pages/generate/route.ts
5. app/api/products/generate/route.ts
6. app/api/instagram/generate-image/route.ts
7. app/api/instagram/generate-caption/route.ts
8. app/api/instagram/generate-image-prompt/route.ts
9. app/api/instagram/generate-calendar/route.ts
10. app/api/instagram/generate-auto-content/route.ts

## Governança de IA (Fase 1.1)

### Entregas

1. Nova aba "Governança IA" em Configurações com indicadores de uso diário e orçamento mensal.
2. Formulário para atualização de política por organização (limite diário, orçamento mensal, hard block).
3. Tratamento de ambiente sem migration aplicada com aviso claro na interface.

### Artefatos

1. app/(dashboard)/settings/page.tsx
2. app/(dashboard)/settings/settings-tabs.tsx
3. actions/organization.ts

## Governança de IA (Fase 1.2)

### Entregas

1. Histórico detalhado de eventos de IA na aba de governança, com dados de feature, modelo, rota, status, custo e duração.
2. Filtros client-side por período, status, feature e busca por modelo/rota.
3. Cards de resumo do recorte filtrado (custo estimado, sucessos e bloqueios).

### Artefatos

1. app/(dashboard)/settings/page.tsx
2. app/(dashboard)/settings/settings-tabs.tsx

## Governança de IA (Fase 1.3)

### Entregas

1. Deduplicação de eventos de uso por organização/request/rota/status para reduzir duplicidade em retries.
2. Registro de eventos ajustado para upsert com base na chave de dedupe.
3. Função SQL de retenção para purge de eventos antigos (padrão 90 dias).

### Artefatos

1. supabase/migrations/015_ai_governance.sql
2. lib/ai-governance.ts

## Governança de IA (Fase 1.4)

### Entregas

1. Ação server para limpeza de eventos antigos de IA por organização com retenção configurável em dias.
2. Botão na aba de governança para executar purge diretamente pela interface.
3. Feedback imediato na UI com quantidade de eventos removidos.

### Artefatos

1. actions/organization.ts
2. app/(dashboard)/settings/settings-tabs.tsx

## Governança de IA (Fase 1.5)

### Entregas

1. Função SQL de purge reforçada para escopo explícito por organização (evita limpeza global).
2. Action de limpeza migrada para RPC dessa função, centralizando regra de retenção no banco.

### Artefatos

1. supabase/migrations/015_ai_governance.sql
2. actions/organization.ts

## Governança de IA (Fase 1.6)

### Entregas

1. Migration 015 tornada mais idempotente com drop policy if exists antes de recriar policies de RLS.
2. Action de purge com fallback automático para delete direto por organização quando RPC ainda não estiver disponível.
3. Compatibilidade melhorada para ambientes em estado intermediário de migração.

### Artefatos

1. supabase/migrations/015_ai_governance.sql
2. actions/organization.ts

## Governança de IA (Fase 1.7)

### Entregas

1. Função SQL de purge com validação de parâmetros (organization_id obrigatório).
2. Janela de retenção limitada no banco entre 1 e 3650 dias para prevenir valores extremos.

### Artefatos

1. supabase/migrations/015_ai_governance.sql

## Validação

1. Verificação de problemas/typing nos arquivos alterados concluída sem erros.
