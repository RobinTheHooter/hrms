import { Video } from 'lucide-react'

/** Join-link cell for an interview meeting; muted dash when none. */
export function MeetingRenderer(params) {
  const link = params.data?.meeting_link
  if (!link) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <Video className="size-3.5" /> Join
    </a>
  )
}

export default MeetingRenderer
