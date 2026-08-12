import {
  Calendar,
  Check,
  Clock,
  DollarSign,
  GraduationCap,
  Plus,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
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
import { Panel } from '@/components/ui/panel'
import { useEmployees } from '@/features/employees/hooks'

const LEAVE_TYPES = [
  { name: 'Sick Leave', value: 45, color: '#f59e0b' },
  { name: 'Casual Leave', value: 68, color: '#3b82f6' },
  { name: 'Unpaid', value: 12, color: '#ef4444' },
]

const OVERVIEW = [
  { label: 'Total Employees', value: '1,848', sub: 'Headcount Overview', delta: '+18%', up: true, icon: Users },
  { label: 'New Joinees', value: '1,248', sub: 'All Department', delta: '+22%', up: true, icon: UserPlus },
  { label: 'Late Arrivals Today', value: '12', sub: 'Delayed Logins Today', delta: '-16%', up: false, icon: Clock },
  { label: 'Total Payroll Cost', value: '$2.4M', sub: 'Payroll Outflow', delta: '+16%', up: true, icon: DollarSign },
]

const ATTENDANCE_TREND = [
  { d: 'Mon', present: 620, late: 60, absent: 40 },
  { d: 'Tue', present: 680, late: 45, absent: 30 },
  { d: 'Wed', present: 640, late: 70, absent: 25 },
  { d: 'Thu', present: 700, late: 40, absent: 20 },
  { d: 'Fri', present: 660, late: 55, absent: 35 },
  { d: 'Sat', present: 500, late: 30, absent: 60 },
  { d: 'Sun', present: 300, late: 20, absent: 90 },
]

const DISTRIBUTION = [
  { name: 'Sales', value: 40, color: '#f97316' },
  { name: 'React', value: 35, color: '#0d9488' },
  { name: 'Front End', value: 20, color: '#3b82f6' },
  { name: 'UI', value: 10, color: '#a855f7' },
]

const LATE_ARRIVALS = [
  { name: 'Jessica Brown', role: 'Customer Support', time: '10:15 AM', late: '+45 Min' },
  { name: 'Amanda Lewis', role: 'HR Admin', time: '10:25 AM', late: '+55 Min' },
  { name: 'James Clark', role: 'Sales', time: '10:00 AM', late: '+30 Min' },
  { name: 'Amanda Davis', role: 'Administration', time: '09:40 AM', late: '+20 Min' },
  { name: 'Lisa Anderson', role: 'Finance', time: '09:35 AM', late: '+05 Min' },
]

const FUNNEL = [
  { stage: 'Applications', pct: 40, count: 57, color: '#f97316' },
  { stage: 'Screening', pct: 20, count: 36, color: '#3b82f6' },
  { stage: 'Interview', pct: 23, count: 64, color: '#a855f7' },
  { stage: 'Hired', pct: 17, count: 18, color: '#10b981' },
]

const INTERVIEWS = [
  { title: 'UI/UX Design Interview', time: '12:00 PM - 01:50 PM', extra: '+9' },
  { title: 'Senior Developer React', time: '03:00 PM - 04:00 PM', extra: '+4' },
]

const APPROVALS = [
  { name: 'Hendrita Merkel', range: 'Jan 10 - Jan 16', days: '4 days', reason: 'Family trip' },
  { name: 'Michael Brown', range: 'Jan 3 - Jan 9', days: '2 days', reason: 'Medical appointment' },
  { name: 'Daniel Martinez', range: 'Jan 17 - Jan 23', days: '2 days', reason: 'Personal Work' },
]

export function HRDashboardPage() {
  const { data } = useEmployees({ page: 1, size: 100 })
  const items = data?.items ?? []

  // Real: employee status & type
  const fullTime = items.filter((e) => e.employment_type === 'full_time').length
  const contract = items.filter((e) => e.employment_type === 'contract').length
  const probation = items.filter((e) => e.status === 'probation').length
  const statusData = [
    { name: 'Full-Time', value: fullTime || 1054, color: '#f97316' },
    { name: 'Contract', value: contract || 568, color: '#0d9488' },
    { name: 'Probation', value: probation || 80, color: '#3b82f6' },
  ]
  const statusTotal = statusData.reduce((a, s) => a + s.value, 0)

  return (
    <div>
      <PageHeader
        title="HR Dashboard"
        breadcrumb={['Dashboard', 'HR Dashboard']}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="size-4" /> Yearly Report
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> Add New
            </Button>
          </>
        }
      />

      {/* Status & Type + Leave Types + Overview */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Employee Status & Type" action={<span className="text-sm text-primary">View All</span>}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={2}>
                  {statusData.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{statusTotal.toLocaleString()}</span>
              <span className="text-[11px] text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {statusData.map((s) => (
              <div key={s.name}>
                <div className="text-lg font-bold">{s.value.toLocaleString()}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.name}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Leave Type Distribution" action={<Badge variant="secondary">Monthly</Badge>}>
          <div className="space-y-4">
            {LEAVE_TYPES.map((l) => (
              <div key={l.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{l.name}</span>
                  <span className="font-medium">{l.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${l.value}%`, background: l.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Overview Statistics" action={<Badge variant="secondary">Monthly</Badge>}>
          <div className="grid grid-cols-2 gap-4">
            {OVERVIEW.map((o) => (
              <div key={o.label} className="rounded-lg border p-3">
                <div className="mb-1.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <o.icon className="size-4" />
                </div>
                <div className="text-lg font-bold">{o.value}</div>
                <div className="text-xs text-muted-foreground">{o.label}</div>
                <div className={`mt-1 flex items-center gap-1 text-xs ${o.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {o.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} {o.delta}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Attendance trend + Distribution */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Attendance Trend" action={<Badge variant="secondary">Weekly</Badge>} className="lg:col-span-2">
          <div className="mb-3 flex gap-6 text-sm">
            <span><b className="text-lg">82</b> <span className="text-muted-foreground">On-Time</span></span>
            <span><b className="text-lg">11</b> <span className="text-muted-foreground">Late</span></span>
            <span><b className="text-lg">6</b> <span className="text-muted-foreground">Absent</span></span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ATTENDANCE_TREND}>
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend />
              <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" barSize={22} radius={[0, 0, 0, 0]} />
              <Bar dataKey="late" name="Late" stackId="a" fill="#f59e0b" barSize={22} />
              <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" barSize={22} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-3 gap-4 border-t pt-3 text-center">
            <div><div className="text-lg font-bold">8.4 hrs</div><div className="text-xs text-muted-foreground">Max Working Hours</div></div>
            <div><div className="text-lg font-bold">12</div><div className="text-xs text-muted-foreground">Missed Punches</div></div>
            <div><div className="text-lg font-bold">97.2%</div><div className="text-xs text-muted-foreground">Weekly Avg</div></div>
          </div>
        </Panel>

        <Panel title="Top Employee Distribution" action={<span className="text-sm text-primary">View All</span>}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={DISTRIBUTION} dataKey="value" outerRadius={85} label>
                {DISTRIBUTION.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DISTRIBUTION.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Late arrivals + Recruitment + Interviews */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Late Arrivals Today" action={<Badge variant="secondary">Today</Badge>}>
          <ul className="space-y-3">
            {LATE_ARRIVALS.map((a) => (
              <li key={a.name} className="flex items-center gap-3">
                <Avatar name={a.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{a.time}</div>
                  <Badge variant="destructive">{a.late}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recruitment Statistics" action={<Badge variant="secondary">Weekly</Badge>}>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-lg font-bold">487</div><div className="text-xs text-muted-foreground">Applicants</div></div>
            <div><div className="text-lg font-bold">24</div><div className="text-xs text-muted-foreground">Hired</div></div>
            <div><div className="text-lg font-bold">28 days</div><div className="text-xs text-muted-foreground">Avg Time</div></div>
          </div>
          <div className="space-y-2.5">
            {FUNNEL.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{f.stage}</span>
                  <span className="text-muted-foreground">{f.pct}% · {f.count} Employees</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-2 border-t pt-3 text-sm">
            <GraduationCap className="size-4 text-primary" />
            <span className="text-muted-foreground">Employees in Training</span>
            <span className="ml-auto font-bold">80</span>
          </div>
        </Panel>

        <Panel title="Upcoming Interview" action={<Badge variant="secondary">Today</Badge>}>
          <div className="space-y-3">
            {INTERVIEWS.map((iv) => (
              <div key={iv.title} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{iv.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{iv.time}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Calendar className="size-3.5" /> Add to Calendar
                  </Button>
                  <Button size="sm" className="gap-1.5">
                    <Video className="size-3.5" /> Join Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Payroll + Top employees + Approvals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Payroll Summary" action={<Badge variant="secondary">Monthly</Badge>}>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Benefits Deductions</div>
              <div className="text-2xl font-bold">$56K</div>
              <div className="text-xs text-muted-foreground">Insurance + 401(k)</div>
            </div>
            <div className="rounded-lg border bg-primary/5 p-4">
              <div className="text-sm text-muted-foreground">Total Payroll</div>
              <div className="text-2xl font-bold">$2.4M</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="size-3" /> +55% Increased
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Top Employees"
          action={
            <div className="flex gap-1 text-xs">
              {['1D', '7D', '1M', '1Y'].map((t, i) => (
                <span key={t} className={`rounded px-1.5 py-0.5 ${i === 2 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>{t}</span>
              ))}
            </div>
          }
        >
          <ul className="space-y-3">
            {items.slice(0, 5).map((e, i) => {
              const n = `${e.first_name} ${e.last_name}`
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-4 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  <Avatar name={n} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{n}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.job_title}</div>
                  </div>
                  <Badge variant="success">{95 - i * 4}%</Badge>
                </li>
              )
            })}
            {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>}
          </ul>
        </Panel>

        <Panel title="Pending Approvals" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3">
            {APPROVALS.map((a) => (
              <li key={a.name} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={a.name} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.range} · {a.days}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Reason: {a.reason}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="h-7 gap-1">
                    <Check className="size-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1">
                    <X className="size-3.5" /> Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
