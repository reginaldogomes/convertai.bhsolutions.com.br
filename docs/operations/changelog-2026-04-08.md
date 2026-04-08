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

## RAG + SEO (Fase 1)

### Entregas

1. Busca RAG com filtros opcionais de nicho, publico-alvo, marca e palavras-chave de intencao.
2. Reranking de matches por metadata para priorizar contexto mais alinhado ao negocio.
3. Geração de landing pages com diretrizes SEO adicionais no prompt (topico, audiencia e keywords).
4. Checklist operacional de indexacao para rotina de melhoria continua.

### Artefatos

1. domain/interfaces/knowledge-base-repository.ts
2. domain/interfaces/rag-service.ts
3. infrastructure/repositories/knowledge-base-repository.ts
4. infrastructure/services/rag-service.ts
5. app/api/landing-pages/generate/route.ts
6. actions/landing-pages.ts
7. lib/landing-page-generation.ts
8. docs/operations/rag-seo-indexation-checklist.md
9. README.md

## RAG + SEO (Fase 2)

### Entregas

1. Geração automática de metadados SEO com contexto RAG filtrado por marca, nicho, publico e palavras-chave de intencao.
2. Enriquecimento do prompt de SEO com contexto estruturado das seções da landing e matches relevantes da base de conhecimento.
3. Melhor alinhamento entre copy orgânica e contexto real da empresa para aumentar potencial de indexacao e CTR.

### Artefatos

1. app/api/landing-pages/seo/generate/route.ts

## RAG + SEO (Fase 3)

### Entregas

1. Editor de landing com foco opcional por nicho e cidade/regiao para regeneracao de SEO com IA.
2. API de SEO ajustada para incorporar esses focos no filtro RAG e no prompt final.

### Artefatos

1. app/(dashboard)/landing-pages/[id]/landing-page-editor.tsx
2. app/api/landing-pages/seo/generate/route.ts

## Analytics SEO (Fase 1)

### Entregas

1. Novo painel no dashboard para acompanhar SEO e conversão por landing page nos últimos 30 dias.
2. Métricas por página: impressões (views), cliques em CTA, leads, CTR e taxa de conversão.
3. Navegação adicionada no sidebar e atalho no dashboard para acesso rápido.

### Artefatos

1. app/(dashboard)/analytics/page.tsx
2. components/layout/Sidebar.tsx
3. app/(dashboard)/page.tsx

## Analytics SEO (Fase 1.1)

### Entregas

1. Filtro de período por query param na página de analytics (7d, 30d, 90d).
2. Cards e tabela recalculados conforme intervalo selecionado.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.2)

### Entregas

1. Ordenação por coluna na tabela de analytics (pagina, status, impressoes, cliques, leads, CTR e conversao).
2. Direção asc/desc por coluna via query params, mantendo filtro de período.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.3)

### Entregas

1. Paginacao da tabela de analytics com navegação por query param (`page`).
2. Controles de pagina mantendo filtro de periodo e ordenacao atual.
3. Resumo de faixa visivel (itens exibidos x total) para facilitar leitura em bases maiores.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.4)

### Entregas

1. Seletor de tamanho de pagina na tabela (10, 25, 50) via query param (`pageSize`).
2. Navegacao e ordenacao preservando estado completo de filtros e pagina (`period`, `sort`, `dir`, `pageSize`).

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.5)

### Entregas

1. Busca por nome/slug da landing no painel analytics via query param (`q`).
2. Filtro aplicado no servidor para reduzir ruido em tabelas extensas.
3. Preservacao do estado completo (`period`, `sort`, `dir`, `page`, `pageSize`, `q`) em todos os links de navegacao.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.6)

### Entregas

1. Filtro por status da landing (todos, publicadas, rascunhos) no painel analytics.
2. Filtro integrado a URL (`status`) com preservacao completa do estado em periodo, ordenacao, pagina e busca.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.7)

### Entregas

1. Exportacao CSV da visao atual do analytics, respeitando filtros ativos de periodo, status, busca e ordenacao.
2. Nova rota de API para gerar CSV com request id e headers de download.

### Artefatos

1. app/(dashboard)/analytics/page.tsx
2. app/api/analytics/export/route.ts

## Analytics SEO (Fase 1.8)

### Entregas

1. Exportacao CSV com escopo selecionavel: visao completa ou apenas pagina atual da tabela (`scope=all|current`).
2. Inclusao de colunas de rastreabilidade de periodo no CSV (`period_key`, `period_days`, `period_start_utc`, `period_end_utc`, `exported_at_utc`).
3. Links de exportacao mantendo estado ativo de filtros (`period`, `sort`, `dir`, `status`, `q`, `page`, `pageSize`).

