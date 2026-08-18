import {
  Briefcase,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
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
import { Card, CardContent } from '@/components/ui/card'
import { Panel } from '@/components/ui/panel'
import { useCurrentUser } from '@/features/auth/hooks'
import { stageVariant } from '@/features/candidates/constants'
import { Button } from '@/components/ui/button'
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

function StatCard({ icon: Icon, tone, label, value }) {
  return (
    <Card>
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
  const { data: user } = useCurrentUser()
  const { data: options } = useOptions()
  const { data, isLoading } = useDashboardSummary()

  const role = user?.role
  const manageAll = role === 'admin' || role === 'hr'
  const consultant = role === 'consultant'
  const hiringManager = role === 'hiring_manager'
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" breadcrumb={['Dashboard']} />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const { jobs, candidates, interviews, recent_candidates } = data
  const pipeline = candidates.by_stage
  const sources = candidates.by_source.filter((s) => s.count > 0)

  const statCards = hiringManager
    ? [
        { icon: CalendarClock, tone: 'orange', label: 'Interviews today', value: interviews.today },
        { icon: CalendarClock, tone: 'blue', label: 'Upcoming interviews', value: interviews.upcoming },
        { icon: CheckCircle2, tone: 'amber', label: 'Awaiting my decision', value: interviews.awaiting_outcome },
        { icon: UserCheck, tone: 'emerald', label: 'Completed', value: interviews.completed },
      ]
    : [
        { icon: Briefcase, tone: 'orange', label: consultant ? 'My open jobs' : 'Open jobs', value: jobs.open },
        { icon: Users, tone: 'blue', label: consultant ? 'My candidates' : 'Active candidates', value: candidates.active },
        { icon: CalendarClock, tone: 'amber', label: 'Upcoming interviews', value: interviews.upcoming },
        { icon: UserCheck, tone: 'emerald', label: 'Hires', value: candidates.hired },
      ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        breadcrumb={['Dashboard']}
      />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Welcome back, {firstName}</h2>
        <p className="text-sm text-muted-foreground capitalize">
          {role?.replace('_', ' ')} overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Pipeline + sources (recruiters/HR). Hiring managers skip this. */}
      {!hiringManager && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Candidate pipeline" className="lg:col-span-2">
            {candidates.total === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No candidates yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipeline} layout="vertical" margin={{ left: 20 }}>
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
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {pipeline.map((s) => (
                      <Cell key={s.stage} fill={STAGE_COLORS[s.stage] ?? '#94a3b8'} />
                    ))}
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
                    <Pie data={sources} dataKey="count" nameKey="source" innerRadius={55} outerRadius={80} paddingAngle={2}>
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
                      <span className="font-medium">{s.count}</span>
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
                  <li key={c.id} className="flex items-center gap-3 py-3">
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Jobs by department">
            {(data.jobs_by_department ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No departments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.jobs_by_department} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="department" tickLine={false} axisLine={false} width={100} fontSize={12} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="Consultant workload">
            {(data.consultant_workload ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No consultants with candidates yet.</p>
            ) : (
              <ul className="divide-y">
                {data.consultant_workload.map((c) => (
                  <li key={c.name} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <Avatar name={c.name} size="sm" />
                      {c.name}
                    </span>
                    <Badge variant="secondary">{c.count} candidates</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
