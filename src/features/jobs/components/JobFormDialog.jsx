import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Target, UserCog } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { FormDialog } from '@/components/ui/form-dialog'
import { FieldRow, FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
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

  const selectRow = (name, label, opts, emptyText, span) => (
    <FieldRow label={label} error={errors[name]} span={span}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
            <SelectContent>
              {opts.length === 0 ? (
                <SelectEmpty>{emptyText}</SelectEmpty>
              ) : (
                opts.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      />
    </FieldRow>
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? 'Edit job' : 'Create job'}
      description="Define the role and assign a consultant."
      onSubmit={submit}
      isSubmitting={isSubmitting}
      contentClassName="max-h-[90vh] max-w-3xl overflow-y-auto"
      formClassName="space-y-6"
    >
      <FormSection icon={Target} title="Role basics">
        <FieldRow label="Job title" span="half" error={errors.title}>
          <Input placeholder="Senior Backend Engineer" {...register('title')} />
        </FieldRow>
        <FieldRow label="Department" error={errors.department}>
          <Input placeholder="Engineering" {...register('department')} />
        </FieldRow>
        <FieldRow label="Location" error={errors.location}>
          <Input placeholder="Bengaluru / Remote" {...register('location')} />
        </FieldRow>
        {selectRow('employment_type', 'Employment type', employmentTypes, 'No types found')}
      </FormSection>

      <FormSection icon={UserCog} title="Hiring details">
        <FieldRow label="Openings" error={errors.positions}>
          <Input type="number" min="1" placeholder="1" {...register('positions')} />
        </FieldRow>
        {selectRow('status', 'Status', jobStatuses, 'No statuses found')}
        {selectRow('priority', 'Priority', priorities, 'No priorities found')}
        <FieldRow label="Assigned consultant" span="half" error={errors.assigned_consultant_id}>
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
        </FieldRow>
      </FormSection>

      <FormSection icon={FileText} title="Description & screening">
        <FieldRow label="Description" span="full" error={errors.description}>
          <Textarea rows={3} placeholder="Responsibilities, requirements, and what success looks like…" {...register('description')} />
        </FieldRow>
        <FieldRow
          label="Required skills / keywords"
          span="full"
          description="Used for AI screening — e.g. React, TypeScript, REST APIs, 3+ years"
          error={errors.required_skills}
        >
          <Textarea
            rows={2}
            placeholder="e.g. React, TypeScript, REST APIs, 3+ years"
            {...register('required_skills')}
          />
        </FieldRow>
      </FormSection>
    </FormDialog>
  )
}
