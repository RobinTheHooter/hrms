import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Target, UserCog } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Combobox, ComboboxInput } from '@/components/ui/combobox'
import { FormDialog } from '@/components/ui/form-dialog'
import { FieldRow, FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConsultants, useJobs } from '@/features/jobs/hooks'
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

  // Existing values as suggestions for the free-text title/department/location
  // fields — deduped from the cached jobs list.
  const { data: jobsPage } = useJobs({ page: 1, size: 1000 })
  const suggestionsOf = (key) =>
    Array.from(
      new Set((jobsPage?.items ?? []).map((j) => j[key]).filter(Boolean)),
    ).map((v) => ({ value: v, label: v }))
  const titleOptions = suggestionsOf('title')
  const departmentOptions = suggestionsOf('department')
  const locationOptions = suggestionsOf('location')
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
          <Combobox
            value={field.value}
            onValueChange={field.onChange}
            options={opts}
            placeholder={`Select ${label.toLowerCase()}`}
            emptyText={emptyText}
          />
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
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <ComboboxInput
                value={field.value}
                onValueChange={field.onChange}
                options={titleOptions}
                placeholder="Senior Backend Engineer"
              />
            )}
          />
        </FieldRow>
        <FieldRow label="Department" error={errors.department}>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <ComboboxInput
                value={field.value}
                onValueChange={field.onChange}
                options={departmentOptions}
                placeholder="Engineering"
              />
            )}
          />
        </FieldRow>
        <FieldRow label="Location" error={errors.location}>
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <ComboboxInput
                value={field.value}
                onValueChange={field.onChange}
                options={locationOptions}
                placeholder="Bengaluru / Remote"
              />
            )}
          />
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
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select consultant"
                searchPlaceholder="Search consultants…"
                emptyText="No consultants found"
                options={consultants.map((c) => ({
                  value: String(c.id),
                  label: c.full_name,
                }))}
              />
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
