import { Sparkles } from 'lucide-react'

import { Panel } from '@/components/ui/panel'

// Scoped stub. Predictive analytics (e.g. attrition-risk scoring, hiring
// forecasts) needs a modelling approach and enough historical data to be
// meaningful — deliberately left as a placeholder rather than faked.
export function PredictivePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Predictive analytics</h1>
        <p className="text-sm text-muted-foreground">
          Forecasting and risk scoring across people data.
        </p>
      </div>

      <Panel title="Coming soon">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            This will surface data-driven forecasts — attrition risk, expected
            time-to-fill, and hiring throughput — once there's enough historical
            data to model reliably. For now, the recruiting analytics and
            attrition views cover the current, factual picture.
          </p>
        </div>
      </Panel>
    </div>
  )
}

export default PredictivePage
