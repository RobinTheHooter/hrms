import { z } from 'zod'

/**
 * Global validation library.
 *
 * Central home for every form schema in the app plus the reusable field
 * builders they are composed from. Keeping them here (rather than inline in
 * each dialog) means shared rules — email format, "required select", numeric
 * text inputs — are defined once and stay consistent across features.
 */

// ---------------------------------------------------------------------------
// Regex constants
// ---------------------------------------------------------------------------

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/

// ---------------------------------------------------------------------------
// Reusable field builders
// ---------------------------------------------------------------------------

/** A required text field. */
export const requiredString = (message = 'Required') =>
  z.string().trim().min(1, message)

/** An optional text field — empty string is allowed. */
export const optionalString = (max) => {
  let s = z.string().trim()
  if (max) s = s.max(max, `At most ${max} characters`)
  return s.optional().or(z.literal(''))
}

/** A required, well-formed email address. */
export const email = (message = 'Enter a valid email') =>
  z.string().trim().regex(EMAIL_REGEX, message)

/** A required dropdown/select value. */
export const requiredSelect = (message = 'Required') =>
  z.string().min(1, message)

/**
 * A number entered through a text/number input. Kept as a string in the form;
 * when present it must parse to a non-negative number. Empty is allowed.
 */
export const optionalNumericString = (message = 'Enter a valid number') =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => v == null || v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message,
    })

/** A required positive integer coerced from a text/number input. */
export const positiveIntFromString = ({ min = 1, max = 999 } = {}) =>
  z.coerce.number().int('Must be a whole number').min(min, `Min ${min}`).max(max, `Max ${max}`)

/** A password field. `required` toggles whether an empty value is allowed. */
export const password = (required = true, min = 8) =>
  required
    ? z.string().min(min, `At least ${min} characters`)
    : z.string().min(min, `At least ${min} characters`).or(z.literal(''))

/** A required date string (yyyy-mm-dd from a date input). */
export const requiredDate = (message = 'Required') =>
  z.string().min(1, message)

// ---------------------------------------------------------------------------
// Entity schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: email(),
  password: z.string().min(8, 'At least 8 characters'),
})

export const candidateSchema = z.object({
  job_id: requiredSelect('Select a job'),
  full_name: requiredString(),
  email: email(),
  phone: optionalString(),
  current_role: optionalString(),
  experience_years: optionalNumericString(),
  skills: optionalString(),
  source: requiredSelect(),
  current_ctc: optionalNumericString(),
  expected_ctc: optionalNumericString(),
  notice_period_days: optionalNumericString(),
  resume_url: optionalString(),
  stage: requiredSelect(),
  priority: requiredSelect(),
  notes: optionalString(),
})

export const jobSchema = z.object({
  title: requiredString(),
  department: optionalString(),
  location: optionalString(),
  employment_type: requiredSelect(),
  positions: positiveIntFromString({ min: 1, max: 999 }),
  status: requiredSelect(),
  priority: requiredSelect(),
  assigned_consultant_id: z.string(), // 'none' or numeric string
  description: optionalString(),
  required_skills: optionalString(),
})

export const makeUserSchema = (isEdit) =>
  z.object({
    full_name: requiredString(),
    email: email(),
    // Required on create, optional on edit (blank = keep current password).
    password: password(!isEdit),
    role: requiredSelect(),
    is_active: z.enum(['true', 'false']),
  })

export const interviewSchema = z.object({
  candidate_id: requiredSelect('Select a candidate'),
  hiring_manager_id: z.string(),
  mode: requiredSelect(),
  scheduled_at: requiredString('Pick a date & time'),
  location_or_link: optionalString(),
  priority: requiredSelect(),
  notes: optionalString(),
})

export const offerSchema = z.object({
  title: requiredSelect('Select a role'),
  ctc: optionalNumericString(),
  start_date: optionalString(),
  expiry_date: optionalString(),
  notes: optionalString(),
})

export const employeeSchema = z.object({
  first_name: requiredString(),
  last_name: requiredString(),
  email: email(),
  phone: optionalString(30),
  job_title: requiredString(),
  department: optionalString(150),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  status: z.enum(['active', 'probation', 'on_leave', 'terminated']),
  date_of_joining: requiredDate(), // yyyy-mm-dd
  salary: optionalNumericString(),
})
