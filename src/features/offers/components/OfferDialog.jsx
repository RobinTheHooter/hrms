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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const EMPTY = { title: '', ctc: '', start_date: '', expiry_date: '', notes: '' }

export function OfferDialog({ open, onOpenChange, offer, candidateName, onSubmit, isSubmitting }) {
  const [form, setForm] = useState(EMPTY)
  const isEdit = Boolean(offer)

  useEffect(() => {
    if (!open) return
    setForm(
      offer
        ? {
            title: offer.title ?? '',
            ctc: offer.ctc != null ? String(offer.ctc) : '',
            start_date: offer.start_date ?? '',
            expiry_date: offer.expiry_date ?? '',
            notes: offer.notes ?? '',
          }
        : EMPTY,
    )
  }, [open, offer])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    onSubmit({
      title: form.title,
      ctc: form.ctc === '' ? null : Number(form.ctc),
      start_date: form.start_date || null,
      expiry_date: form.expiry_date || null,
      notes: form.notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit offer' : 'Create offer'}</DialogTitle>
          <DialogDescription>{candidateName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1">Role / title</Label>
            <Input value={form.title} onChange={set('title')} placeholder="e.g. Senior Frontend Developer" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1">CTC</Label>
              <Input type="number" min="0" value={form.ctc} onChange={set('ctc')} />
            </div>
            <div>
              <Label className="mb-1">Start date</Label>
              <Input type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div>
              <Label className="mb-1">Offer expires</Label>
              <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
            </div>
          </div>
          <div>
            <Label className="mb-1">Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={isSubmitting || !form.title} onClick={submit}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save offer' : 'Create offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
