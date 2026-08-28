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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  COMPETENCIES,
  RECOMMENDATIONS,
  Rating,
} from '@/features/interviews/components/scorecard'
import { cn } from '@/lib/utils'

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
  const [recommendation, setRecommendation] = useState(fb.recommendation ?? 'yes')
  const [ratings, setRatings] = useState(fb.ratings ?? {})
  const [strengths, setStrengths] = useState(fb.strengths ?? '')
  const [concerns, setConcerns] = useState(fb.concerns ?? '')
  const [notes, setNotes] = useState(interview?.notes ?? '')
  const [error, setError] = useState('')

  const positive = RECOMMENDATIONS.find((r) => r.value === recommendation)?.positive
  const outcome = positive ? 'selected' : 'rejected'

  const submit = () => {
    // A reason is mandatory when rejecting.
    if (outcome === 'rejected' && !notes.trim()) {
      setError('A reason is required when rejecting a candidate.')
      return
    }
    setError('')
    onSubmit({
      outcome,
      notes: notes || null,
      feedback: {
        recommendation,
        ratings,
        strengths: strengths || null,
        concerns: concerns || null,
      },
    })
  }

  return (
    <>
        <div className="space-y-5">
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
                    onClick={() => setRecommendation(r.value)}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                      active && r.positive && 'border-success bg-success/12 text-success',
                      active && !r.positive &&
                      'border-destructive bg-destructive/12 text-destructive',
                      !active && 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              A positive recommendation moves the candidate to <b>Offer</b>; a
              negative one moves them to <b>Rejected</b>.
            </p>
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
                    onChange={(v) =>
                      setRatings((prev) => ({ ...prev, [c.key]: v ?? undefined }))
                    }
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

          <div>
            <Label className="mb-1">
              {outcome === 'rejected' ? 'Reason for rejection' : 'Summary notes'}
              {outcome === 'rejected' && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                if (error) setError('')
              }}
              placeholder={
                outcome === 'rejected'
                  ? 'Why is this candidate being rejected?'
                  : undefined
              }
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
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
