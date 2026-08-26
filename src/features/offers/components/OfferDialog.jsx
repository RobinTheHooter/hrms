import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, CalendarClock, StickyNote } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldRow, FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useJobs } from '@/features/jobs/hooks'
import { offerSchema } from '@/lib/validation'

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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

// Mounted fresh on open, so defaultValues seed from the offer — no effect needed.
function OfferForm({ offer, defaultTitle, isSubmitting, onCancel, onSubmit }) {
  const isEdit = Boolean(offer)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: offer
      ? {
          title: offer.title ?? '',
          ctc: offer.ctc != null ? String(offer.ctc) : '',
          start_date: offer.start_date ?? '',
          expiry_date: offer.expiry_date ?? '',
          notes: offer.notes ?? '',
        }
      : { ...EMPTY, title: defaultTitle ?? '' },
  })

  const { data: jobsPage } = useJobs({ page: 1, size: 1000 })
  // Unique job titles for the role dropdown; include the current value so an
  // edited offer's role always shows even if that job no longer exists.
  const roleOptions = Array.from(
    new Set(
      [
        ...(jobsPage?.items ?? []).map((j) => j.title),
        offer?.title,
        defaultTitle,
      ].filter(Boolean),
    ),
  )

  const submit = handleSubmit((v) => {
    onSubmit({
      title: v.title,
      ctc: v.ctc === '' ? null : Number(v.ctc),
      start_date: v.start_date || null,
      expiry_date: v.expiry_date || null,
      notes: v.notes || null,
    })
  })

  return (
    <form onSubmit={submit} className="space-y-6">
        <FormSection icon={Banknote} title="Role & compensation">
          <FieldRow label="Role / title" span="half" error={errors.title}>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
          </FieldRow>
          <FieldRow label="CTC" error={errors.ctc}>
            <Input type="number" min="0" placeholder="1500000" {...register('ctc')} />
          </FieldRow>
        </FormSection>

        <FormSection icon={CalendarClock} title="Timeline">
          <FieldRow label="Start date" error={errors.start_date}>
            <Input type="date" {...register('start_date')} />
          </FieldRow>
          <FieldRow label="Offer expires" error={errors.expiry_date}>
            <Input type="date" {...register('expiry_date')} />
          </FieldRow>
        </FormSection>

        <FormSection icon={StickyNote} title="Notes">
          <FieldRow label="Notes" span="full" error={errors.notes}>
            <Textarea rows={3} placeholder="Any special terms or context…" {...register('notes')} />
          </FieldRow>
        </FormSection>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save offer' : 'Create offer'}
          </Button>
        </DialogFooter>
    </form>
  )
}
