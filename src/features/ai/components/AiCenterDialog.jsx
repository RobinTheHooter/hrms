import { FileText, Mail, MessageSquareText, Sparkles, UserSearch } from 'lucide-react'
import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmailDraftPanel } from '@/features/ai/components/EmailDraftPanel'
import { InterviewQuestionsPanel } from '@/features/ai/components/InterviewQuestionsPanel'
import { JobDescriptionPanel } from '@/features/ai/components/JobDescriptionPanel'
import { ScreeningInsightsPanel } from '@/features/ai/components/ScreeningInsightsPanel'
import { cn } from '@/lib/utils'

const TOOLS = [
  { key: 'jd', label: 'Job description', icon: FileText },
  { key: 'interview', label: 'Interview questions', icon: MessageSquareText },
  { key: 'email', label: 'Email draft', icon: Mail },
  { key: 'insights', label: 'Screening insights', icon: UserSearch },
]

export function AiCenterDialog({ open, onOpenChange }) {
  const [tool, setTool] = useState('jd')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            AI Center
          </DialogTitle>
          <DialogDescription>
            AI helpers for recruiting — draft descriptions and emails, prep
            interviews, and dig into screening results.
          </DialogDescription>
        </DialogHeader>

        {/* Tool switcher */}
        <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted p-1">
          {TOOLS.map((t) => {
            const Icon = t.icon
            const active = tool === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTool(t.key)}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>

        <div className="pt-2">
          {tool === 'jd' && <JobDescriptionPanel onClose={() => onOpenChange(false)} />}
          {tool === 'interview' && <InterviewQuestionsPanel />}
          {tool === 'email' && <EmailDraftPanel />}
          {tool === 'insights' && <ScreeningInsightsPanel />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AiCenterDialog
