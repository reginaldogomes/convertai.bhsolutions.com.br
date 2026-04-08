import { createAdminClient } from '@/lib/supabase/admin'
import { createApiRequestLogger, isAuthError, jsonWithRequestId } from '@/lib/api-observability'
import { getAuthContext } from '@/infrastructure/auth'

type SortField = 'name' | 'status' | 'impressions' | 'ctaClicks' | 'leads' | 'ctr' | 'conversionRate'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'published' | 'draft'
type PageSize = 10 | 25 | 50
type ExportScope = 'all' | 'current'
type ReportPreset = 'executive' | 'seo' | 'conversion'
type LandingPageRow = {
    id: string
    name: string
    slug: string
    status: string
}
type AnalyticsEventRow = {
    landing_page_id: string
    event_type: 'view' | 'chat_start' | 'lead_captured' | 'cta_click'
}

type PageMetricsRow = {
    name: string
    slug: string
    status: string
    impressions: number
    ctaClicks: number
    leads: number
    chats: number
    ctr: number
    conversionRate: number
}

const PERIOD_DAYS = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
} as const

type PeriodKey = keyof typeof PERIOD_DAYS

function normalizePeriod(value: string | null): PeriodKey {
    if (value === '7d' || value === '30d' || value === '90d') return value
    return '30d'
}

function normalizeSortField(value: string | null): SortField {
    if (
        value === 'name' ||
        value === 'status' ||
        value === 'impressions' ||
        value === 'ctaClicks' ||
        value === 'leads' ||
        value === 'ctr' ||
        value === 'conversionRate'
    ) {
        return value
    }

    return 'impressions'
}

function normalizeSortDirection(value: string | null): SortDirection {
    if (value === 'asc' || value === 'desc') return value
    return 'desc'
}

function normalizeStatusFilter(value: string | null): StatusFilter {
    if (value === 'published' || value === 'draft') return value
    return 'all'
}

function normalizeSearchTerm(value: string | null): string {
    if (!value) return ''
    return value.trim().slice(0, 80)
}

function normalizePageSize(value: string | null): PageSize {
    if (value === '10') return 10
    if (value === '25') return 25
    if (value === '50') return 50
    return 10
}

function normalizePage(value: string | null): number {
    const parsed = Number.parseInt(value ?? '', 10)
    if (!Number.isFinite(parsed) || parsed < 1) return 1
    return parsed
}

function normalizeExportScope(value: string | null): ExportScope {
    if (value === 'current') return 'current'
    return 'all'
}

function normalizeReportPreset(value: string | null): ReportPreset {
    if (value === 'seo' || value === 'conversion') return value
    return 'executive'
}

function percent(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0
    return Number(((numerator / denominator) * 100).toFixed(2))
}

function escapeCsvCell(value: string | number): string {
    const text = String(value)
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
    }

    return text
}

function buildCsv(
    rows: PageMetricsRow[],
    context: { period: PeriodKey; periodDays: number; periodStart: string; periodEnd: string; exportedAt: string },
    preset: ReportPreset,
): string {
    const baseHeaders = [
        'period_key',
        'period_days',
        'period_start_utc',
        'period_end_utc',
        'exported_at_utc',
    ]
    const presetHeaders =
        preset === 'seo'
            ? ['page_name', 'slug', 'status', 'impressions', 'cta_clicks', 'ctr_percent']
            : preset === 'conversion'
                ? ['page_name', 'slug', 'status', 'leads', 'chat_starts', 'conversion_percent']
                : ['page_name', 'slug', 'status', 'impressions', 'cta_clicks', 'leads', 'chat_starts', 'ctr_percent', 'conversion_percent']

    const headers = [...baseHeaders, ...presetHeaders]

    const lines = [headers.join(',')]

    for (const row of rows) {
        const baseValues = [
            escapeCsvCell(context.period),
            escapeCsvCell(context.periodDays),
            escapeCsvCell(context.periodStart),
            escapeCsvCell(context.periodEnd),
            escapeCsvCell(context.exportedAt),
        ]

        const presetValues =
            preset === 'seo'
                ? [
                    escapeCsvCell(row.name),
                    escapeCsvCell(row.slug),
                    escapeCsvCell(row.status),
                    escapeCsvCell(row.impressions),
                    escapeCsvCell(row.ctaClicks),
                    escapeCsvCell(row.ctr),
                ]
                : preset === 'conversion'
                    ? [
                        escapeCsvCell(row.name),
                        escapeCsvCell(row.slug),
                        escapeCsvCell(row.status),
                        escapeCsvCell(row.leads),
                        escapeCsvCell(row.chats),
                        escapeCsvCell(row.conversionRate),
                    ]
                    : [
                        escapeCsvCell(row.name),
                        escapeCsvCell(row.slug),
                        escapeCsvCell(row.status),
                        escapeCsvCell(row.impressions),
                        escapeCsvCell(row.ctaClicks),
                        escapeCsvCell(row.leads),
                        escapeCsvCell(row.chats),
                        escapeCsvCell(row.ctr),
                        escapeCsvCell(row.conversionRate),
                    ]

        lines.push([...baseValues, ...presetValues].join(','))
    }

    return lines.join('\n')
}

