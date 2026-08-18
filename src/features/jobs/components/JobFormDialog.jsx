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
import { EMPLOYMENT_TYPES, JOB_STATUSES } from '@/features/jobs/constants'
import { useConsultants } from '@/features/jobs/hooks'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  department: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  positions: z.coerce.number().int().min(1, 'Min 1').max(999),
  status: z.enum(['open', 'closed']),
  assigned_consultant_id: z.string(), // 'none' or numeric string
  description: z.string().optional().or(z.literal('')),
})

const EMPTY = {
  title: '',
  department: '',
  location: '',
  employment_type: 'full_time',
  positions: 1,
  status: 'open',
  assigned_consultant_id: 'none',
  description: '',
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export function JobFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
}) {
  const { data: consultants = [] } = useConsultants()
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
    onSubmit({
      title: v.title,
      department: v.department || null,
      location: v.location || null,
      employment_type: v.employment_type,
      positions: Number(v.positions),
      status: v.status,
      assigned_consultant_id:
        v.assigned_consultant_id === 'none' ? null : Number(v.assigned_consultant_id),
      description: v.description || null,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit job' : 'Create job'}</DialogTitle>
          <DialogDescription>Define the role and assign a consultant.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Job title" error={errors.title}>
            <Input {...register('title')} />
          </Field>
          <Field label="Department" error={errors.department}>
            <Input {...register('department')} />
          </Field>
          <Field label="Location" error={errors.location}>
            <Input {...register('location')} />
          </Field>
          <Field label="Openings" error={errors.positions}>
            <Input type="number" min="1" {...register('positions')} />
          </Field>

          <Field label="Employment type" error={errors.employment_type}>
            <Controller
              control={control}
              name="employment_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Status" error={errors.status}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Assigned consultant" error={errors.assigned_consultant_id}>
            <Controller
              control={control}
              name="assigned_consultant_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {consultants.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description}>
              <Textarea rows={4} {...register('description')} />
            </Field>
          </div>

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
