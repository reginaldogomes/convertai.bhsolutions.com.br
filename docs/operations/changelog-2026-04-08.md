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

## Validação

1. Verificação de problemas/typing nos arquivos alterados concluída sem erros.
