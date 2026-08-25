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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useJobs } from '@/features/jobs/hooks'

const EMPTY = { title: '', ctc: '', start_date: '', expiry_date: '', notes: '' }

export function OfferDialog({
  open,
  onOpenChange,
  offer,
  candidateName,
  defaultTitle,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{offer ? 'Edit offer' : 'Create offer'}</DialogTitle>
          <DialogDescription>{candidateName}</DialogDescription>
        </DialogHeader>

        {open && (
          <OfferForm
            offer={offer}
            defaultTitle={defaultTitle}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// Mounted fresh on open, so state seeds from the offer via useState — no effect.
function OfferForm({ offer, defaultTitle, isSubmitting, onCancel, onSubmit }) {
  const isEdit = Boolean(offer)
  const [form, setForm] = useState(() =>
    offer
      ? {
          title: offer.title ?? '',
          ctc: offer.ctc != null ? String(offer.ctc) : '',
          start_date: offer.start_date ?? '',
          expiry_date: offer.expiry_date ?? '',
          notes: offer.notes ?? '',
        }
      : { ...EMPTY, title: defaultTitle ?? '' },
  )

  const { data: jobsPage } = useJobs({ page: 1, size: 1000 })
  // Unique job titles for the role dropdown; include the current value so an
  // edited offer's role always shows even if that job no longer exists.
  const roleOptions = Array.from(
    new Set(
      [
        ...(jobsPage?.items ?? []).map((j) => j.title),
        offer?.title,
        defaultTitle,
        form.title,
      ].filter(Boolean),
    ),
  )

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
    <>
        <div className="space-y-4">
          <div>
            <Label className="mb-1">Role / title</Label>
            <Select
              value={form.title}
              onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={isSubmitting || !form.title} onClick={submit}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save offer' : 'Create offer'}
          </Button>
        </DialogFooter>
    </>
  )
}
