import { useState } from 'react'

import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPLOYMENT_TYPES } from '@/features/onboarding/constants'

/** Convert a completed onboarding into an active Employee record. */
export function ConvertDialog({ open, onOpenChange, onboarding, onSubmit, isSubmitting }) {
  const [values, setValues] = useState({
    date_of_joining: onboarding?.start_date ?? '',
    employment_type: 'full_time',
    job_title: onboarding?.job_title ?? '',
    department: onboarding?.department ?? '',
  })

  const handleOpenChange = (next) => {
    if (next) {
      setValues({
        date_of_joining: onboarding?.start_date ?? '',
        employment_type: 'full_time',
        job_title: onboarding?.job_title ?? '',
        department: onboarding?.department ?? '',
      })
    }
    onOpenChange(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      date_of_joining: values.date_of_joining || null,
      employment_type: values.employment_type,
      job_title: values.job_title || null,
      department: values.department || null,
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Convert to employee"
      description={`Create an active employee record for ${onboarding?.full_name ?? 'this new hire'}.`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Create employee"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cv-doj">Date of joining</Label>
          <Input
            id="cv-doj"
            type="date"
            value={values.date_of_joining}
            onChange={(e) => setValues((v) => ({ ...v, date_of_joining: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cv-type">Employment type</Label>
          <Select
            value={values.employment_type}
            onValueChange={(val) => setValues((v) => ({ ...v, employment_type: val }))}
          >
            <SelectTrigger id="cv-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cv-title">Job title</Label>
          <Input
            id="cv-title"
            value={values.job_title}
            onChange={(e) => setValues((v) => ({ ...v, job_title: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cv-dept">Department</Label>
          <Input
            id="cv-dept"
            value={values.department}
            onChange={(e) => setValues((v) => ({ ...v, department: e.target.value }))}
          />
        </div>
      </div>
    </FormDialog>
  )
}
