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
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOptions } from '@/features/meta/hooks'

export function OutcomeDialog({ open, onOpenChange, interview, onSubmit, isSubmitting }) {
  const { data: options } = useOptions()
  // Only decisive outcomes are selectable (exclude "pending").
  const outcomes = (options?.interview_outcomes ?? []).filter(
    (o) => o.value !== 'pending',
  )

  const [outcome, setOutcome] = useState('selected')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setOutcome(
        interview?.outcome && interview.outcome !== 'pending'
          ? interview.outcome
          : 'selected',
      )
      setNotes(interview?.notes ?? '')
    }
  }, [open, interview])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record interview outcome</DialogTitle>
          <DialogDescription>
            {interview?.candidate?.full_name} · {interview?.candidate?.job?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1">Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {outcomes.length === 0 ? (
                  <SelectEmpty>No outcomes found</SelectEmpty>
                ) : (
                  outcomes.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecting moves the candidate to <b>Offer</b>; rejecting moves them
              to <b>Rejected</b>.
            </p>
          </div>

          <div>
            <Label className="mb-1">Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={isSubmitting}
            onClick={() => onSubmit({ outcome, notes: notes || null })}
          >
            {isSubmitting ? 'Saving…' : 'Save outcome'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
