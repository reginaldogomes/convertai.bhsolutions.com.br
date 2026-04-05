import { createAdminClient } from '@/lib/supabase/admin'
import { contactRepo, useCases } from '@/application/services/container'
import type { AutomationStep } from '@/domain/interfaces'
import type { Automation } from '@/domain/entities'

export type AutomationTriggerEvent =
    | 'new_contact'
    | 'new_deal'
    | 'deal_won'
    | 'deal_lost'
    | 'contact_tag_added'
    | 'message_received'
    | 'form_submitted'

export interface AutomationDispatchInput {
    orgId: string
    event: AutomationTriggerEvent
    context: {
        contactId?: string
        source?: string
        message?: string
        metadata?: Record<string, unknown>
    }
}

interface ProcessAutomationQueueInput {
    limit?: number
}

interface QueuedAutomationJob {
    id: string
    organization_id: string
    automation_id: string
    trigger_event: string
    contact_id: string | null
    source: string | null
    message: string | null
    metadata_json: Record<string, unknown> | null
    steps_json: unknown
    attempts: number
    max_attempts: number
}

let missingRuntimeTablesWarned = false

function warnMissingRuntimeTablesOnce() {
    if (missingRuntimeTablesWarned) return
    missingRuntimeTablesWarned = true
    console.warn('[automation-runtime] Tables automation_execution_logs / automation_job_queue not found. Apply migration 014_automation_runtime.sql.')
}

function isMissingRuntimeTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const maybe = error as { code?: string; message?: string }
    if (maybe.code === 'PGRST205') return true
    if (typeof maybe.message !== 'string') return false
    return maybe.message.includes('automation_execution_logs') || maybe.message.includes('automation_job_queue')
}

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback
}

function fillTemplate(
    template: string,
    data: {
        contact?: { name: string; email: string | null; phone: string | null; company: string | null }
        event: { source: string; message: string }
    }
): string {
    return template
        .replaceAll('{{contact.name}}', data.contact?.name ?? 'Cliente')
        .replaceAll('{{contact.email}}', data.contact?.email ?? '')
        .replaceAll('{{contact.phone}}', data.contact?.phone ?? '')
        .replaceAll('{{contact.company}}', data.contact?.company ?? '')
        .replaceAll('{{event.source}}', data.event.source)
        .replaceAll('{{event.message}}', data.event.message)
}

async function runStep(
    orgId: string,
    step: AutomationStep,
    context: AutomationDispatchInput['context'],
    contact: Awaited<ReturnType<typeof contactRepo.findById>>,
): Promise<Awaited<ReturnType<typeof contactRepo.findById>>> {
    if (!contact && step.type !== 'wait') return

    const templateData = {
        contact: contact ? {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
        } : undefined,
        event: {
            source: context.source ?? 'system',
            message: context.message ?? '',
        },
    }

    switch (step.type) {
        case 'send_whatsapp': {
            if (!contact) return
            const messageTemplate = asString(step.config.message, asString(step.config.body, ''))
            const content = fillTemplate(messageTemplate, templateData).trim()
            if (!content) return
            const sent = await useCases.sendMessage().execute(orgId, {
                contactId: contact.id,
                content,
                channel: 'whatsapp',
            })
            if (!sent.ok) throw new Error(sent.error.message)
            return contact
        }
        case 'send_sms': {
            if (!contact) return
            const messageTemplate = asString(step.config.message, asString(step.config.body, ''))
            const content = fillTemplate(messageTemplate, templateData).trim()
            if (!content) return
            const sent = await useCases.sendMessage().execute(orgId, {
                contactId: contact.id,
                content,
                channel: 'sms',
            })
            if (!sent.ok) throw new Error(sent.error.message)
            return contact
        }
        case 'send_email': {
            if (!contact) return
            const subjectTemplate = asString(step.config.subject, 'Mensagem')
            const bodyTemplate = asString(step.config.body, asString(step.config.message, ''))
            const subject = fillTemplate(subjectTemplate, templateData).trim() || 'Mensagem'
            const content = fillTemplate(bodyTemplate, templateData).trim()
            if (!content) return
            const sent = await useCases.sendMessage().execute(orgId, {
                contactId: contact.id,
                subject,
                content,
                channel: 'email',
            })
            if (!sent.ok) throw new Error(sent.error.message)
            return contact
        }
        case 'add_tag': {
            if (!contact) return
            const tag = asString(step.config.tag).trim()
            if (!tag) return
            const tags = Array.from(new Set([...(contact.tags ?? []), tag]))
            await contactRepo.update(contact.id, { tags })
            return await contactRepo.findById(contact.id)
        }
        case 'assign_agent': {
            if (!contact) return
            const agentName = asString(step.config.agentName).trim()
            if (!agentName) return
            const noteLine = `[Auto-assign] Agente atribuido: ${agentName}`
            const notes = contact.notes ? `${contact.notes}\n${noteLine}` : noteLine
            await contactRepo.update(contact.id, { notes })
            return await contactRepo.findById(contact.id)
        }
        case 'wait':
        default:
            return contact
    }
}

