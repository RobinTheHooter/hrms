import { CheckCircle2, Clock, Download, Percent, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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

import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { downloadMisReport, useRecruitingAnalytics } from '@/features/dashboard/hooks'

const cap = (s) =>
  String(s ?? '')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

const STAGE_COLOR = 'var(--primary)'
const OUTCOME_COLORS = {
  selected: 'var(--success)',
  rejected: 'var(--destructive)',
  pending: 'var(--warning)',
}
const STATUS_COLORS = ['var(--muted-foreground)', 'var(--info)', 'var(--success)', 'var(--destructive)', 'var(--warning)']

export function AnalyticsPage() {
  const { data, isLoading } = useRecruitingAnalytics()
  const [exporting, setExporting] = useState(false)

  const exportReport = async () => {
    setExporting(true)
    try {
      await downloadMisReport()
    } catch {
      toast.error('Could not generate the MIS report')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading analytics…</div>
  }

  const { funnel, time_to_hire, offer_acceptance, source_effectiveness, interview_outcomes } = data

  const funnelData = funnel.stages.map((s) => ({ ...s, label: cap(s.stage) }))
  const outcomeData = interview_outcomes.by_outcome
    .filter((o) => o.count > 0)
    .map((o) => ({ ...o, label: cap(o.outcome) }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Recruiting analytics</h1>
          <p className="text-sm text-muted-foreground">
            Funnel, speed, and effectiveness across your live hiring pipeline.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportReport} disabled={exporting}>
          <Download className="size-4" />
          {exporting ? 'Preparing…' : 'Export MIS report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          tone="emerald"
          label="Overall conversion"
          value={`${funnel.overall_conversion}%`}
        />
        <StatCard
          icon={Clock}
          tone="blue"
          label="Avg time to hire"
          value={time_to_hire.avg_days != null ? `${time_to_hire.avg_days}d` : '—'}
        />
        <StatCard
          icon={Percent}
          tone="orange"
          label="Offer acceptance"
          value={
            offer_acceptance.acceptance_rate != null
              ? `${offer_acceptance.acceptance_rate}%`
              : '—'
          }
        />
        <StatCard
          icon={CheckCircle2}
          tone="amber"
          label="Interviews completed"
          value={interview_outcomes.completed}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Hiring funnel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 48 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={80}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                formatter={(v, _n, p) => [`${v} (${p.payload.pct_of_top}%)`, 'Reached']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count" fill={STAGE_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Candidates that reached each stage (assumes forward progress; {funnel.rejected} rejected excluded).
          </p>
        </Panel>

        <Panel title="Interview outcomes">
          {outcomeData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No completed interviews yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={outcomeData} dataKey="count" nameKey="label" outerRadius={90} label>
                  {outcomeData.map((o) => (
                    <Cell key={o.outcome} fill={OUTCOME_COLORS[o.outcome] ?? 'var(--muted-foreground)'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="Source effectiveness">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 font-medium">Source</th>
                <th className="py-2 text-right font-medium">Candidates</th>
                <th className="py-2 text-right font-medium">Hired</th>
                <th className="py-2 text-right font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {source_effectiveness.map((s) => (
                <tr key={s.source} className="border-b last:border-b-0">
                  <td className="py-2">{cap(s.source)}</td>
                  <td className="py-2 text-right tabular-nums">{s.total}</td>
                  <td className="py-2 text-right tabular-nums">{s.hired}</td>
                  <td className="py-2 text-right tabular-nums">{s.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Offers">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {offer_acceptance.by_status.map((s, i) => (
            <div key={s.status} className="rounded-lg border p-3">
              <div className="text-2xl font-semibold tabular-nums" style={{ color: STATUS_COLORS[i % STATUS_COLORS.length] }}>
                {s.count}
              </div>
              <div className="text-xs text-muted-foreground">{cap(s.status)}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

export default AnalyticsPage
