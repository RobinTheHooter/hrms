import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck, UserCircle } from 'lucide-react'
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
import { useOptions } from '@/features/meta/hooks'
import { makeUserSchema } from '@/lib/validation'

export function UserFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
}) {
  const isEdit = mode === 'edit'
  const { data: options } = useOptions()
  const roles = options?.user_roles ?? []
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(makeUserSchema(isEdit)) })

  useEffect(() => {
    if (open) {
      reset(
        initialValues ?? {
          full_name: '',
          email: '',
          password: '',
          role: 'employee',
          is_active: 'true',
        },
      )
    }
  }, [open, initialValues, reset])

  const submit = handleSubmit((values) => {
    const payload = {
      full_name: values.full_name,
      role: values.role,
      is_active: values.is_active === 'true',
    }
    if (!isEdit) payload.email = values.email
    if (values.password) payload.password = values.password
    onSubmit(payload)
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit user' : 'Add user'}
      description={
        isEdit
          ? 'Update details, role, or reset the password.'
          : 'Create a new account and assign a role.'
      }
      onSubmit={submit}
      isSubmitting={isSubmitting}
      contentClassName="max-w-2xl"
      formClassName="space-y-6"
    >
      <FormSection icon={UserCircle} title="Account">
        <FieldRow label="Full name" error={errors.full_name}>
          <Input placeholder="Aditi Sharma" {...register('full_name')} />
        </FieldRow>
        <FieldRow label="Email" error={errors.email}>
          <Input type="email" placeholder="name@company.com" disabled={isEdit} {...register('email')} />
        </FieldRow>
        <FieldRow
          label={isEdit ? 'Reset password' : 'Password'}
          description={isEdit ? 'Leave blank to keep current' : undefined}
          error={errors.password}
        >
          <Input
            type="password"
            placeholder={isEdit ? 'Leave blank to keep current' : 'At least 8 characters'}
            {...register('password')}
          />
        </FieldRow>
      </FormSection>

      <FormSection icon={ShieldCheck} title="Access">
        <FieldRow label="Role" error={errors.role}>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 ? (
                    <SelectEmpty>No roles found</SelectEmpty>
                  ) : (
                    roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </FieldRow>
        <FieldRow label="Status" error={errors.is_active}>
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FieldRow>
      </FormSection>
    </FormDialog>
  )
}
