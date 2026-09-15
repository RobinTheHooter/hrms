import { useState } from 'react'

import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** Edit the core details of an onboarding record. */
export function EditOnboardingDialog({ open, onOpenChange, onboarding, onSubmit, isSubmitting }) {
  const initial = () => ({
    job_title: onboarding?.job_title ?? '',
    department: onboarding?.department ?? '',
    location: onboarding?.location ?? '',
    start_date: onboarding?.start_date ?? '',
    manager_name: onboarding?.manager_name ?? '',
    buddy_name: onboarding?.buddy_name ?? '',
    notes: onboarding?.notes ?? '',
  })
  const [values, setValues] = useState(initial)

  const handleOpenChange = (next) => {
    if (next) setValues(initial())
    onOpenChange(next)
  }

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(
      Object.fromEntries(
        Object.entries(values).map(([k, val]) => [k, val === '' ? null : val]),
      ),
    )
  }

  const field = (key, label, props = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`eo-${key}`}>{label}</Label>
      <Input id={`eo-${key}`} value={values[key]} onChange={set(key)} {...props} />
    </div>
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit onboarding"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save changes"
      contentClassName="sm:max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('job_title', 'Job title')}
        {field('department', 'Department')}
        {field('location', 'Location')}
        {field('start_date', 'Start date', { type: 'date' })}
        {field('manager_name', 'Reporting to')}
        {field('buddy_name', 'Onboarding buddy')}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eo-notes">Notes</Label>
        <Textarea id="eo-notes" value={values.notes} onChange={set('notes')} />
      </div>
    </FormDialog>
  )
}
