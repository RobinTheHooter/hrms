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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CANDIDATE_SOURCES,
  CANDIDATE_STAGES,
} from '@/features/candidates/constants'
import { useJobs } from '@/features/jobs/hooks'

const schema = z.object({
  job_id: z.string().min(1, 'Select a job'),
  full_name: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  current_role: z.string().optional().or(z.literal('')),
  experience_years: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')),
  source: z.enum(['applied', 'referral', 'sourced', 'agency']),
  current_ctc: z.string().optional().or(z.literal('')),
  expected_ctc: z.string().optional().or(z.literal('')),
  notice_period_days: z.string().optional().or(z.literal('')),
  resume_url: z.string().optional().or(z.literal('')),
  stage: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional().or(z.literal('')),
})

const EMPTY = {
  job_id: '',
  full_name: '',
  email: '',
  phone: '',
  current_role: '',
  experience_years: '',
  skills: '',
  source: 'applied',
  current_ctc: '',
  expected_ctc: '',
  notice_period_days: '',
  resume_url: '',
  stage: 'applied',
  notes: '',
}

const num = (v) => (v === '' || v == null ? null : Number(v))

function Field({ label, error, children, className }) {
  return (
    <div className={className}>
      <Label className="mb-1">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export function CandidateFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
}) {
  const isEdit = mode === 'edit'
  const { data: jobsPage } = useJobs({ page: 1, size: 100 })
  const jobs = jobsPage?.items ?? []

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
      full_name: v.full_name,
      email: v.email,
      phone: v.phone || null,
      current_role: v.current_role || null,
      experience_years: num(v.experience_years),
      skills: v.skills || null,
      source: v.source,
      current_ctc: num(v.current_ctc),
      expected_ctc: num(v.expected_ctc),
      notice_period_days: num(v.notice_period_days),
      resume_url: v.resume_url || null,
      stage: v.stage,
      notes: v.notes || null,
    }
    if (!isEdit) payload.job_id = Number(v.job_id)
    onSubmit(payload)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit candidate' : 'Add candidate'}</DialogTitle>
          <DialogDescription>
            Attach the candidate to a job and capture their details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Job" error={errors.job_id} className="sm:col-span-2">
            <Controller
              control={control}
              name="job_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>
                        {j.title}
                        {j.department ? ` · ${j.department}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Full name" error={errors.full_name}>
            <Input {...register('full_name')} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input {...register('phone')} />
          </Field>
          <Field label="Current role" error={errors.current_role}>
            <Input {...register('current_role')} />
          </Field>
          <Field label="Experience (years)" error={errors.experience_years}>
            <Input type="number" step="0.5" min="0" {...register('experience_years')} />
          </Field>
          <Field label="Notice period (days)" error={errors.notice_period_days}>
            <Input type="number" min="0" {...register('notice_period_days')} />
          </Field>
          <Field label="Current CTC" error={errors.current_ctc}>
            <Input type="number" min="0" {...register('current_ctc')} />
          </Field>
          <Field label="Expected CTC" error={errors.expected_ctc}>
            <Input type="number" min="0" {...register('expected_ctc')} />
          </Field>

          <Field label="Source" error={errors.source}>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CANDIDATE_SOURCES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Stage" error={errors.stage}>
            <Controller
              control={control}
              name="stage"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CANDIDATE_STAGES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Resume URL" error={errors.resume_url} className="sm:col-span-2">
            <Input placeholder="https://…" {...register('resume_url')} />
          </Field>
          <Field label="Skills" error={errors.skills} className="sm:col-span-2">
            <Input placeholder="React, Node, SQL…" {...register('skills')} />
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
