# Análise técnica da funcionalidade de Sites (2026-04-19)

## Escopo avaliado

- Navegação e rotas de Sites no dashboard.
- Fluxo de criação de site.
- Integração de domínios personalizados.
- Consistência entre código, migrations e estrutura de pastas.

## Problemas identificados

1. **Rota `/sites` inexistente no `app/`**
   - O menu lateral já apontava para `/sites`, mas não havia página em `app/(dashboard)/sites/page.tsx`.
   - Impacto: clique em “Sites” resultava em erro 404 e bloqueava o uso da funcionalidade.

2. **Página de listagem de Sites salva no diretório errado**
   - A implementação estava em `types/page.tsx`, fora do App Router.
   - Impacto: código aparentemente pronto, mas nunca servido como rota pública do dashboard.

3. **Fluxo de criação quebrado por ausência de página/formulário**
   - Havia action (`actions/sites.ts`) e links para `/sites/create`, porém sem tela correspondente e com arquivos vazios (`components/layout/site-create-form.tsx`).
   - Impacto: usuário não conseguia criar site via UI, apesar da regra de negócio existir no backend.

4. **Sinal de desvio arquitetural entre “Sites” e “Landing Pages”**
   - Parte da base usa `target_page_id` em domínios personalizados, enquanto migration de feature aponta direção para vínculo com `site_id`.
   - Impacto: risco de inconsistência de dados, bugs de associação e dificuldade para evoluir o produto sem regressão.

## Correções aplicadas nesta entrega

1. **Criação da rota de listagem de Sites**
   - Implementada `app/(dashboard)/sites/page.tsx` com carregamento dinâmico e listagem por organização.

2. **Criação da rota de criação de Sites**
   - Implementada `app/(dashboard)/sites/create/page.tsx`.

3. **Implementação do formulário de criação**
   - Implementado `components/layout/site-create-form.tsx` com `useActionState` conectado à server action `createSite`.

4. **Remoção do arquivo em local incorreto**
   - Removido `types/page.tsx` para eliminar ambiguidade e evitar manutenção em rota “fantasma”.

## Recomendações para próxima etapa (sem quebrar produção)

1. **Plano de migração controlada para `custom_domains.site_id`**
   - Criar migration incremental: backfill de `site_id` com lógica explícita de fallback.
   - Manter compatibilidade temporária com `target_page_id` por uma janela curta.
   - Só remover `target_page_id` após validação de integridade e telemetria.

2. **Hardening da verificação DNS**
   - Evitar dependência de `dns/promises` no runtime edge (se usado futuramente).
   - Persistir última tentativa de validação com timestamp e código de erro normalizado para suporte.

3. **Observabilidade do funil de Sites**
   - Métricas mínimas: `sites_page_viewed`, `site_create_started`, `site_create_succeeded`, `site_create_failed`.
   - Incluir `x-request-id` na trilha para troubleshooting.

4. **Testes de regressão de rota e fluxo crítico**
   - Teste de navegação: sidebar → `/sites`.
   - Teste de criação: `/sites/create` → submit válido → redirect para `/sites`.
   - Teste de erro de validação: nome curto/inválido.

5. **Convergência de nomenclatura de produto**
   - Definir claramente no produto: “Site” (entidade principal) vs “Landing Page” (página dentro do site).
   - Atualizar labels de UI e schema para reduzir ambiguidade operacional.
