import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

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
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCandidates } from '@/features/candidates/hooks'
import { useHiringManagers } from '@/features/interviews/hooks'
import { useOptions } from '@/features/meta/hooks'

const schema = z.object({
  candidate_id: z.string().min(1, 'Select a candidate'),
  hiring_manager_id: z.string(),
  mode: z.string().min(1, 'Required'),
  scheduled_at: z.string().min(1, 'Pick a date & time'),
  location_or_link: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

const EMPTY = {
  candidate_id: '',
  hiring_manager_id: 'none',
  mode: 'virtual',
  scheduled_at: '',
  location_or_link: '',
  notes: '',
}

function Field({ label, error, children, className }) {
  return (
    <div className={className}>
      <Label className="mb-1">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export function InterviewScheduleDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
}) {
  const isEdit = mode === 'edit'
  const { data: candPage } = useCandidates({ page: 1, size: 100 })
  const candidates = candPage?.items ?? []
  const { data: managers = [] } = useHiringManagers()
  const { data: options } = useOptions()
  const modes = options?.interview_modes ?? []

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (open) reset(initialValues ?? EMPTY)
  }, [open, initialValues, reset])

  const submit = handleSubmit((v) => {
    const payload = {
      hiring_manager_id:
        v.hiring_manager_id === 'none' ? null : Number(v.hiring_manager_id),
      mode: v.mode,
      scheduled_at: v.scheduled_at,
      location_or_link: v.location_or_link || null,
      notes: v.notes || null,
    }
    if (!isEdit) payload.candidate_id = Number(v.candidate_id)
    onSubmit(payload)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Reschedule interview' : 'Schedule interview'}
          </DialogTitle>
          <DialogDescription>
            Assign a hiring manager and set the date & time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Candidate" error={errors.candidate_id} className="sm:col-span-2">
            <Controller
              control={control}
              name="candidate_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <SelectTrigger><SelectValue placeholder="Select a candidate" /></SelectTrigger>
                  <SelectContent>
                    {candidates.length === 0 ? (
                      <SelectEmpty>No candidates found</SelectEmpty>
                    ) : (
                      candidates.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.full_name}
                          {c.job?.title ? ` · ${c.job.title}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Hiring manager" error={errors.hiring_manager_id}>
            <Controller
              control={control}
              name="hiring_manager_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {managers.length === 0 ? (
                      <SelectEmpty>No hiring managers found</SelectEmpty>
                    ) : (
                      managers.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.full_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Mode" error={errors.mode}>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modes.length === 0 ? (
                      <SelectEmpty>No modes found</SelectEmpty>
                    ) : (
                      modes.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Date & time" error={errors.scheduled_at}>
            <Input type="datetime-local" {...register('scheduled_at')} />
          </Field>
          <Field label="Location / meeting link" error={errors.location_or_link}>
            <Input placeholder="https://… or office address" {...register('location_or_link')} />
          </Field>

          <Field label="Notes" error={errors.notes} className="sm:col-span-2">
            <Textarea rows={3} {...register('notes')} />
          </Field>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
