import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { ROLE_OPTIONS } from '@/features/users/constants'

const passwordField = (required) =>
  required
    ? z.string().min(8, 'At least 8 characters')
    : z.string().min(8, 'At least 8 characters').or(z.literal(''))

const makeSchema = (isEdit) =>
  z.object({
    full_name: z.string().min(1, 'Required'),
    email: z.string().email('Enter a valid email'),
    password: passwordField(!isEdit),
    role: z.enum(['admin', 'hr', 'manager', 'employee']),
    is_active: z.enum(['true', 'false']),
  })

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}

export function UserFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
}) {
  const isEdit = mode === 'edit'
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(makeSchema(isEdit)) })

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit user' : 'Add user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update details, role, or reset the password.'
              : 'Create a new account and assign a role.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" error={errors.full_name}>
            <Input {...register('full_name')} />
          </Field>

          <Field label="Email" error={errors.email}>
            <Input type="email" disabled={isEdit} {...register('email')} />
          </Field>

          <Field
            label={isEdit ? 'Reset password (optional)' : 'Password'}
            error={errors.password}
          >
            <Input
              type="password"
              placeholder={isEdit ? 'Leave blank to keep current' : ''}
              {...register('password')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Role" error={errors.role}>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Status" error={errors.is_active}>
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
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
