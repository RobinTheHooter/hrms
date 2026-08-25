import { FileText, Maximize2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadResume } from '@/features/candidates/api'

const PREVIEWABLE = (mime) =>
  mime === 'application/pdf' ||
  (typeof mime === 'string' && (mime.startsWith('text/') || mime.startsWith('image/')))

/**
 * Inline resume preview for uploaded files: shows a scaled thumbnail that
 * expands to a full-quality viewer on click. Falls back to a link for
 * external resume URLs, and a plain open button for non-previewable files
 * (e.g. .docx, which browsers can't render inline).
 */
export function ResumePreview({ candidate }) {
  const [url, setUrl] = useState(null)
  const [mime, setMime] = useState(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!candidate.has_resume_file) return
    let objectUrl
    let cancelled = false
    downloadResume(candidate.id)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        setMime(blob.type)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [candidate.id, candidate.has_resume_file])

  // External link resume — can't reliably embed cross-origin.
  if (candidate.resume_url && !candidate.has_resume_file) {
    return (
      <a
        href={candidate.resume_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <FileText className="size-4" /> View resume (link)
      </a>
    )
  }

  if (!candidate.has_resume_file) {
    return <p className="text-sm text-muted-foreground">No resume on file.</p>
  }

  if (failed) {
    return <p className="text-sm text-destructive">Couldn't load the resume.</p>
  }

  if (!url) {
    return <Skeleton className="h-64 w-full rounded-lg" />
  }

  // Non-previewable (e.g. .docx) — offer to open/download.
  if (!PREVIEWABLE(mime)) {
    return (
      <button
        onClick={() => window.open(url, '_blank')}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <FileText className="size-4" /> View uploaded resume
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-lg border bg-muted/20"
        title="Click to expand"
      >
        <iframe
          src={`${url}#toolbar=0&navpanes=0&view=FitH`}
          title="Resume preview"
          className="pointer-events-none h-64 w-full"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition group-hover:bg-foreground/40 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-sm font-medium shadow">
            <Maximize2 className="size-4" /> Expand
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-[92vh] max-w-5xl p-2">
          <DialogTitle className="sr-only">Resume</DialogTitle>
          <iframe src={url} title="Resume" className="h-full w-full rounded-md" />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ResumePreview
