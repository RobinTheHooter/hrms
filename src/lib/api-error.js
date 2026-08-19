/** Extract a user-facing message from an axios error, with a fallback. */
export function errorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.detail ??
    (error?.response?.status === 403 ? "You don't have permission." : fallback)
  )
}