function getWaitDelayMs(step: AutomationStep): number {
    const rawDuration = Number(step.config.duration)
    const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 1
    const unit = asString(step.config.unit, 'hours')

    if (unit === 'minutes') return duration * 60_000
    if (unit === 'days') return duration * 24 * 60 * 60_000
    return duration * 60 * 60_000
}

function normalizeSteps(input: unknown): AutomationStep[] {
    if (!Array.isArray(input)) return []
    return input
        .map((step) => {
            if (!step || typeof step !== 'object') return null
            const s = step as { type?: string; config?: Record<string, unknown> }
            if (!s.type || typeof s.type !== 'string') return null
            return {
                type: s.type as AutomationStep['type'],
                config: s.config ?? {},
            }
        })
        .filter((step): step is AutomationStep => !!step)
}

function computeBackoffMs(attempts: number): number {
    if (attempts <= 1) return 60_000
    if (attempts === 2) return 5 * 60_000
    if (attempts === 3) return 15 * 60_000
    return 30 * 60_000
}

async function logAutomationExecution(input: {
    orgId: string
    automationId: string
    triggerEvent: string
    stepIndex: number
    stepType: string
    status: 'success' | 'error' | 'queued' | 'skipped'
    contactId?: string
    metadata?: Record<string, unknown>
    errorMessage?: string
}) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('automation_execution_logs')
        .insert({
            organization_id: input.orgId,
            automation_id: input.automationId,
            trigger_event: input.triggerEvent,
            step_index: input.stepIndex,
            step_type: input.stepType,
            status: input.status,
            contact_id: input.contactId ?? null,
            metadata_json: input.metadata ?? {},
            error_message: input.errorMessage ?? null,
            executed_at: new Date().toISOString(),
        })

    if (error && isMissingRuntimeTableError(error)) {
        warnMissingRuntimeTablesOnce()
    }
}

async function enqueueAutomationJob(input: {
    orgId: string
    automationId: string
    triggerEvent: string
    context: AutomationDispatchInput['context']
    steps: AutomationStep[]
    executeAfter: Date
}) {
    if (input.steps.length === 0) return

    const supabase = createAdminClient()
    const { error } = await supabase
        .from('automation_job_queue')
        .insert({
            organization_id: input.orgId,
            automation_id: input.automationId,
            trigger_event: input.triggerEvent,
            contact_id: input.context.contactId ?? null,
            source: input.context.source ?? null,
            message: input.context.message ?? null,
            metadata_json: input.context.metadata ?? {},
            steps_json: input.steps as unknown as Record<string, unknown>,
            execute_after: input.executeAfter.toISOString(),
            status: 'pending',
            attempts: 0,
            max_attempts: 5,
        })

    if (error && isMissingRuntimeTableError(error)) {
        warnMissingRuntimeTablesOnce()
    }
}

