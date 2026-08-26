import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, Briefcase, FileText, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Combobox } from '@/components/ui/combobox'
import { FormDialog } from '@/components/ui/form-dialog'
import { FieldRow, FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useJobs } from '@/features/jobs/hooks'
import { useOptions } from '@/features/meta/hooks'
import { candidateSchema } from '@/lib/validation'

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
  priority: 'medium',
  notes: '',
}

const num = (v) => (v === '' || v == null ? null : Number(v))

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
  const { data: options } = useOptions()
  const sources = options?.candidate_sources ?? []
  const stages = options?.candidate_stages ?? []
  const priorities = options?.priorities ?? []

  const [file, setFile] = useState(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(candidateSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (open) {
      reset(initialValues ?? EMPTY)
      setFile(null)
    }
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
      priority: v.priority,
      notes: v.notes || null,
    }
    if (!isEdit) payload.job_id = Number(v.job_id)
    onSubmit(payload, file)
  })

  const selectRow = (name, label, opts, emptyText) => (
    <FieldRow label={label} error={errors[name]}>
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
      title={isEdit ? 'Edit candidate' : 'Add candidate'}
      description="Attach the candidate to a job and capture their details."
      onSubmit={submit}
      isSubmitting={isSubmitting}
      contentClassName="max-h-[90vh] max-w-3xl overflow-y-auto"
      formClassName="space-y-6"
    >
      <FormSection icon={User} title="Personal & contact">
        <FieldRow label="Full name" error={errors.full_name}>
          <Input placeholder="Aditi Sharma" {...register('full_name')} />
        </FieldRow>
        <FieldRow label="Email" error={errors.email}>
          <Input type="email" placeholder="name@company.com" {...register('email')} />
        </FieldRow>
        <FieldRow label="Phone" error={errors.phone}>
          <Input placeholder="+91 98765 43210" {...register('phone')} />
        </FieldRow>
        <FieldRow label="Current role" error={errors.current_role}>
          <Input placeholder="Backend Engineer" {...register('current_role')} />
        </FieldRow>
        <FieldRow label="Experience (years)" error={errors.experience_years}>
          <Input type="number" step="0.5" min="0" placeholder="5" {...register('experience_years')} />
        </FieldRow>
        <FieldRow label="Skills" error={errors.skills}>
          <Input placeholder="React, Node, SQL…" {...register('skills')} />
        </FieldRow>
      </FormSection>

      <FormSection icon={Briefcase} title="Application">
        <FieldRow label="Job" span="half" error={errors.job_id}>
          <Controller
            control={control}
            name="job_id"
            render={({ field }) => (
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                disabled={isEdit}
                placeholder="Select a job"
                searchPlaceholder="Search jobs…"
                emptyText="No jobs found"
                options={jobs.map((j) => ({
                  value: String(j.id),
                  label: j.department ? `${j.title} · ${j.department}` : j.title,
                }))}
              />
            )}
          />
        </FieldRow>
        {selectRow('source', 'Source', sources, 'No sources found')}
        {selectRow('stage', 'Stage', stages, 'No stages found')}
        {selectRow('priority', 'Priority', priorities, 'No priorities found')}
      </FormSection>

      <FormSection icon={Banknote} title="Compensation">
        <FieldRow label="Current CTC" error={errors.current_ctc}>
          <Input type="number" min="0" placeholder="1200000" {...register('current_ctc')} />
        </FieldRow>
        <FieldRow label="Expected CTC" error={errors.expected_ctc}>
          <Input type="number" min="0" placeholder="1500000" {...register('expected_ctc')} />
        </FieldRow>
        <FieldRow label="Notice period (days)" error={errors.notice_period_days}>
          <Input type="number" min="0" placeholder="30" {...register('notice_period_days')} />
        </FieldRow>
      </FormSection>

      <FormSection icon={FileText} title="Resume & notes">
        <FieldRow
          label="Resume file"
          span="half"
          description="PDF, DOCX or TXT — uploading runs AI screening automatically."
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
        </FieldRow>
        <FieldRow label="Resume URL" description="Optional" error={errors.resume_url}>
          <Input placeholder="https://…" {...register('resume_url')} />
        </FieldRow>
        <FieldRow label="Notes" span="full" error={errors.notes}>
          <Textarea rows={3} placeholder="Anything worth flagging about this candidate…" {...register('notes')} />
        </FieldRow>
      </FormSection>
    </FormDialog>
  )
}
