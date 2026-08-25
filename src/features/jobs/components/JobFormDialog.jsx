import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useConsultants } from '@/features/jobs/hooks'
import { useOptions } from '@/features/meta/hooks'
import { jobSchema } from '@/lib/validation'

const EMPTY = {
  title: '',
  department: '',
  location: '',
  employment_type: 'full_time',
  positions: 1,
  status: 'open',
  priority: 'medium',
  assigned_consultant_id: '',
  description: '',
  required_skills: '',
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
  const { data: options } = useOptions()
  const employmentTypes = options?.employment_types ?? []
  const jobStatuses = options?.job_statuses ?? []
  const priorities = options?.priorities ?? []
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(jobSchema), defaultValues: EMPTY })

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
      priority: v.priority,
      assigned_consultant_id: v.assigned_consultant_id
        ? Number(v.assigned_consultant_id)
        : null,
      description: v.description || null,
      required_skills: v.required_skills || null,
    })
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? 'Edit job' : 'Create job'}
      description="Define the role and assign a consultant."
      onSubmit={submit}
      isSubmitting={isSubmitting}
      contentClassName="max-w-2xl"
      formClassName="grid grid-cols-1 gap-4 sm:grid-cols-2"
      footerClassName="sm:col-span-2"
    >
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
                    {employmentTypes.length === 0 ? (
                      <SelectEmpty>No types found</SelectEmpty>
                    ) : (
                      employmentTypes.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))
                    )}
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
                    {jobStatuses.length === 0 ? (
                      <SelectEmpty>No statuses found</SelectEmpty>
                    ) : (
                      jobStatuses.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Priority" error={errors.priority}>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.length === 0 ? (
                      <SelectEmpty>No priorities found</SelectEmpty>
                    ) : (
                      priorities.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))
                    )}
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
                  <SelectTrigger><SelectValue placeholder="Select consultant" /></SelectTrigger>
                  <SelectContent>
                    {consultants.length === 0 ? (
                      <SelectEmpty>No consultants found</SelectEmpty>
                    ) : (
                      consultants.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.full_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description}>
              <Textarea rows={3} {...register('description')} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Required skills / keywords (for AI screening)" error={errors.required_skills}>
              <Textarea
                rows={2}
                placeholder="e.g. React, TypeScript, REST APIs, 3+ years"
                {...register('required_skills')}
              />
            </Field>
          </div>
    </FormDialog>
  )
}