async function executeWorkflow(input: {
    automation: Automation
    orgId: string
    triggerEvent: string
    context: AutomationDispatchInput['context']
    steps: AutomationStep[]
}): Promise<number> {
    let contact = input.context.contactId
        ? await contactRepo.findById(input.context.contactId)
        : null

    let executedSteps = 0

    for (let i = 0; i < input.steps.length; i += 1) {
        const step = input.steps[i]

        if (step.type === 'wait') {
            const remaining = input.steps.slice(i + 1)
            if (remaining.length > 0) {
                const executeAfter = new Date(Date.now() + getWaitDelayMs(step))
                await enqueueAutomationJob({
                    orgId: input.orgId,
                    automationId: input.automation.id,
                    triggerEvent: input.triggerEvent,
                    context: input.context,
                    steps: remaining,
                    executeAfter,
                })

                await logAutomationExecution({
                    orgId: input.orgId,
                    automationId: input.automation.id,
                    triggerEvent: input.triggerEvent,
                    stepIndex: i,
                    stepType: step.type,
                    status: 'queued',
                    contactId: contact?.id,
                    metadata: { executeAfter: executeAfter.toISOString(), queuedSteps: remaining.length },
                })

                executedSteps += 1
            } else {
                await logAutomationExecution({
                    orgId: input.orgId,
                    automationId: input.automation.id,
                    triggerEvent: input.triggerEvent,
                    stepIndex: i,
                    stepType: step.type,
                    status: 'skipped',
                    contactId: contact?.id,
                    metadata: { reason: 'wait-without-following-steps' },
                })
            }

            break
        }

        try {
            contact = await runStep(input.orgId, step, input.context, contact)
            await logAutomationExecution({
                orgId: input.orgId,
                automationId: input.automation.id,
                triggerEvent: input.triggerEvent,
                stepIndex: i,
                stepType: step.type,
                status: 'success',
                contactId: contact?.id,
            })
            executedSteps += 1
        } catch (error) {
            await logAutomationExecution({
                orgId: input.orgId,
                automationId: input.automation.id,
                triggerEvent: input.triggerEvent,
                stepIndex: i,
                stepType: step.type,
                status: 'error',
                contactId: contact?.id,
                errorMessage: error instanceof Error ? error.message : 'Unknown automation step error',
            })
        }
    }

    return executedSteps
}

export async function processAutomationQueue(input: ProcessAutomationQueueInput = {}): Promise<{ processed: number }> {
    const supabase = createAdminClient()
    const limit = Math.max(1, Math.min(input.limit ?? 25, 100))
    const nowIso = new Date().toISOString()

    const { data, error } = await supabase
        .from('automation_job_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('execute_after', nowIso)
        .is('locked_at', null)
        .order('execute_after', { ascending: true })
        .limit(limit)

    if (error) {
        if (isMissingRuntimeTableError(error)) {
            warnMissingRuntimeTablesOnce()
            return { processed: 0 }
        }
        throw error
    }

    const jobs = (data ?? []) as unknown as QueuedAutomationJob[]
    let processed = 0

    for (const job of jobs) {
        const lockTime = new Date().toISOString()
        const { data: locked, error: lockError } = await supabase
            .from('automation_job_queue')
            .update({ status: 'processing', locked_at: lockTime })
            .eq('id', job.id)
            .eq('status', 'pending')
            .is('locked_at', null)
            .select('id')
            .maybeSingle()

        if (lockError || !locked) continue

        try {
            const automation = await useCases.getAutomation().execute(job.automation_id, job.organization_id)
            if (!automation || !automation.isActive()) {
                await supabase
                    .from('automation_job_queue')
                    .update({ status: 'failed', locked_at: null, last_error: 'Automation missing or inactive' })
                    .eq('id', job.id)
                continue
            }

            const steps = normalizeSteps(job.steps_json)
            await executeWorkflow({
                automation,
                orgId: job.organization_id,
                triggerEvent: job.trigger_event,
                context: {
                    contactId: job.contact_id ?? undefined,
                    source: job.source ?? undefined,
                    message: job.message ?? undefined,
                    metadata: job.metadata_json ?? {},
                },
                steps,
            })

            await supabase
                .from('automation_job_queue')
                .update({ status: 'done', locked_at: null, last_error: null })
                .eq('id', job.id)
            processed += 1
        } catch (error) {
            const attempts = job.attempts + 1
            const shouldFail = attempts >= job.max_attempts
            const retryAt = new Date(Date.now() + computeBackoffMs(attempts)).toISOString()

            await supabase
                .from('automation_job_queue')
                .update({
                    status: shouldFail ? 'failed' : 'pending',
                    attempts,
                    last_error: error instanceof Error ? error.message : 'Queue processing error',
                    execute_after: shouldFail ? nowIso : retryAt,
                    locked_at: null,
                })
                .eq('id', job.id)
        }
    }

    return { processed }
}

export async function dispatchAutomationEvent(input: AutomationDispatchInput): Promise<{ matched: number; executed: number }> {
    const automations = await useCases.listAutomations().execute(input.orgId)
    const matched = automations.filter((automation) => automation.isActive() && automation.triggerEvent === input.event)

    if (matched.length === 0) {
        return { matched: 0, executed: 0 }
    }

    let executed = 0

    for (const automation of matched) {
        executed += await executeWorkflow({
            automation,
            orgId: input.orgId,
            triggerEvent: input.event,
            context: input.context,
            steps: automation.workflowJson.steps,
        })
    }

    return { matched: matched.length, executed }
}
