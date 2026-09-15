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
import { TASK_CATEGORIES, TASK_OWNERS } from '@/features/onboarding/constants'

const NONE = '__none__'

/** Create or edit a single onboarding checklist task. */
export function TaskFormDialog({ open, onOpenChange, mode = 'create', task, onSubmit, isSubmitting }) {
  const initial = () => ({
    category: task?.category ?? 'documentation',
    title: task?.title ?? '',
    owner: task?.owner ?? NONE,
    due_date: task?.due_date ?? '',
  })
  const [values, setValues] = useState(initial)

  const handleOpenChange = (next) => {
    if (next) setValues(initial())
    onOpenChange(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!values.title.trim()) return
    onSubmit({
      category: values.category,
      title: values.title.trim(),
      owner: values.owner === NONE ? null : values.owner,
      due_date: values.due_date || null,
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'edit' ? 'Edit task' : 'Add task'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={mode === 'edit' ? 'Save changes' : 'Add task'}
    >
      <div className="space-y-1.5">
        <Label htmlFor="tf-title">Task</Label>
        <Input
          id="tf-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="e.g. Collect signed NDA"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="tf-cat">Category</Label>
          <Select value={values.category} onValueChange={(val) => setValues((v) => ({ ...v, category: val }))}>
            <SelectTrigger id="tf-cat"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tf-owner">Owner</Label>
          <Select value={values.owner} onValueChange={(val) => setValues((v) => ({ ...v, owner: val }))}>
            <SelectTrigger id="tf-owner"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {TASK_OWNERS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tf-due">Due date</Label>
          <Input
            id="tf-due"
            type="date"
            value={values.due_date}
            onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
          />
        </div>
      </div>
    </FormDialog>
  )
}
