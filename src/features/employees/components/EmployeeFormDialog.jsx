import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

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
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '@/features/employees/constants'
import {
  emptyEmployee,
  employeeSchema,
  toPayload,
} from '@/features/employees/schema'

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialValues ?? emptyEmployee,
  })

  // Reset the form whenever we open with different data.
  useEffect(() => {
    if (open) reset(initialValues ?? emptyEmployee)
  }, [open, initialValues, reset])

  const submit = handleSubmit((values) => onSubmit(toPayload(values)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit employee' : 'Add employee'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details and save.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.first_name}>
            <Input {...register('first_name')} />
          </Field>
          <Field label="Last name" error={errors.last_name}>
            <Input {...register('last_name')} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input {...register('phone')} />
          </Field>
          <Field label="Job title" error={errors.job_title}>
            <Input {...register('job_title')} />
          </Field>
          <Field label="Department" error={errors.department}>
            <Input {...register('department')} />
          </Field>

          <Field label="Employment type" error={errors.employment_type}>
            <Controller
              control={control}
              name="employment_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATUSES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Date of joining" error={errors.date_of_joining}>
            <Input type="date" {...register('date_of_joining')} />
          </Field>
          <Field label="Salary" error={errors.salary}>
            <Input type="number" step="0.01" min="0" {...register('salary')} />
          </Field>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
