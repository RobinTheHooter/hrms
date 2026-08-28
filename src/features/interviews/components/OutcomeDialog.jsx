import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  COMPETENCIES,
  RECOMMENDATIONS,
  Rating,
} from '@/features/interviews/components/scorecard'
import { cn } from '@/lib/utils'

const DECISIONS = [
  { value: 'join', label: 'Selected to join', tone: 'success' },
  { value: 'next_round', label: 'Next round', tone: 'info' },
  { value: 'on_hold', label: 'On hold', tone: 'warning' },
  { value: 'reject', label: 'Reject', tone: 'destructive' },
]

const TONE_ACTIVE = {
  success: 'border-success bg-success/12 text-success',
  info: 'border-info bg-info/12 text-info',
  warning: 'border-warning bg-warning/15 text-warning',
  destructive: 'border-destructive bg-destructive/12 text-destructive',
}

export function OutcomeDialog({ open, onOpenChange, interview, onSubmit, isSubmitting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview scorecard</DialogTitle>
          <DialogDescription>
            {interview?.candidate?.full_name} · {interview?.candidate?.job?.title}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ScorecardForm
            interview={interview}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// Mounted fresh each time the dialog opens, so state seeds from the interview
// via useState initializers — no reset effect needed.
function ScorecardForm({ interview, isSubmitting, onCancel, onSubmit }) {
  const fb = interview?.feedback ?? {}
  const initialDecision =
    fb.next_step ?? (interview?.outcome === 'rejected' ? 'reject' : '')
  const [decision, setDecision] = useState(initialDecision)
  const [recommendation, setRecommendation] = useState(fb.recommendation ?? '')
  const [ratings, setRatings] = useState(fb.ratings ?? {})
  const [strengths, setStrengths] = useState(fb.strengths ?? '')
  const [concerns, setConcerns] = useState(fb.concerns ?? '')
  const [joiningDate, setJoiningDate] = useState(fb.tentative_joining_date ?? '')
  const [estCtc, setEstCtc] = useState(fb.estimated_ctc != null ? String(fb.estimated_ctc) : '')
  const [note, setNote] = useState(fb.next_step_note ?? '')
  const [reason, setReason] = useState(interview?.notes ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    if (!decision) {
      setError('Pick a decision first.')
      return
    }
    if (decision === 'reject' && !reason.trim()) {
      setError('A reason is required when rejecting a candidate.')
      return
    }
    setError('')

    const outcome =
      decision === 'reject' ? 'rejected' : decision === 'on_hold' ? 'pending' : 'selected'

    const feedback = {
      recommendation: recommendation || null,
      ratings,
      strengths: strengths || null,
      concerns: concerns || null,
      next_step: decision === 'reject' ? null : decision,
      tentative_joining_date: decision === 'join' ? joiningDate || null : null,
      estimated_ctc: decision === 'join' && estCtc !== '' ? Number(estCtc) : null,
      next_step_note:
        decision === 'next_round' || decision === 'on_hold' ? note || null : null,
    }

    onSubmit({
      outcome,
      notes: decision === 'reject' ? reason : null,
      feedback,
    })
  }

  return (
    <>
      <div className="space-y-5">
        {/* Decision */}
        <div>
          <Label className="mb-1.5">Decision</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DECISIONS.map((d) => {
              const active = decision === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    setDecision(d.value)
                    if (error) setError('')
                  }}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                    active ? TONE_ACTIVE[d.tone] : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Decision-specific fields */}
        {decision === 'join' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1">Tentative joining date</Label>
              <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1">Estimated CTC</Label>
              <Input type="number" min="0" placeholder="1500000" value={estCtc} onChange={(e) => setEstCtc(e.target.value)} />
            </div>
          </div>
        )}
        {(decision === 'next_round' || decision === 'on_hold') && (
          <div>
            <Label className="mb-1">
              {decision === 'next_round' ? 'Next round details' : 'On-hold note'}
            </Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                decision === 'next_round'
                  ? 'Focus for the next round, panel, timing…'
                  : 'Why is this candidate on hold?'
              }
            />
          </div>
        )}
        {decision === 'reject' && (
          <div>
            <Label className="mb-1">
              Reason for rejection<span className="text-destructive"> *</span>
            </Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              placeholder="Why is this candidate being rejected?"
            />
          </div>
        )}

        {/* Recommendation */}
        <div>
          <Label className="mb-1.5">Overall recommendation</Label>
          <div className="grid grid-cols-4 gap-2">
            {RECOMMENDATIONS.map((r) => {
              const active = recommendation === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecommendation(active ? '' : r.value)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                    active && r.positive && 'border-success bg-success/12 text-success',
                    active && !r.positive && 'border-destructive bg-destructive/12 text-destructive',
                    !active && 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Ratings */}
        <div>
          <Label className="mb-1.5">Ratings</Label>
          <div className="space-y-2">
            {COMPETENCIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between">
                <span className="text-sm">{c.label}</span>
                <Rating
                  value={ratings[c.key] ?? 0}
                  onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v ?? undefined }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1">Strengths</Label>
            <Textarea rows={3} value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1">Concerns</Label>
            <Textarea rows={3} value={concerns} onChange={(e) => setConcerns(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={isSubmitting} onClick={submit}>
          {isSubmitting ? 'Saving…' : 'Save Score Card'}
        </Button>
      </DialogFooter>
    </>
  )
}
