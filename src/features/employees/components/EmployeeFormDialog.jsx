import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, Briefcase, User } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Combobox } from '@/components/ui/combobox'
import { FormDialog } from '@/components/ui/form-dialog'
import { FieldRow, FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '@/features/employees/constants'
import {
  emptyEmployee,
  employeeSchema,
  toPayload,
} from '@/features/employees/schema'

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

  const selectRow = (name, label, opts) => (
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
          />
        )}
      />
    </FieldRow>
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? 'Edit employee' : 'Add employee'}
      description="Fill in the details and save."
      onSubmit={submit}
      isSubmitting={isSubmitting}
      contentClassName="max-h-[90vh] max-w-3xl overflow-y-auto"
      formClassName="space-y-6"
    >
      <FormSection icon={User} title="Personal & contact">
        <FieldRow label="First name" error={errors.first_name}>
          <Input placeholder="Aditi" {...register('first_name')} />
        </FieldRow>
        <FieldRow label="Last name" error={errors.last_name}>
          <Input placeholder="Sharma" {...register('last_name')} />
        </FieldRow>
        <FieldRow label="Email" error={errors.email}>
          <Input type="email" placeholder="name@company.com" {...register('email')} />
        </FieldRow>
        <FieldRow label="Phone" error={errors.phone}>
          <Input placeholder="+91 98765 43210" {...register('phone')} />
        </FieldRow>
      </FormSection>

      <FormSection icon={Briefcase} title="Employment">
        <FieldRow label="Job title" error={errors.job_title}>
          <Input placeholder="Backend Engineer" {...register('job_title')} />
        </FieldRow>
        <FieldRow label="Department" error={errors.department}>
          <Input placeholder="Engineering" {...register('department')} />
        </FieldRow>
        <FieldRow label="Date of joining" error={errors.date_of_joining}>
          <Input type="date" {...register('date_of_joining')} />
        </FieldRow>
        {selectRow('employment_type', 'Employment type', EMPLOYMENT_TYPES)}
        {selectRow('status', 'Status', EMPLOYEE_STATUSES)}
      </FormSection>

      <FormSection icon={Banknote} title="Compensation">
        <FieldRow label="Salary" error={errors.salary}>
          <Input type="number" step="0.01" min="0" placeholder="1200000" {...register('salary')} />
        </FieldRow>
      </FormSection>
    </FormDialog>
  )
}
