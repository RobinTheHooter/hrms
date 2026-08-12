import { z } from 'zod'

export const employeeSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().max(30).optional().or(z.literal('')),
  job_title: z.string().min(1, 'Required'),
  department: z.string().max(150).optional().or(z.literal('')),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  status: z.enum(['active', 'probation', 'on_leave', 'terminated']),
  date_of_joining: z.string().min(1, 'Required'), // yyyy-mm-dd
  salary: z.string().optional().or(z.literal('')),
})

export const emptyEmployee = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  job_title: '',
  department: '',
  employment_type: 'full_time',
  status: 'active',
  date_of_joining: '',
  salary: '',
}

/** Convert form values -> API payload (drop empties, coerce salary). */
export function toPayload(values) {
  return {
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email,
    phone: values.phone || null,
    job_title: values.job_title,
    department: values.department || null,
    employment_type: values.employment_type,
    status: values.status,
    date_of_joining: values.date_of_joining,
    salary: values.salary ? Number(values.salary) : null,
  }
}

/** Convert an API employee -> form values. */
export function toFormValues(employee) {
  return {
    first_name: employee.first_name ?? '',
    last_name: employee.last_name ?? '',
    email: employee.email ?? '',
    phone: employee.phone ?? '',
    job_title: employee.job_title ?? '',
    department: employee.department ?? '',
    employment_type: employee.employment_type ?? 'full_time',
    status: employee.status ?? 'active',
    date_of_joining: employee.date_of_joining ?? '',
    salary: employee.salary != null ? String(employee.salary) : '',
  }
}
