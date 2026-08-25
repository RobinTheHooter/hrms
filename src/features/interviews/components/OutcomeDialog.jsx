import { useEffect, useState } from 'react'

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
import { cn } from '@/lib/utils'

const COMPETENCIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'communication', label: 'Communication' },
  { key: 'culture_fit', label: 'Culture fit' },
  { key: 'problem_solving', label: 'Problem solving' },
]

const RECOMMENDATIONS = [
  { value: 'strong_no', label: 'Strong No', positive: false },
  { value: 'no', label: 'No', positive: false },
  { value: 'yes', label: 'Yes', positive: true },
  { value: 'strong_yes', label: 'Strong Yes', positive: true },
]

function Rating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            'flex size-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
            value >= n
              ? 'border-primary bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function OutcomeDialog({ open, onOpenChange, interview, onSubmit, isSubmitting }) {
  const [recommendation, setRecommendation] = useState('yes')
  const [ratings, setRatings] = useState({})
  const [strengths, setStrengths] = useState('')
  const [concerns, setConcerns] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    const fb = interview?.feedback ?? {}
    setRecommendation(fb.recommendation ?? 'yes')
    setRatings(fb.ratings ?? {})
    setStrengths(fb.strengths ?? '')
    setConcerns(fb.concerns ?? '')
    setNotes(interview?.notes ?? '')
  }, [open, interview])

  const positive = RECOMMENDATIONS.find((r) => r.value === recommendation)?.positive
  const outcome = positive ? 'selected' : 'rejected'

  const submit = () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview scorecard</DialogTitle>
          <DialogDescription>
            {interview?.candidate?.full_name} · {interview?.candidate?.job?.title}
          </DialogDescription>
        </DialogHeader>

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
            <Label className="mb-1">Summary notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={isSubmitting} onClick={submit}>
            {isSubmitting ? 'Saving…' : 'Save Score Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
