import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, StickyNote, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

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
import { useCandidates } from '@/features/candidates/hooks'
import { nowInputIST } from '@/features/interviews/constants'
import { useAvailability, useHiringManagers } from '@/features/interviews/hooks'
import { useOptions } from '@/features/meta/hooks'
import { interviewSchema } from '@/lib/validation'

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })


const EMPTY = {
  candidate_id: '',
  hiring_manager_id: '',
  mode: 'virtual',
  scheduled_at: '',
  location_or_link: '',
  priority: 'medium',
  notes: '',
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
  const priorities = options?.priorities ?? []

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(interviewSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (open) reset(initialValues ?? EMPTY)
  }, [open, initialValues, reset])

  // Live availability for the chosen manager + date.
  const managerVal = useWatch({ control, name: 'hiring_manager_id' })
  const scheduledVal = useWatch({ control, name: 'scheduled_at' })
  const day = scheduledVal ? scheduledVal.slice(0, 10) : ''
  const managerNum = managerVal ? Number(managerVal) : null
  const { data: avail, isFetching: availLoading } = useAvailability(
    managerNum,
    day,
  )

  const submit = handleSubmit((v) => {
    const payload = {
      hiring_manager_id: v.hiring_manager_id
        ? Number(v.hiring_manager_id)
        : null,
      mode: v.mode,
      scheduled_at: v.scheduled_at,
      location_or_link: v.location_or_link || null,
      priority: v.priority,
      notes: v.notes || null,
    }
    if (!isEdit) payload.candidate_id = Number(v.candidate_id)
    onSubmit(payload)
  })

  const selectRow = (name, label, opts, emptyText, placeholder, span) => (
    <FieldRow label={label} error={errors[name]} span={span}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
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
      title={isEdit ? 'Reschedule interview' : 'Schedule interview'}
      description="Assign a hiring manager and set the date & time."
      onSubmit={submit}
      isSubmitting={isSubmitting}
      contentClassName="max-h-[90vh] max-w-3xl overflow-y-auto"
      formClassName="space-y-6"
    >
      <FormSection icon={Users} title="Who">
        <FieldRow label="Candidate" span="half" error={errors.candidate_id}>
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
        </FieldRow>
        <FieldRow label="Hiring manager" error={errors.hiring_manager_id}>
          <Controller
            control={control}
            name="hiring_manager_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select hiring manager" /></SelectTrigger>
                <SelectContent>
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
        </FieldRow>
      </FormSection>

      <FormSection icon={CalendarClock} title="When & where">
        {selectRow('mode', 'Mode', modes, 'No modes found', 'Select mode')}
        <FieldRow label="Date & time (IST)" error={errors.scheduled_at}>
          <Input type="datetime-local" min={nowInputIST()} {...register('scheduled_at')} />
        </FieldRow>
        <FieldRow label="Location / meeting link" error={errors.location_or_link}>
          <Input placeholder="https://… or office address" {...register('location_or_link')} />
        </FieldRow>
        <div className="sm:col-span-2 md:col-span-3">
          {!managerNum || !day ? (
            <p className="text-xs text-muted-foreground">
              Pick a hiring manager and date to see their availability.
            </p>
          ) : availLoading ? (
            <p className="text-xs text-muted-foreground">Checking availability…</p>
          ) : !avail?.connected ? (
            <p className="text-xs text-muted-foreground">
              This manager hasn't connected Google Calendar, so availability
              can't be shown.
            </p>
          ) : avail.busy.length === 0 ? (
            <p className="text-xs text-success">No conflicts on {day}.</p>
          ) : (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="mb-1.5 text-xs font-medium">
                Busy on {day} (IST) — avoid these:
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {avail.busy.map((b, i) => (
                  <li
                    key={i}
                    className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                  >
                    {fmtTime(b.start)}–{fmtTime(b.end)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </FormSection>

      <FormSection icon={StickyNote} title="Details">
        {selectRow('priority', 'Priority', priorities, 'No priorities found', 'Select priority')}
        <FieldRow label="Notes" span="full" error={errors.notes}>
          <Textarea rows={3} placeholder="Agenda, focus areas, or context for the panel…" {...register('notes')} />
        </FieldRow>
      </FormSection>
    </FormDialog>
  )
}
