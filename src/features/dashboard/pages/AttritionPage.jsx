import { CalendarClock, LogOut, TrendingDown, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Panel } from '@/components/ui/panel'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { useAttrition } from '@/features/dashboard/hooks'

export function AttritionPage() {
  const { data, isLoading } = useAttrition(12)

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading attrition…</div>
  }

  const hasData = data.headcount > 0 || data.left > 0

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Employee attrition</h1>
        <p className="text-sm text-muted-foreground">
          Headcount, turnover, and tenure across your workforce.
        </p>
      </div>

      {!hasData ? (
        <Panel title="No employee data yet">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add employees under the People section to see attrition analytics here.
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} tone="blue" label="Active headcount" value={data.headcount} />
            <StatCard icon={LogOut} tone="amber" label="Left" value={data.left} />
            <StatCard
              icon={TrendingDown}
              tone="orange"
              label="Turnover rate"
              value={`${data.turnover_rate}%`}
            />
            <StatCard
              icon={CalendarClock}
              tone="emerald"
              label="Avg tenure"
              value={data.avg_tenure_years != null ? `${data.avg_tenure_years}y` : '—'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Leavers over time">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.leavers_trend} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    width={28}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Headcount vs leavers by department">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.by_department} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    width={28}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="active" name="Active" fill="var(--info)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="left" name="Left" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <p className="text-xs text-muted-foreground">{data.note}</p>
        </>
      )}
    </div>
  )
}

export default AttritionPage