export async function GET(request: Request) {
    const logger = createApiRequestLogger('analytics/export')

    try {
        const { orgId } = await getAuthContext()
        const supabase = createAdminClient()
        const url = new URL(request.url)

        const period = normalizePeriod(url.searchParams.get('period'))
        const sortBy = normalizeSortField(url.searchParams.get('sort'))
        const sortDir = normalizeSortDirection(url.searchParams.get('dir'))
        const statusFilter = normalizeStatusFilter(url.searchParams.get('status'))
        const searchTerm = normalizeSearchTerm(url.searchParams.get('q'))
        const pageSize = normalizePageSize(url.searchParams.get('pageSize'))
        const requestedPage = normalizePage(url.searchParams.get('page'))
        const scope = normalizeExportScope(url.searchParams.get('scope'))
        const preset = normalizeReportPreset(url.searchParams.get('preset'))

        const periodDays = PERIOD_DAYS[period]
        const now = new Date()
        const periodEnd = now.toISOString()
        const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()

        let pagesQuery = supabase
            .from('landing_pages')
            .select('id, name, slug, status')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (searchTerm) {
            pagesQuery = pagesQuery.or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
        }

        if (statusFilter !== 'all') {
            pagesQuery = pagesQuery.eq('status', statusFilter)
        }

        const { data: pagesData } = await pagesQuery
        const pages = (pagesData ?? []) as LandingPageRow[]
        const pageIds = pages.map((page) => page.id)

        let events: AnalyticsEventRow[] = []
        if (pageIds.length > 0) {
            const { data: eventsData } = await supabase
                .from('page_analytics')
                .select('landing_page_id, event_type')
                .in('landing_page_id', pageIds)
                .gte('created_at', periodStart)

            events = (eventsData ?? []) as AnalyticsEventRow[]
        }

        const eventCounter = new Map<string, { impressions: number; ctaClicks: number; leads: number; chats: number }>()

        for (const event of events) {
            const current = eventCounter.get(event.landing_page_id) ?? {
                impressions: 0,
                ctaClicks: 0,
                leads: 0,
                chats: 0,
            }

            if (event.event_type === 'view') current.impressions += 1
            if (event.event_type === 'cta_click') current.ctaClicks += 1
            if (event.event_type === 'lead_captured') current.leads += 1
            if (event.event_type === 'chat_start') current.chats += 1

            eventCounter.set(event.landing_page_id, current)
        }

        const rows = pages.map((page) => {
            const counters = eventCounter.get(page.id) ?? {
                impressions: 0,
                ctaClicks: 0,
                leads: 0,
                chats: 0,
            }

            return {
                name: page.name,
                slug: page.slug,
                status: page.status,
                impressions: counters.impressions,
                ctaClicks: counters.ctaClicks,
                leads: counters.leads,
                chats: counters.chats,
                ctr: percent(counters.ctaClicks, counters.impressions),
                conversionRate: percent(counters.leads, counters.impressions),
            }
        })

        const rowsSorted: PageMetricsRow[] = [...rows].sort((a, b) => {
            const direction = sortDir === 'asc' ? 1 : -1

            if (sortBy === 'name' || sortBy === 'status') {
                return a[sortBy].localeCompare(b[sortBy]) * direction
            }

            return ((a[sortBy] as number) - (b[sortBy] as number)) * direction
        })

        const totalPages = Math.max(1, Math.ceil(rowsSorted.length / pageSize))
        const currentPage = Math.min(requestedPage, totalPages)
        const pageStart = (currentPage - 1) * pageSize
        const rowsForExport = scope === 'current'
            ? rowsSorted.slice(pageStart, pageStart + pageSize)
            : rowsSorted

        const csv = buildCsv(rowsForExport, {
            period,
            periodDays,
            periodStart,
            periodEnd,
            exportedAt: periodEnd,
        }, preset)
        const filename = `analytics-${preset}-${new Date().toISOString().slice(0, 10)}.csv`

        const response = new Response(csv, {
            status: 200,
            headers: {
                'content-type': 'text/csv; charset=utf-8',
                'content-disposition': `attachment; filename="${filename}"`,
                'cache-control': 'no-store',
            },
        })

        response.headers.set('x-request-id', logger.requestId)
        return response
    } catch (error) {
        logger.error('export_failed', error)

        if (isAuthError(error)) {
            return jsonWithRequestId(logger.requestId, { error: 'Não autenticado', requestId: logger.requestId }, { status: 401 })
        }

        return jsonWithRequestId(
            logger.requestId,
            { error: 'Falha ao exportar analytics em CSV', requestId: logger.requestId },
            { status: 500 }
        )
    }
}
