import { getAuthContext } from '@/infrastructure/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

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
    pageId: string
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

type SortField = 'name' | 'status' | 'impressions' | 'ctaClicks' | 'leads' | 'ctr' | 'conversionRate'
type SortDirection = 'asc' | 'desc'
type PageSize = 10 | 25 | 50
type StatusFilter = 'all' | 'published' | 'draft'
type ReportPreset = 'executive' | 'seo' | 'conversion'
const DEFAULT_PAGE_SIZE: PageSize = 10
const MAX_SEARCH_LENGTH = 80

function percent(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0
    return Number(((numerator / denominator) * 100).toFixed(2))
}

function statusLabel(status: string): string {
    if (status === 'published') return 'Publicada'
    if (status === 'draft') return 'Rascunho'
    return status
}

const PERIOD_DAYS = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
} as const

type PeriodKey = keyof typeof PERIOD_DAYS

function normalizePeriod(value?: string): PeriodKey {
    if (value === '7d' || value === '30d' || value === '90d') return value
    return '30d'
}

function normalizeSortField(value?: string): SortField {
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

function normalizeSortDirection(value?: string): SortDirection {
    if (value === 'asc' || value === 'desc') return value
    return 'desc'
}

function normalizePage(value?: string): number {
    const parsed = Number.parseInt(value ?? '', 10)
    if (!Number.isFinite(parsed) || parsed < 1) return 1
    return parsed
}

function normalizePageSize(value?: string): PageSize {
    if (value === '10') return 10
    if (value === '25') return 25
    if (value === '50') return 50
    return DEFAULT_PAGE_SIZE
}

function normalizeSearchTerm(value?: string): string {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    return trimmed.slice(0, MAX_SEARCH_LENGTH)
}

function normalizeStatusFilter(value?: string): StatusFilter {
    if (value === 'published' || value === 'draft') return value
    return 'all'
}

function normalizeReportPreset(value?: string): ReportPreset {
    if (value === 'seo' || value === 'conversion') return value
    return 'executive'
}

function reportPresetLabel(preset: ReportPreset): string {
    if (preset === 'seo') return 'Preset SEO'
    if (preset === 'conversion') return 'Preset Conversão'
    return 'Preset Executivo'
}

function reportPresetBadgeClass(preset: ReportPreset): string {
    if (preset === 'seo') return 'border-sky-300/70 bg-sky-500/10 text-sky-700'
    if (preset === 'conversion') return 'border-emerald-300/70 bg-emerald-500/10 text-emerald-700'
    return 'border-border bg-muted/40 text-muted-foreground'
}

function analyticsHref(params: {
    period: PeriodKey
    sort: SortField
    dir: SortDirection
    page: number
    pageSize: PageSize
    status: StatusFilter
    preset: ReportPreset
    q?: string
}): string {
    const query = new URLSearchParams()
    query.set('period', params.period)
    query.set('sort', params.sort)
    query.set('dir', params.dir)
    query.set('page', String(params.page))
    query.set('pageSize', String(params.pageSize))
    query.set('status', params.status)
    query.set('preset', params.preset)
    if (params.q && params.q.trim().length > 0) {
        query.set('q', params.q.trim())
    }
    return `/analytics?${query.toString()}`
}

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams?: Promise<{ period?: string; sort?: string; dir?: string; page?: string; pageSize?: string; q?: string; status?: string; preset?: string }>
}) {
    const { orgId } = await getAuthContext()
    const supabase = createAdminClient()
    const query = await searchParams
    const period = normalizePeriod(query?.period)
    const sortBy = normalizeSortField(query?.sort)
    const sortDir = normalizeSortDirection(query?.dir)
    const requestedPage = normalizePage(query?.page)
    const pageSize = normalizePageSize(query?.pageSize)
    const searchTerm = normalizeSearchTerm(query?.q)
    const statusFilter = normalizeStatusFilter(query?.status)
    const reportPreset = normalizeReportPreset(query?.preset)
    const periodDays = PERIOD_DAYS[period]
    const periodStart = new Date(new Date().getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()

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

    const rows = pages
        .map((page) => {
            const counters = eventCounter.get(page.id) ?? {
                impressions: 0,
                ctaClicks: 0,
                leads: 0,
                chats: 0,
            }

            return {
                pageId: page.id,
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

    const totalRows = rowsSorted.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const currentPage = Math.min(requestedPage, totalPages)
    const pageStart = (currentPage - 1) * pageSize
    const rowsPaged = rowsSorted.slice(pageStart, pageStart + pageSize)

    const totals = rowsSorted.reduce(
        (acc, row) => {
            acc.impressions += row.impressions
            acc.ctaClicks += row.ctaClicks
            acc.leads += row.leads
            return acc
        },
        { impressions: 0, ctaClicks: 0, leads: 0 },
    )

    return (
        <div className="p-8 space-y-6">
            {/** Builds a link that keeps period and toggles sort direction for the selected column. */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium mb-1">Performance</p>
                    <h1 className="text-foreground text-2xl font-black tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        SEO e Conversão por Landing Page
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                        <p className="text-muted-foreground text-sm">Janela de {periodDays} dias</p>
                        <span className={`inline-flex items-center rounded-(--radius) border px-2 py-0.5 text-[11px] font-medium ${reportPresetBadgeClass(reportPreset)}`}>
                            {reportPresetLabel(reportPreset)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-(--radius) border border-border p-1">
                        {(['7d', '30d', '90d'] as const).map((option) => {
                            const active = option === period
                            return (
                                <Link
                                    key={option}
                                    href={analyticsHref({ period: option, sort: sortBy, dir: sortDir, page: 1, pageSize, status: statusFilter, preset: reportPreset, q: searchTerm })}
                                    className={`px-2.5 py-1 text-xs rounded-(--radius) transition-colors ${active
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    {option}
                                </Link>
                            )
                        })}
                    </div>
                    <Link href="/landing-pages" className="text-primary text-sm hover:underline">Gerenciar landing pages</Link>
                </div>
            </div>

            <form method="get" className="flex items-center gap-2">
                <input type="hidden" name="period" value={period} />
                <input type="hidden" name="sort" value={sortBy} />
                <input type="hidden" name="dir" value={sortDir} />
                <input type="hidden" name="pageSize" value={pageSize} />
                <input type="hidden" name="page" value="1" />
                <input type="hidden" name="preset" value={reportPreset} />
                <select
                    name="status"
                    defaultValue={statusFilter}
                    className="h-9 rounded-(--radius) border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <option value="all">Todos status</option>
                    <option value="published">Publicadas</option>
                    <option value="draft">Rascunhos</option>
                </select>
                <input
                    type="search"
                    name="q"
                    defaultValue={searchTerm}
                    maxLength={MAX_SEARCH_LENGTH}
                    placeholder="Buscar por nome ou slug"
                    className="h-9 w-full max-w-sm rounded-(--radius) border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                    type="submit"
                    className="h-9 px-3 rounded-(--radius) border border-border text-sm hover:bg-muted/60"
                >
                    Buscar
                </button>
                {searchTerm && (
                    <Link
                        href={analyticsHref({ period, sort: sortBy, dir: sortDir, page: 1, pageSize, status: statusFilter, preset: reportPreset })}
                        className="h-9 px-3 inline-flex items-center rounded-(--radius) border border-border text-sm hover:bg-muted/60"
                    >
                        Limpar
                    </Link>
                )}
            </form>

            <form method="get" action="/api/analytics/export" className="flex items-center gap-2">
                <input type="hidden" name="period" value={period} />
                <input type="hidden" name="sort" value={sortBy} />
                <input type="hidden" name="dir" value={sortDir} />
                <input type="hidden" name="page" value={currentPage} />
                <input type="hidden" name="pageSize" value={pageSize} />
                <input type="hidden" name="status" value={statusFilter} />
                <input type="hidden" name="q" value={searchTerm} />
                <select
                    name="preset"
                    defaultValue={reportPreset}
                    className="h-9 rounded-(--radius) border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <option value="executive">Preset Executivo</option>
                    <option value="seo">Preset SEO</option>
                    <option value="conversion">Preset Conversão</option>
                </select>
                <button
                    type="submit"
                    name="scope"
                    value="all"
                    className="h-9 px-3 rounded-(--radius) border border-border text-sm hover:bg-muted/60"
                >
                    Exportar Tudo
                </button>
                <button
                    type="submit"
                    name="scope"
                    value="current"
                    className="h-9 px-3 rounded-(--radius) border border-border text-sm hover:bg-muted/60"
                >
                    Exportar Página
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-5 rounded-(--radius)">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Impressões</p>
                    <p className="text-3xl font-black font-mono-data text-foreground mt-1">{totals.impressions}</p>
                </div>
                <div className="bg-card border border-border p-5 rounded-(--radius)">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">CTR Geral</p>
                    <p className="text-3xl font-black font-mono-data text-foreground mt-1">{percent(totals.ctaClicks, totals.impressions)}%</p>
                </div>
                <div className="bg-card border border-border p-5 rounded-(--radius)">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Conversão Geral</p>
                    <p className="text-3xl font-black font-mono-data text-foreground mt-1">{percent(totals.leads, totals.impressions)}%</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <SortableHeader label="Página" align="left" field="name" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                                <SortableHeader label="Status" align="left" field="status" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                                <SortableHeader label="Impressões" align="right" field="impressions" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                                <SortableHeader label="Cliques CTA" align="right" field="ctaClicks" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                                <SortableHeader label="Leads" align="right" field="leads" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                                <SortableHeader label="CTR" align="right" field="ctr" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                                <SortableHeader label="Conversão" align="right" field="conversionRate" activeSort={sortBy} activeDir={sortDir} period={period} pageSize={pageSize} status={statusFilter} preset={reportPreset} q={searchTerm} />
                            </tr>
                        </thead>
                        <tbody>
                            {rowsSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        {searchTerm
                                            ? `Nenhuma landing page encontrada para "${searchTerm}" neste período.`
                                            : 'Nenhuma landing page encontrada para este período.'}
                                    </td>
                                </tr>
                            ) : (
                                rowsPaged.map((row) => (
                                    <tr key={row.pageId} className="border-t border-border/60">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{row.name}</p>
                                            <Link href={`/p/${row.slug}`} className="text-xs text-primary hover:underline" target="_blank" rel="noreferrer">
                                                /p/{row.slug}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{statusLabel(row.status)}</td>
                                        <td className="px-4 py-3 text-right font-mono-data">{row.impressions}</td>
                                        <td className="px-4 py-3 text-right font-mono-data">{row.ctaClicks}</td>
                                        <td className="px-4 py-3 text-right font-mono-data">{row.leads}</td>
                                        <td className="px-4 py-3 text-right font-mono-data">{row.ctr}%</td>
                                        <td className="px-4 py-3 text-right font-mono-data">{row.conversionRate}%</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {rowsSorted.length > 0 && (
                    <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
                        <p>
                            Mostrando {pageStart + 1} a {Math.min(pageStart + pageSize, totalRows)} de {totalRows}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span>Itens:</span>
                                {[10, 25, 50].map((size) => (
                                    <Link
                                        key={size}
                                        href={analyticsHref({ period, sort: sortBy, dir: sortDir, page: 1, pageSize: size as PageSize, status: statusFilter, preset: reportPreset, q: searchTerm })}
                                        className={`px-2 py-1 rounded-(--radius) border border-border ${pageSize === size ? 'bg-primary text-white border-primary' : 'hover:bg-muted/60 text-foreground'}`}
                                    >
                                        {size}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={analyticsHref({ period, sort: sortBy, dir: sortDir, page: Math.max(1, currentPage - 1), pageSize, status: statusFilter, preset: reportPreset, q: searchTerm })}
                                aria-disabled={currentPage <= 1}
                                className={`px-2 py-1 rounded-(--radius) border border-border ${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-muted/60 text-foreground'}`}
                            >
                                Anterior
                            </Link>
                            <span>Página {currentPage} de {totalPages}</span>
                            <Link
                                href={analyticsHref({ period, sort: sortBy, dir: sortDir, page: Math.min(totalPages, currentPage + 1), pageSize, status: statusFilter, preset: reportPreset, q: searchTerm })}
                                aria-disabled={currentPage >= totalPages}
                                className={`px-2 py-1 rounded-(--radius) border border-border ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-muted/60 text-foreground'}`}
                            >
                                Próxima
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SortableHeader({
    label,
    align,
    field,
    activeSort,
    activeDir,
    period,
    pageSize,
    status,
    preset,
    q,
}: {
    label: string
    align: 'left' | 'right'
    field: SortField
    activeSort: SortField
    activeDir: SortDirection
    period: PeriodKey
    pageSize: PageSize
    status: StatusFilter
    preset: ReportPreset
    q: string
}) {
    const isActive = activeSort === field
    const nextDir: SortDirection = isActive && activeDir === 'desc' ? 'asc' : 'desc'
    const indicator = !isActive ? '' : activeDir === 'desc' ? ' ↓' : ' ↑'

    return (
        <th className={`${align === 'right' ? 'text-right' : 'text-left'} px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground`}>
            <Link
                href={analyticsHref({ period, sort: field, dir: nextDir, page: 1, pageSize, status, preset, q })}
                className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${align === 'right' ? 'justify-end w-full' : ''}`}
            >
                <span>{label}{indicator}</span>
            </Link>
        </th>
    )
}
