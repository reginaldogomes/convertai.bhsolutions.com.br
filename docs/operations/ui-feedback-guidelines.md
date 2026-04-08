# UI Feedback Guidelines

Date: 2026-04-08
Scope: Dashboard UI (CRM + Instagram + shared components)

## Objective

Standardize user feedback for errors, warnings, success messages, and destructive confirmations.

## Components

### 1. Inline Error

Use for: form validation failures, API action failures, save/update failures.

Component:
- `components/ui/inline-error.tsx`

Props:
- `message: string`
- `size?: 'sm' | 'md'` (default: `md`)
- `className?: string`

Example:

```tsx
{state.error && <InlineError message={state.error} size="sm" />}
```

### 2. Inline Notice

Use for: warnings, success confirmations, informational messages that are not hard errors.

Component:
- `components/ui/inline-notice.tsx`

Props:
- `message: React.ReactNode`
- `title?: string`
- `variant?: 'success' | 'warning' | 'info' | 'destructive'` (default: `info`)
- `size?: 'sm' | 'md'` (default: `md`)
- `className?: string`

Examples:

```tsx
<InlineNotice variant="success" message="Produto atualizado com sucesso!" />

<InlineNotice
  variant="warning"
  title="Atenção"
  size="sm"
  message="Contatos que já receberam o email anteriormente receberão novamente. Use com cuidado."
/>
```

### 3. Danger Confirmation Header

Use for: destructive dialogs (delete contact, delete product, delete landing page).

Component:
- `components/ui/danger-confirmation-header.tsx`

Props:
- `title: string`
- `subtitle?: string` (default: "Esta ação não pode ser desfeita.")
- `titleId?: string`

Example:

```tsx
<DangerConfirmationHeader titleId="del-contact-title" title="Apagar contato?" />
```

## Decision Rules

1. Show `InlineError` for blocking failures.
2. Show `InlineNotice` for non-blocking status (warning/success/info).
3. Keep toasts for transient/global feedback, but keep persistent context-specific messages inline.
4. Use `DangerConfirmationHeader` in every modal that confirms irreversible actions.

## Request Id Guidance

When backend returns request id (header `x-request-id` or `x-chat-request-id`), include it in visible error text to speed up support triage.

Recommended utility:
- `lib/client-api-error.ts`

Pattern:

```tsx
const apiError = await parseApiError(response, 'Erro ao gerar conteúdo')
setError(formatErrorWithRequestId(apiError.message, apiError.requestId))
```

## PR Checklist

- [ ] Blocking failures use `InlineError`
- [ ] Warnings/success/info use `InlineNotice`
- [ ] Destructive confirms use `DangerConfirmationHeader`
- [ ] Error text supports request id when API provides it
- [ ] No duplicated custom alert markup when a shared component exists
