import {
  Briefcase,
  Cake,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronUp,
  ClipboardList,
  DollarSign,
  Download,
  ListChecks,
  MapPin,
  PlusCircle,
  TrendingUp,
  UserPlus,
  Users,
  Video,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { Card, CardContent } from '@/components/ui/card'
import { Panel } from '@/components/ui/panel'
import { useCurrentUser } from '@/features/auth/hooks'
import { useEmployees } from '@/features/employees/hooks'

/* ------------------------------ shared bits ------------------------------ */

const ICON_TONES = {
  orange: 'bg-primary text-primary-foreground',
  teal: 'bg-teal-600 text-white',
  blue: 'bg-blue-500 text-white',
  pink: 'bg-pink-500 text-white',
  purple: 'bg-purple-500 text-white',
  red: 'bg-red-500 text-white',
  green: 'bg-emerald-500 text-white',
  dark: 'bg-slate-800 text-white',
}

const money = (n) => `$${n.toLocaleString()}`

function StatCard({ icon: Icon, tone, label, value, link = 'View All' }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`mb-4 flex size-11 items-center justify-center rounded-full ${ICON_TONES[tone]}`}>
          <Icon className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-3 border-t pt-2 text-sm text-primary">{link}</p>
      </CardContent>
    </Card>
  )
}

/* ------------------------------ placeholder data ------------------------------ */

const ATTENDANCE = [
  { name: 'Present', value: 59, color: '#10b981' },
  { name: 'Late', value: 21, color: '#f59e0b' },
  { name: 'Permission', value: 2, color: '#3b82f6' },
  { name: 'Absent', value: 15, color: '#ef4444' },
]

const STATUS_SEGMENTS = [
  { key: 'full_time', label: 'Fulltime', color: '#f59e0b' },
  { key: 'contract', label: 'Contract', color: '#0d9488' },
  { key: 'part_time', label: 'WFH', color: '#ec4899' },
  { key: 'intern', label: 'Intern', color: '#64748b' },
]

const SALES = [
  { m: 'Jan', income: 60, expenses: 40 },
  { m: 'Feb', income: 75, expenses: 55 },
  { m: 'Mar', income: 50, expenses: 70 },
  { m: 'Apr', income: 90, expenses: 45 },
  { m: 'May', income: 65, expenses: 60 },
  { m: 'Jun', income: 85, expenses: 50 },
  { m: 'Jul', income: 70, expenses: 65 },
  { m: 'Aug', income: 100, expenses: 55 },
  { m: 'Sep', income: 80, expenses: 70 },
  { m: 'Oct', income: 95, expenses: 60 },
  { m: 'Nov', income: 78, expenses: 68 },
  { m: 'Dec', income: 88, expenses: 72 },
]

const TASK_STATS = [
  { name: 'Ongoing', value: 40, color: '#f59e0b' },
  { name: 'On Hold', value: 10, color: '#3b82f6' },
  { name: 'Overdue', value: 16, color: '#ef4444' },
  { name: 'Completed', value: 34, color: '#10b981' },
]

const APPLICANTS = [
  { name: 'Brian Villalobos', role: 'UI/UX Designer', exp: '5+ Years', loc: 'USA' },
  { name: 'Anthony Lewis', role: 'Python Developer', exp: '4+ Years', loc: 'USA' },
  { name: 'Stephan Peralt', role: 'Android Developer', exp: '6+ Years', loc: 'USA' },
  { name: 'Doglas Martini', role: 'React Developer', exp: '2+ Years', loc: 'USA' },
]

const TODOS = [
  { text: 'Add Holidays', done: true },
  { text: 'Add Meeting to Client', done: false },
  { text: 'Chat with Adrian', done: false },
  { text: 'Management Call', done: true },
  { text: 'Add Payroll', done: false },
  { text: 'Add Policy for Increment', done: false },
]

const INVOICES = [
  { title: 'Redesign Website', id: '#INV002', org: 'Logistics', amt: 3560, paid: false },
  { title: 'Module Completion', id: '#INV005', org: 'Yip Corp', amt: 4175, paid: false },
  { title: 'Change on Emp Module', id: '#INV003', org: 'Ignis LLP', amt: 6985, paid: false },
  { title: 'Hospital Management', id: '#INV006', org: 'HCL Corp', amt: 6458, paid: true },
]

const PROJECTS = [
  { id: 'PRO-001', name: 'Office Management App', hrs: '15/255', priority: 'High' },
  { id: 'PRO-002', name: 'Clinic Management', hrs: '15/255', priority: 'Low' },
  { id: 'PRO-003', name: 'Educational Platform', hrs: '40/255', priority: 'Medium' },
  { id: 'PRO-004', name: 'Chat & Call Mobile App', hrs: '35/155', priority: 'High' },
  { id: 'PRO-005', name: 'Travel Planning Website', hrs: '50/235', priority: 'Medium' },
]

