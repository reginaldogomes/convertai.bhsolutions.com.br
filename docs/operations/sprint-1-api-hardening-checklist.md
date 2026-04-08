# Sprint 1 - API Hardening Checklist

Date: 2026-04-08
Scope: app/api routes

## Hardening Standard

- Observability with shared request logger
- Correlation id in response header using x-request-id (or x-chat-request-id in chat streaming route)
- Safe error responses for 4xx and 5xx
- Input validation with Zod where request payload is accepted

## Coverage by Route

| Route | Logger Standardized | Request Id Header | Payload Validation | Safe Error Handling | Status |
|---|---|---|---|---|---|
| app/api/ads/google-conversions/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/ads/outbox/flush/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/ads/outbox/health/route.ts | Yes | Yes | N/A | Yes | Done |
| app/api/analytics/track/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/automations/queue/dispatch/route.ts | Yes | Yes | N/A | Yes | Done |
| app/api/automations/queue/health/route.ts | Yes | Yes | N/A | Yes | Done |
| app/api/campaigns/generate/route.ts | Yes | Yes | Existing contract | Yes | Done |
| app/api/chat/[pageId]/route.ts | Yes | Yes (x-chat-request-id) | Existing contract | Yes | Done |
| app/api/chat/health/route.ts | Yes | Yes | N/A | Yes | Done |
| app/api/instagram/callback/route.ts | Yes | Redirect correlation via query requestId | N/A | Yes | Done |
| app/api/instagram/generate-auto-content/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/instagram/generate-calendar/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/instagram/generate-caption/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/instagram/generate-image-prompt/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/instagram/generate-image/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/landing-pages/generate/route.ts | Yes | Yes | Existing contract | Yes | Done |
| app/api/landing-pages/lead/route.ts | Yes | Yes | Yes | Yes | Done |
| app/api/landing-pages/seo/generate/route.ts | Yes | Yes | Existing contract | Yes | Done |
| app/api/products/generate/route.ts | Yes | Yes | Existing contract | Yes | Done |
| app/api/webhooks/twilio/route.ts | Yes | Yes | Yes | Yes | Done |

## Notes

- Existing contract means the route already had a stable payload contract in place and was preserved while hardening.
- Health routes do not require payload validation because they do not parse JSON request bodies.
- Chat streaming route keeps x-chat-request-id for backward compatibility.
- UI feedback standard for frontend error/success/warning states: `docs/operations/ui-feedback-guidelines.md`.
