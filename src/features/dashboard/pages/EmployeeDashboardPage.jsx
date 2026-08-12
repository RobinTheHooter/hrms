import {
  Bell,
  Building2,
  Cake,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Mail,
  Phone,
  Play,
  Plus,
  X,
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import { useCurrentUser } from '@/features/auth/hooks'
import { useEmployees } from '@/features/employees/hooks'

const ATTENDANCE = [
  { name: 'On time', value: 1254, color: '#10b981' },
  { name: 'Late', value: 32, color: '#f59e0b' },
  { name: 'Work From Home', value: 658, color: '#3b82f6' },
  { name: 'Absent', value: 14, color: '#ef4444' },
  { name: 'Sick Leave', value: 68, color: '#a855f7' },
]

const HOUR_STATS = [
  { label: 'Total Hours Today', value: '8.36 / 9', delta: '5% This Week' },
  { label: 'Total Hours Week', value: '10 / 40', delta: '7% Last Week' },
  { label: 'Total Hours Month', value: '75 / 98', delta: '8% Last Month' },
  { label: 'Overtime this Month', value: '16 / 28', delta: '6% Last Month' },
]

const TASKS = [
  { text: 'Patient appointment booking', status: 'On Hold', variant: 'warning' },
  { text: 'Appointment booking with payment', status: 'In Progress', variant: 'info' },
  { text: 'Patient and Doctor video conferencing', status: 'Completed', variant: 'success' },
  { text: 'Private chat module', status: 'Pending', variant: 'secondary' },
  { text: 'Go-Live and Post-Implementation Support', status: 'In Progress', variant: 'info' },
]

const SKILLS = [
  { name: 'Figma', value: 95, date: '15 May 2025' },
  { name: 'HTML', value: 85, date: '12 May 2025' },
  { name: 'CSS', value: 70, date: '12 May 2025' },
  { name: 'Wordpress', value: 61, date: '15 May 2025' },
  { name: 'Javascript', value: 58, date: '13 May 2025' },
]

const PERFORMANCE = [
  { m: 'Jan', v: 40 },
  { m: 'Feb', v: 48 },
  { m: 'Mar', v: 42 },
  { m: 'Apr', v: 55 },
  { m: 'May', v: 50 },
  { m: 'Jun', v: 60 },
  { m: 'Jul', v: 58 },
]

const NOTIFICATIONS = [
  { text: 'Lex Murphy requested access to UNIX', time: 'Today at 9:42 AM', file: 'EY_review.pdf' },
  { text: 'Lex Murphy requested access to UNIX', time: 'Today at 10:00 AM' },
  { text: 'Lex Murphy requested access to UNIX', time: 'Today at 10:50 AM', actions: true },
  { text: 'Lex Murphy requested access to UNIX', time: 'Today at 12:00 PM' },
]

const MEETINGS = [
  { time: '09:25 AM', title: 'Marketing Strategy Presentation', tag: 'Marketing' },
  { time: '09:20 AM', title: 'Design Review - Hospital Management', tag: 'Review' },
  { time: '09:18 AM', title: 'Birthday Celebration of Employee', tag: 'Celebration' },
  { time: '09:10 AM', title: 'Update of Project Flow', tag: 'Development' },
]

const LEAVE = [
  { label: 'Total Leaves', value: 16 },
  { label: 'Taken', value: 10 },
  { label: 'Absent', value: 2 },
  { label: 'Request', value: 0 },
  { label: 'Worked Days', value: 240 },
  { label: 'Loss of Pay', value: 2 },
]

export function EmployeeDashboardPage() {
  const { data: user } = useCurrentUser()
  const { data } = useEmployees({ page: 1, size: 100 })
  const items = data?.items ?? []

  const name = user?.full_name ?? 'Employee'
  const team = items.slice(0, 6)
  const birthday = items[0]

  return (
    <div>
      <PageHeader
        title="Employee Dashboard"
        breadcrumb={['Dashboard', 'Employee Dashboard']}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-4" /> Export
          </Button>
        }
      />

      {/* Approval banner */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="size-4 shrink-0" />
        Your Leave Request on “24th April 2026” has been Approved!
      </div>

      {/* Profile + attendance donut */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={name} size="lg" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{name}</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {user?.role ?? 'Employee'}
                </p>
              </div>
              <Button size="sm" variant="outline">Edit Profile</Button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Phone Number</div>
                  <div className="text-sm font-medium">+1 324 3453 545</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Email Address</div>
                  <div className="truncate text-sm font-medium">{user?.email ?? '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Report Office</div>
                  <div className="text-sm font-medium">Doglas Martini</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Panel title="Attendance" action={<Badge variant="secondary">2026</Badge>}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={ATTENDANCE} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={2}>
                  {ATTENDANCE.map((a) => (
                    <Cell key={a.name} fill={a.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">85%</span>
              <span className="text-[11px] text-muted-foreground">Better than</span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {ATTENDANCE.map((a) => (
              <div key={a.name} className="flex items-center gap-1.5 text-xs">
                <span className="size-2 rounded-full" style={{ background: a.color }} />
                <span className="text-muted-foreground">{a.name}</span>
                <span className="ml-auto font-medium">{a.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Leave details + punch + hours */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Leave Details"
          action={<Badge variant="secondary">2026</Badge>}
        >
          <div className="grid grid-cols-3 gap-4">
            {LEAVE.map((l) => (
              <div key={l.label}>
                <div className="text-xl font-bold">{l.value}</div>
                <div className="text-xs text-muted-foreground">{l.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-5">
            <Button className="w-full gap-1.5">
              <Plus className="size-4" /> Apply New Leave
            </Button>
          </div>
        </Panel>

        <Panel title="Attendance" action={<span className="text-xs text-muted-foreground">11 Mar 2025</span>}>
          <div className="flex flex-1 flex-col items-center">
            <div className="flex size-36 flex-col items-center justify-center rounded-full border-8 border-primary/15">
              <span className="text-xs text-muted-foreground">Total Hours</span>
              <span className="text-xl font-bold">5:45:32</span>
              <span className="text-[11px] text-muted-foreground">Production 3.45 hrs</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Punch In at 10:00 AM</p>
            <Button className="mt-auto w-full gap-1.5">
              <Play className="size-4" /> Punch Out
            </Button>
          </div>
        </Panel>

        <Panel title="Working Hours" action={<Badge variant="secondary">Today</Badge>}>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Productive Hours</span>
              <span className="font-medium">08h 36m</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Break hours</span>
              <span className="font-medium">22m 15s</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Overtime</span>
              <span className="font-medium">02h 15m</span>
            </li>
            <li className="flex justify-between border-t pt-3">
              <span className="text-muted-foreground">Total Working hours</span>
              <span className="font-semibold">12h 36m</span>
            </li>
          </ul>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="bg-emerald-500" style={{ width: '68%' }} />
            <div className="bg-amber-400" style={{ width: '12%' }} />
            <div className="bg-primary" style={{ width: '20%' }} />
          </div>
        </Panel>
      </div>

      {/* Hour stat cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HOUR_STATS.map((h) => (
          <Card key={h.label}>
            <CardContent className="p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="size-5" />
              </div>
              <div className="text-2xl font-bold">{h.value}</div>
              <div className="text-sm text-muted-foreground">{h.label}</div>
              <div className="mt-2 text-xs text-emerald-600">{h.delta}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects + Tasks */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Projects" action={<Badge variant="secondary">Ongoing</Badge>} className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="font-medium">Office Management</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar name="Anthony Lewis" size="sm" />
                  <div>
                    <div className="text-foreground">Anthony Lewis</div>
                    <div className="text-xs">Project Leader</div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium">14 Jan 2024</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Tasks</span>
                  <span className="font-medium">6 / 10</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Spent</span>
                  <span className="font-medium">65 / 120 Hrs</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Tasks" action={<Badge variant="secondary">All Projects</Badge>}>
          <ul className="space-y-3">
            {TASKS.map((t) => (
              <li key={t.text} className="flex items-center justify-between gap-2">
                <span className="text-sm">{t.text}</span>
                <Badge variant={t.variant}>{t.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Performance + Skills */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Performance"
          action={<span className="text-sm font-semibold text-emerald-600">98% ↑</span>}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={PERFORMANCE}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="My Skills" action={<Badge variant="secondary">2026</Badge>}>
          <div className="space-y-4">
            {SKILLS.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.value}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">Updated: {s.date}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Team members + Notifications + Meetings */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Team Members" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3">
            {team.map((e) => {
              const n = `${e.first_name} ${e.last_name}`
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={n} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{n}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.job_title}</div>
                  </div>
                </li>
              )
            })}
            {team.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No teammates yet.</p>}
          </ul>
        </Panel>

        <Panel title="Notifications" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3.5">
            {NOTIFICATIONS.map((n, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-muted-foreground">{n.time}</p>
                  {n.file && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs text-muted-foreground">
                      <FileText className="size-3" /> {n.file}
                    </span>
                  )}
                  {n.actions && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" className="h-7 gap-1">
                        <Check className="size-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1">
                        <X className="size-3.5" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Meetings Schedule" action={<Badge variant="secondary">Today</Badge>}>
          <ul className="space-y-3.5">
            {MEETINGS.map((m) => (
              <li key={m.title} className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-medium text-primary">{m.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.title}</p>
                  <Badge variant="secondary" className="mt-1">{m.tag}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Birthday + Leave policy + Holiday */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Team Birthday">
          {birthday ? (
            <div className="flex items-center gap-3">
              <Avatar name={`${birthday.first_name} ${birthday.last_name}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{birthday.first_name} {birthday.last_name}</div>
                <div className="text-xs text-muted-foreground">{birthday.job_title}</div>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Cake className="size-3.5" /> Send Wishes
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming birthdays.</p>
          )}
        </Panel>

        <Panel title="Leave Policy" action={<span className="text-sm text-primary">View All</span>}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="size-5" />
            </span>
            <div>
              <div className="text-sm font-medium">Company Leave Policy</div>
              <div className="text-xs text-muted-foreground">Last Updated: Today</div>
            </div>
          </div>
        </Panel>

        <Panel title="Next Holiday" action={<span className="text-sm text-primary">View All</span>}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </span>
            <div>
              <div className="text-sm font-medium">Diwali</div>
              <div className="text-xs text-muted-foreground">15 Sep 2026</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