const SCHEDULES = [
  { role: 'UI/UX Designer', title: 'Interview Candidates - UI/UX Designer', date: 'Thu, 15 Feb 2025', time: '01:00 PM - 02:20 PM' },
  { role: 'IOS Developer', title: 'Interview Candidates - IOS Developer', date: 'Thu, 15 Feb 2025', time: '02:00 PM - 04:20 PM' },
]

const ACTIVITIES = [
  { name: 'Matt Morgan', time: '05:30 PM', text: 'Added New Project HRMS Dashboard' },
  { name: 'Jay Ze', time: '05:00 PM', text: 'Commented on Uploaded Document' },
  { name: 'Mary Donald', time: '05:30 PM', text: 'Approved Task Projects' },
  { name: 'George David', time: '06:00 PM', text: 'Requesting Access to Module Tickets' },
  { name: 'Hendry Daniel', time: '05:30 PM', text: 'Completed New Project HMS' },
]

const priorityVariant = { High: 'destructive', Medium: 'warning', Low: 'success' }

/* --------------------------------- page --------------------------------- */

export function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useEmployees({ page: 1, size: 100 })
  const items = data?.items ?? []
  const total = data?.total ?? 0

  const thisYear = new Date().getFullYear()
  const newHires = items.filter((e) => e.date_of_joining?.slice(0, 4) === String(thisYear)).length

  // Real: employees by department
  const deptCounts = {}
  items.forEach((e) => {
    const d = e.department || 'Unassigned'
    deptCounts[d] = (deptCounts[d] || 0) + 1
  })
  const deptData = Object.entries(deptCounts)
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  // Real: employment-type distribution
  const typeCounts = STATUS_SEGMENTS.map((s) => ({
    ...s,
    count: items.filter((e) => e.employment_type === s.key).length,
  }))
  const typeTotal = typeCounts.reduce((a, s) => a + s.count, 0) || 1

  const topPerformer = items[0]
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  const stats = [
    { icon: ClipboardList, tone: 'orange', label: 'Attendance Overview', value: '120/154', link: 'View Details' },
    { icon: Briefcase, tone: 'teal', label: "Total No of Project's", value: '90/125' },
    { icon: Users, tone: 'blue', label: 'Total No of Clients', value: '69/86' },
    { icon: ListChecks, tone: 'pink', label: 'Total No of Tasks', value: '96/100' },
    { icon: DollarSign, tone: 'purple', label: 'Earnings', value: money(21445) },
    { icon: TrendingUp, tone: 'red', label: 'Profit This Week', value: money(5544) },
    { icon: UserPlus, tone: 'green', label: 'Job Applicants', value: '98' },
    { icon: CalendarClock, tone: 'dark', label: 'New Hire', value: `${newHires}/${total}` },
  ]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        breadcrumb={['Dashboard', 'Admin Dashboard']}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-4" /> Export
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarDays className="size-4" /> Aug {thisYear}
            </Button>
            <Button variant="outline" size="icon" className="size-9">
              <ChevronUp className="size-4" />
            </Button>
          </>
        }
      />

      {/* Welcome banner */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar name={user?.full_name ?? 'Admin'} size="lg" />
            <div>
              <h2 className="text-lg font-semibold">Welcome Back, {firstName}</h2>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-medium text-primary">21</span> Pending Approvals &{' '}
                <span className="font-medium text-primary">14</span> Leave Requests
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarDays className="size-4" /> Add Schedule
            </Button>
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="size-4" /> Add Requests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Department + Attendance */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Employees by Department" action={<Badge variant="secondary">This Week</Badge>} className="lg:col-span-2">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="dept" tickLine={false} axisLine={false} width={90} fontSize={12} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-muted-foreground">
                No of Employees increased by <span className="font-medium text-emerald-600">+20%</span> from last Week
              </p>
            </>
          )}
        </Panel>

        <Panel title="Attendance Overview" action={<Badge variant="secondary">Today</Badge>}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={ATTENDANCE} dataKey="value" innerRadius={60} outerRadius={85} startAngle={90} endAngle={-270} paddingAngle={2}>
                  {ATTENDANCE.map((a) => (
                    <Cell key={a.name} fill={a.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">120</span>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {ATTENDANCE.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: a.color }} /> {a.name}
                </span>
                <span className="font-medium">{a.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Employee status (+ top performer) + Clock-in */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Employee Status" action={<Badge variant="secondary">This Week</Badge>} className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Employee</span>
            <span className="text-xl font-bold">{total}</span>
          </div>
          <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
            {typeCounts.map((s) => (
              <div key={s.key} style={{ width: `${(s.count / typeTotal) * 100}%`, background: s.color }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {typeCounts.map((s) => (
              <div key={s.key}>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
                </span>
                <span className="text-2xl font-bold">{String(s.count).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
          {topPerformer && (
            <div className="mt-5 rounded-lg border bg-primary/5 p-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Top Performer</p>
              <div className="flex items-center gap-3">
                <Avatar name={`${topPerformer.first_name} ${topPerformer.last_name}`} />
                <div className="flex-1">
                  <div className="font-medium">{topPerformer.first_name} {topPerformer.last_name}</div>
                  <div className="text-xs text-muted-foreground">{topPerformer.job_title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Performance</div>
                  <div className="font-bold text-primary">99%</div>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Clock-In/Out" action={<Badge variant="secondary">Today</Badge>}>
          <ul className="space-y-3">
            {items.slice(0, 4).map((e, i) => {
              const name = `${e.first_name} ${e.last_name}`
              const times = ['09:15', '09:36', '09:15', '10:02']
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{name}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.job_title}</div>
                  </div>
                  <Badge variant="success">{times[i]}</Badge>
                </li>
              )
            })}
            {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>}
          </ul>
        </Panel>
      </div>

      {/* Applicants + Employees + Todo */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Jobs Applicants" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3">
            {APPLICANTS.map((a) => (
              <li key={a.name} className="flex items-center gap-3">
                <Avatar name={a.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.role}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Exp: {a.exp}</div>
                  <div className="flex items-center justify-end gap-0.5">
                    <MapPin className="size-3" /> {a.loc}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Employees" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3">
            {items.slice(0, 5).map((e) => {
              const name = `${e.first_name} ${e.last_name}`
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{name}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.job_title}</div>
                  </div>
                  <Badge variant="secondary">{e.department || '—'}</Badge>
                </li>
              )
            })}
            {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>}
          </ul>
        </Panel>

        <Panel title="Todo" action={<Badge variant="secondary">Today</Badge>}>
          <ul className="space-y-2.5">
            {TODOS.map((t) => (
              <li key={t.text} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className={t.done ? 'size-4 text-emerald-500' : 'size-4 text-muted-foreground/40'} />
                <span className={t.done ? 'text-muted-foreground line-through' : ''}>{t.text}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Sales overview + Invoices */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Sales Overview" action={<Badge variant="secondary">This Year</Badge>} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SALES}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={10} />
              <Bar dataKey="expenses" name="Expenses" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Invoices" action={<Badge variant="secondary">This Week</Badge>}>
          <ul className="space-y-3">
            {INVOICES.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{inv.title}</div>
                  <div className="text-xs text-muted-foreground">{inv.id} · {inv.org}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{money(inv.amt)}</div>
                  <Badge variant={inv.paid ? 'success' : 'warning'}>{inv.paid ? 'Paid' : 'Unpaid'}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Projects + Task statistics */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Projects" action={<Badge variant="secondary">September</Badge>} className="lg:col-span-2" bodyClass="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">ID</th>
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">Hours</th>
                <th className="px-5 py-2.5 text-left font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-5 py-2.5 text-primary">{p.id}</td>
                  <td className="px-5 py-2.5 font-medium">{p.name}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{p.hrs} Hrs</td>
                  <td className="px-5 py-2.5">
                    <Badge variant={priorityVariant[p.priority]}>{p.priority}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Task Statistics" action={<Badge variant="secondary">This Week</Badge>}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={TASK_STATS} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {TASK_STATS.map((t) => (
                    <Cell key={t.name} fill={t.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-xl font-bold">124/165</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {TASK_STATS.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: t.color }} /> {t.name}
                </span>
                <span className="font-medium">{t.value}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t pt-3 text-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">389/689 hrs</span> spent this week
          </p>
        </Panel>
      </div>

      {/* Schedules + Activities + Birthdays */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Schedules" action={<span className="text-sm text-primary">View All</span>}>
          <div className="space-y-3">
            {SCHEDULES.map((s) => (
              <div key={s.title} className="rounded-lg border p-3">
                <Badge variant="secondary" className="mb-2">{s.role}</Badge>
                <div className="text-sm font-medium">{s.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.date} · {s.time}</div>
                <Button size="sm" variant="outline" className="mt-2 gap-1.5">
                  <Video className="size-3.5" /> Join Meeting
                </Button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Activities" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3.5">
            {ACTIVITIES.map((a) => (
              <li key={a.name} className="flex items-start gap-3">
                <Avatar name={a.name} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Birthdays" action={<span className="text-sm text-primary">View All</span>}>
          <ul className="space-y-3">
            {items.slice(0, 3).map((e) => {
              const name = `${e.first_name} ${e.last_name}`
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{name}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.job_title}</div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Cake className="size-3.5" /> Send
                  </Button>
                </li>
              )
            })}
            {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No employees yet.</p>}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