### Artefatos

1. app/(dashboard)/analytics/page.tsx
2. app/api/analytics/export/route.ts

## Analytics SEO (Fase 1.9)

### Entregas

1. Presets de exportacao CSV adicionados na rota de analytics: `executive`, `seo` e `conversion`.
2. Cada preset exporta colunas focadas no objetivo do relatorio, mantendo contexto de periodo e auditoria.
3. Novos atalhos na tela de analytics para baixar rapidamente CSV SEO e CSV Conversao.

### Artefatos

1. app/(dashboard)/analytics/page.tsx
2. app/api/analytics/export/route.ts

## Analytics SEO (Fase 1.10)

### Entregas

1. UX de exportacao simplificada com seletor unico de preset (`Executivo`, `SEO`, `Conversao`).
2. Dois botoes de acao no mesmo bloco de export: `Exportar Tudo` e `Exportar Pagina`.
3. Preservacao de todos os filtros ativos no envio do formulario de exportacao.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.11)

### Entregas

1. Preset de exportacao persistido na URL do analytics via query param (`preset`).
2. Navegacao de periodo, ordenacao, busca e paginacao preservando o preset ativo.
3. Formulario de exportacao inicializando automaticamente com o preset atual da URL.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.12)

### Entregas

1. Badge visual no cabecalho do analytics indicando o preset de exportacao ativo.
2. Leitura de contexto mais rapida para evitar exportacao com preset errado.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Analytics SEO (Fase 1.13)

### Entregas

1. Badge de preset com cor contextual por tipo de relatorio (SEO em azul, Conversao em verde, Executivo neutro).
2. Identificacao visual mais rapida do contexto ativo antes da exportacao.

### Artefatos

1. app/(dashboard)/analytics/page.tsx

## Base de Conhecimento (Fase 1)

### Entregas

1. Nova aba em Configuracoes para alimentar a base de conhecimento organizacional com contexto estrategico.
2. Formulario dedicado para empresa, nicho, publico-alvo, cultura, tom de voz, ofertas, diferenciais e objeções.
3. Persistencia via server action com indexacao para RAG e lista de entradas organizacionais recentes.

### Artefatos

1. actions/organization.ts
2. app/(dashboard)/settings/page.tsx
3. app/(dashboard)/settings/settings-tabs.tsx

## Base de Conhecimento (Fase 1.1)

### Entregas

1. Edicao de entradas organizacionais da base de conhecimento diretamente na aba de configuracoes.
2. Remocao de entradas com validacao de escopo por organizacao no backend.
3. Lista recente expandivel com formulario inline para manutencao rapida de conteudo RAG.

### Artefatos

1. actions/organization.ts
2. app/(dashboard)/settings/page.tsx
3. app/(dashboard)/settings/settings-tabs.tsx

## Base de Conhecimento (Fase 1.2)

### Entregas

1. Suporte a tags estrategicas por entrada da base de conhecimento (cadastro e edicao).
2. Exibicao de tags nas entradas recentes para facilitar manutencao do contexto empresarial.
3. Reindexacao automatica de embeddings ao editar entrada, atualizando o RAG sem etapa manual.

### Artefatos

1. actions/organization.ts
2. app/(dashboard)/settings/page.tsx
3. app/(dashboard)/settings/settings-tabs.tsx

## Base de Conhecimento (Fase 1.3)

### Entregas

1. Filtro por tags na lista de entradas da aba de base de conhecimento para facilitar curadoria.
2. Reranking do RAG com peso explicito para tags em metadata (nicho, publico, marca, local e keywords).
3. Priorizacao mais consistente de contexto empresarial aderente em buscas semanticas.

### Artefatos

1. app/(dashboard)/settings/settings-tabs.tsx
2. infrastructure/repositories/knowledge-base-repository.ts

## Base de Conhecimento (Fase 1.4)

### Entregas

1. Filtro multi-tag na lista de entradas da base, permitindo combinar mais de uma tag simultaneamente.
2. Exibicao de contagem por tag para facilitar priorizacao de curadoria.
3. Acao rapida para limpar filtros ativos de tags.

### Artefatos

1. app/(dashboard)/settings/settings-tabs.tsx

## Base de Conhecimento (Fase 1.5)

### Entregas

1. Persistencia do filtro de tags da base de conhecimento na URL via query param (`kbTags`).
2. Hidratação automática do estado da tela a partir da URL para compartilhamento de contexto com o time.
3. Atualizacao da URL sem reload completo ao adicionar/remover tags do filtro.

### Artefatos

1. app/(dashboard)/settings/settings-tabs.tsx

## Validação

1. Verificação de problemas/typing nos arquivos alterados concluída sem erros.
