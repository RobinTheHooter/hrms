import { FileText } from 'lucide-react'

/**
 * CV cell: opens an external resume URL, or streams an uploaded file via
 * onView(data). Muted dash when neither is present.
 * cellRendererParams: { onView(data) }
 */
export function ResumeRenderer(params) {
  const { data, onView } = params

  if (data?.resume_url) {
    return (
      <a
        href={data.resume_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <FileText className="size-3.5" /> View
      </a>
    )
  }

  if (data?.has_resume_file) {
    return (
      <button
        onClick={() => onView?.(data)}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <FileText className="size-3.5" /> View
      </button>
    )
  }

  return <span className="text-xs text-muted-foreground">—</span>
}

export default ResumeRenderer
