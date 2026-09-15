import { Copy, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { useScreeningInsights } from '@/features/ai/hooks'
import { listCandidates } from '@/features/candidates/api'
import { errorMessage } from '@/lib/api-error'

function InsightList({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ScreeningInsightsPanel() {
  const insights = useScreeningInsights()
  const [candidateId, setCandidateId] = useState('')
  const [result, setResult] = useState(null)

  // Screened candidates (have an AI fit score) for the picker.
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', 'screened-for-ai'],
    queryFn: ({ signal }) =>
      listCandidates({ size: 100, min_score: 1, sort: '-ai_score' }, signal),
  })

  const options = useMemo(
    () =>
      (data?.items ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.full_name}${c.ai_score != null ? ` · ${c.ai_score}%` : ''}`,
      })),
    [data],
  )

  const onGenerate = () => {
    if (!candidateId) {
      toast.error('Pick a candidate first')
      return
    }
    insights.mutate(
      { candidate_id: Number(candidateId) },
      {
        onSuccess: (res) => setResult(res),
        onError: (e) => toast.error(errorMessage(e, "Couldn't generate insights. Please try again.")),
      },
    )
  }

  const copyQuestions = async () => {
    if (!result) return
    const text = (result?.follow_up_questions ?? [])
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Follow-up questions copied')
    } catch {
      toast.error('Copy failed — please copy manually.')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick a screened candidate to see why they scored the way they did, their
        strengths and gaps, and targeted follow-up questions for the interview.
      </p>

      <div>
        <Label className="mb-1">Candidate</Label>
        <Combobox
          value={candidateId}
          onValueChange={setCandidateId}
          options={options}
          placeholder={isLoading ? 'Loading…' : 'Select a screened candidate'}
          searchPlaceholder="Search candidates…"
          emptyText={isLoading ? 'Loading…' : 'No screened candidates yet'}
        />
      </div>

      <Button onClick={onGenerate} disabled={insights.isPending || !candidateId}>
        <Sparkles className="size-4" />
        {insights.isPending ? 'Analysing…' : result ? 'Regenerate' : 'Generate insights'}
      </Button>

      {result && (
        <div className="space-y-5 border-t pt-4">
          {result.rationale && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why this score
              </div>
              <p className="text-sm">{result.rationale}</p>
            </div>
          )}
          <InsightList title="Strengths" items={result.strengths} />
          <InsightList title="Gaps to verify" items={result.gaps} />
          <InsightList title="Suggested follow-up questions" items={result.follow_up_questions} />
          {result.follow_up_questions?.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={copyQuestions}>
                <Copy className="size-4" /> Copy questions
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
