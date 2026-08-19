import {
  Briefcase,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentUser } from '@/features/auth/hooks'
import { stageVariant } from '@/features/candidates/constants'
import { ConsultantBreakdown } from '@/features/dashboard/components/ConsultantBreakdown'
import { useDashboardSummary } from '@/features/dashboard/hooks'
import { formatWhen, googleCalendarUrl } from '@/features/interviews/constants'
import { optionLabel, useOptions } from '@/features/meta/hooks'

const STAGE_COLORS = {
  applied: '#94a3b8',
  screening: '#3b82f6',
  interview: '#f59e0b',
  offer: '#a855f7',
  hired: '#10b981',
  rejected: '#ef4444',
}
const SOURCE_COLORS = ['#f97316', '#0d9488', '#3b82f6', '#a855f7']
const TONES = {
  orange: 'bg-primary/10 text-primary',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  )
}

function PanelSkeleton({ className, lines = 4 }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="border-b px-5 py-3.5">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelSkeleton className="lg:col-span-2" lines={6} />
        <PanelSkeleton lines={6} />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, tone, label, value, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={onClick ? 'cursor-pointer transition-colors hover:bg-muted/40' : undefined}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-11 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [days, setDays] = useState(7)
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const { data, isLoading } = useDashboardSummary(days)

  const role = user?.role
  const manageAll = role === 'admin' || role === 'hr'
  const consultant = role === 'consultant'
  const hiringManager = role === 'hiring_manager'
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" breadcrumb={['Dashboard']} />
        <DashboardSkeleton />
      </div>
    )
  }

  const { jobs, candidates, interviews, recent_candidates, activity, pending } = data
  const go = (path) => navigate(path)

  const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const withLabel = (rows, total) =>
    rows.map((r) => ({ ...r, label: `${r.count} (${pct(r.count, total)}%)` }))

  const totalCandidates = candidates.total
  const pipeline = withLabel(candidates.by_stage, totalCandidates)
  const rawSources = candidates.by_source.filter((s) => s.count > 0)
  const sourceTotal = rawSources.reduce((a, s) => a + s.count, 0)
  const sources = rawSources
  const deptRaw = data.jobs_by_department ?? []
  const deptTotal = deptRaw.reduce((a, d) => a + d.count, 0)
  const departments = withLabel(deptRaw, deptTotal)

  const activityItems = hiringManager
    ? [
      { label: 'Interviews completed', value: activity.interviews_completed },
      { label: 'Emails sent', value: activity.emails_sent },
    ]
    : [
      { label: 'Candidates added', value: activity.candidates_added },
      { label: 'Interviews scheduled', value: activity.interviews_scheduled },
      { label: 'Hires', value: activity.hires },
      { label: 'Emails sent', value: activity.emails_sent },
    ]

  const pendingItems = hiringManager
    ? [
      { label: 'Awaiting my decision', value: pending.awaiting_outcome, to: '/interviews?status=scheduled' },
      { label: 'Upcoming interviews', value: pending.interviews_upcoming, to: '/interviews?status=scheduled' },
    ]
    : [
      { label: 'To review (Applied/Screening)', value: pending.to_review, to: '/candidates?stage=screening' },
      { label: 'Offers out', value: pending.offers_out, to: '/candidates?stage=offer' },
      { label: 'Upcoming interviews', value: pending.interviews_upcoming, to: '/interviews?status=scheduled' },
    ]

  const statCards = hiringManager
    ? [
      { icon: CalendarClock, tone: 'orange', label: 'Interviews today', value: interviews.today, to: '/interviews' },
      { icon: CalendarClock, tone: 'blue', label: 'Upcoming interviews', value: interviews.upcoming, to: '/interviews?status=scheduled' },
      { icon: CheckCircle2, tone: 'amber', label: 'Awaiting my decision', value: interviews.awaiting_outcome, to: '/interviews?status=scheduled' },
      { icon: UserCheck, tone: 'emerald', label: 'Completed', value: interviews.completed, to: '/interviews?status=completed' },
    ]
    : [
      { icon: Briefcase, tone: 'orange', label: consultant ? 'My open jobs' : 'Open jobs', value: jobs.open, to: '/jobs?status=open' },
      { icon: Users, tone: 'blue', label: consultant ? 'My candidates' : 'Active candidates', value: candidates.active, to: '/candidates' },
      { icon: CalendarClock, tone: 'amber', label: 'Upcoming interviews', value: interviews.upcoming, to: '/interviews?status=scheduled' },
      { icon: UserCheck, tone: 'emerald', label: 'Hires', value: candidates.hired, to: '/candidates?stage=hired' },
    ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        breadcrumb={['Dashboard']}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Welcome back, {firstName}</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {role?.replace('_', ' ')} overview
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} onClick={() => go(s.to)} />
        ))}
      </div>

      {/* Activity window + needs attention */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title={`Last ${days} days`}>
          <div className="grid grid-cols-2 gap-4">
            {activityItems.map((a) => (
              <div key={a.label}>
                <div className="text-2xl font-bold tracking-tight">{a.value}</div>
                <div className="text-sm text-muted-foreground">{a.label}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Needs attention">
          <ul className="space-y-1">
            {pendingItems.map((p) => (
              <li
                key={p.label}
                onClick={() => go(p.to)}
                className="-mx-2 flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <span className="text-muted-foreground">{p.label}</span>
                <Badge variant={p.value > 0 ? 'warning' : 'secondary'}>{p.value}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Pipeline + sources (recruiters/HR). Hiring managers skip this. */}
      {!hiringManager && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Candidate pipeline" className="lg:col-span-2">
            {candidates.total === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No candidates yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipeline} layout="vertical" margin={{ left: 20, right: 56 }}>
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    fontSize={12}
                    tickFormatter={(v) => optionLabel(options?.candidate_stages, v)}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar
                    dataKey="count"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                    cursor="pointer"
                    onClick={(d) => go(`/candidates?stage=${d.stage}`)}
                  >
                    {pipeline.map((s) => (
                      <Cell key={s.stage} fill={STAGE_COLORS[s.stage] ?? '#94a3b8'} />
                    ))}
                    <LabelList dataKey="label" position="right" fontSize={11} fill="#374151" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="Candidates by source">
            {sources.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={sources}
                      dataKey="count"
                      nameKey="source"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      cursor="pointer"
                      onClick={(d) => go(`/candidates?source=${d.source}`)}
                    >
                      {sources.map((s, i) => (
                        <Cell key={s.source} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {sources.map((s, i) => (
                    <div key={s.source} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                        {optionLabel(options?.candidate_sources, s.source)}
                      </span>
                      <span className="font-medium">
                        {s.count} ({pct(s.count, sourceTotal)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>
        </div>
      )}

      {/* Upcoming interviews + recent candidates */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title={hiringManager ? 'My schedule' : 'Upcoming interviews'}
          className={hiringManager ? 'lg:col-span-3' : 'lg:col-span-2'}
        >
          {interviews.upcoming_list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No upcoming interviews.</p>
          ) : (
            <ul className="divide-y">
              {interviews.upcoming_list.map((iv) => (
                <li key={iv.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={iv.candidate_name ?? '—'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{iv.candidate_name ?? '—'}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {iv.job_title ?? '—'}
                      {!hiringManager && iv.hiring_manager ? ` · ${iv.hiring_manager}` : ''}
                      {' · '}
                      {formatWhen(iv.scheduled_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <a
                        href={googleCalendarUrl({
                          title: `Interview: ${iv.candidate_name ?? ''}${iv.job_title ? ` — ${iv.job_title}` : ''}`,
                          scheduledAt: iv.scheduled_at,
                          details: iv.meeting_link ? `Join: ${iv.meeting_link}` : '',
                          location: iv.meeting_link || '',
                        })}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <CalendarPlus className="size-3.5" /> Add to Calendar
                      </a>
                    </Button>
                    {iv.meeting_link && (
                      <Button asChild size="sm" className="gap-1.5">
                        <a href={iv.meeting_link} target="_blank" rel="noreferrer">
                          <Video className="size-3.5" /> Join Now
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {!hiringManager && (
          <Panel title="Recent candidates">
            {recent_candidates.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No candidates yet.</p>
            ) : (
              <ul className="divide-y">
                {recent_candidates.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => go(`/candidates?search=${encodeURIComponent(c.full_name)}`)}
                    className="flex cursor-pointer items-center gap-3 py-3 hover:bg-muted/40"
                  >
                    <Avatar name={c.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.full_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.job_title ?? '—'}</div>
                    </div>
                    <Badge variant={stageVariant(c.stage)}>
                      {optionLabel(options?.candidate_stages, c.stage)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>

      {/* Admin/HR extras */}
      {manageAll && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Jobs by department">
            {departments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No departments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={departments} layout="vertical" margin={{ left: 20, right: 48 }}>
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="department" tickLine={false} axisLine={false} width={100} fontSize={12} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                    cursor="pointer"
                    onClick={(d) => go(`/jobs?search=${encodeURIComponent(d.department)}`)}
                  >
                    <LabelList dataKey="label" position="right" fontSize={11} fill="#374151" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <ConsultantBreakdown />
        </div>
      )}
    </div>
  )
}
