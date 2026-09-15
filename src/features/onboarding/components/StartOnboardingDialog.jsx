import { useState } from 'react'

import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const EMPTY = {
  full_name: '',
  email: '',
  job_title: '',
  department: '',
  location: '',
  start_date: '',
  manager_name: '',
  buddy_name: '',
  notes: '',
}

/** Manually start an onboarding journey (also auto-created on offer accept). */
export function StartOnboardingDialog({ open, onOpenChange, onSubmit, isSubmitting }) {
  const [values, setValues] = useState(EMPTY)

  const set = (key) => (e) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === '' ? null : v]),
    )
    payload.seed_default_tasks = true
    onSubmit(payload)
  }

  // Reset when the dialog is (re)opened.
  const handleOpenChange = (next) => {
    if (next) setValues(EMPTY)
    onOpenChange(next)
  }

  const field = (key, label, props = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`onb-${key}`}>{label}</Label>
      <Input id={`onb-${key}`} value={values[key]} onChange={set(key)} {...props} />
    </div>
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Start onboarding"
      description="Create a new hire's onboarding journey. The standard checklist is added automatically."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Start onboarding"
      contentClassName="sm:max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('full_name', 'Full name', { required: true, placeholder: 'e.g. Ananya Krishnan' })}
        {field('email', 'Email', { type: 'email', required: true, placeholder: 'name@factsonline.in' })}
        {field('job_title', 'Job title', { placeholder: 'e.g. Senior Video Editor' })}
        {field('department', 'Department', { placeholder: 'e.g. Content' })}
        {field('location', 'Location', { placeholder: 'e.g. Chennai (Hybrid)' })}
        {field('start_date', 'Start date', { type: 'date' })}
        {field('manager_name', 'Reporting to', { placeholder: 'Manager name' })}
        {field('buddy_name', 'Onboarding buddy', { placeholder: 'Buddy name' })}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="onb-notes">Notes</Label>
        <Textarea
          id="onb-notes"
          value={values.notes}
          onChange={set('notes')}
          placeholder="Anything the team should know…"
        />
      </div>
    </FormDialog>
  )
}
