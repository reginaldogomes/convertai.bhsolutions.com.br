This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# convertai.bhsolutions.com.br

## Operacoes E Padroes Internos

- API hardening checklist: `docs/operations/sprint-1-api-hardening-checklist.md`
- UI feedback guidelines: `docs/operations/ui-feedback-guidelines.md`
- Changelog (hardening + UX): `docs/operations/changelog-2026-04-08.md`

## Chatbox Debug E Health

### Variaveis De Ambiente

- `NEXT_PUBLIC_CHAT_DEBUG=true`: habilita logs no console do navegador para o widget de chat.
- `CHAT_DEBUG=true`: habilita logs de servidor na rota `POST /api/chat/[pageId]`.
- `CHAT_HEALTH_SECRET=seu-segredo`: protege a rota de health do chat.

Quando `CHAT_HEALTH_SECRET` estiver definido, envie o segredo em um dos formatos abaixo:

- Header `x-chat-health-secret: <valor>`
- Header `Authorization: Bearer <valor>`

### Endpoint De Health

Rota: `GET /api/chat/health`

Resposta inclui:

- disponibilidade das tabelas de chat
- contagem de sessoes (`active`, `lead_captured`, `closed`, total)
- contagem total de mensagens
- throughput em 1 minuto e 5 minutos
- taxa de captura de lead

Para incluir detalhes de depuracao (ultimas sessoes e mensagens):

- `GET /api/chat/health?details=1`

### Exemplos De Uso

Sem segredo (ambiente local):

```bash
curl -s http://localhost:3000/api/chat/health | jq
```

Com segredo via header customizado:

```bash
curl -s \
	-H "x-chat-health-secret: $CHAT_HEALTH_SECRET" \
	http://localhost:3000/api/chat/health?details=1 | jq
```

Com segredo via bearer token:

```bash
curl -s \
	-H "Authorization: Bearer $CHAT_HEALTH_SECRET" \
	http://localhost:3000/api/chat/health | jq
```

### Correlacao De Requisicoes

A rota de chat retorna o header `x-chat-request-id` para correlacionar eventos do frontend com logs do backend.

Tambem retorna `x-chat-session-id` para manter continuidade da conversa no cliente.

### Request Id Padrao Nas APIs

Rotas criticas de geracao, webhooks e analytics retornam o header `x-request-id`.

Esse id tambem pode aparecer no corpo da resposta como `requestId` para facilitar depuracao no frontend.

Fluxo recomendado de suporte:

1. Capturar o valor de `x-request-id` no cliente (ou em tools como Postman/cURL).
2. Buscar esse id nos logs do servidor, no escopo da rota (`[api:<escopo>]`).
3. Correlacionar com o tempo de execucao (`elapsedMs`) e o evento de falha (`*_failed`).

Exemplo com cURL exibindo headers:

```bash
curl -i -X POST http://localhost:3000/api/analytics/track \
	-H 'Content-Type: application/json' \
	-d '{"landingPageId":"<id>","eventType":"view","visitorId":"<visitor>"}'
```

### Runbook De Incidentes (Chat)

Use este fluxo quando o chat parar de responder ou responder vazio.

1. Validar saude do backend de chat
- Execute `GET /api/chat/health`.
- Confirme `ok: true` e `tablesAvailable: true`.

2. Verificar throughput recente
- Execute `GET /api/chat/health?details=1`.
- Confirme se `last1m.userMessages` cresce ao testar o chat.
- Se `userMessages` cresce e `assistantMessages` nao cresce, o problema tende a estar na geracao/stream.

3. Correlacionar request de ponta a ponta
- No navegador, capture o `x-chat-request-id` da requisicao `POST /api/chat/[pageId]`.
- Busque esse id nos logs do servidor (`[chat-api]`).

4. Isolar camada com flags de debug
- Ative `NEXT_PUBLIC_CHAT_DEBUG=true` para logs do widget (`[chat-widget]`).
- Ative `CHAT_DEBUG=true` para logs da API (`[chat-api]`).
- Compare tempos (`elapsedMs`) e tamanho de resposta (`responseLength`).

5. Confirmar continuidade de sessao
- Verifique se o cliente esta recebendo `x-chat-session-id` em cada resposta.
- Se houver troca inesperada de sessao, valide `visitorId` e limpeza de `localStorage` no navegador.

Sinais comuns e acao sugerida:

- `request_failed` no widget sem log correspondente no backend: problema de rede/CORS/reverse proxy.
- `request_received` no backend sem `stream_finished`: falha na etapa de LLM/RAG.
- `responseLength` igual a `0` com status `200`: investigar parsing de stream e payload de modelo.
