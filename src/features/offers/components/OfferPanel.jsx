import { Mail, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Panel } from '@/components/ui/panel'
import { OfferDialog } from '@/features/offers/components/OfferDialog'
import {
  useCreateOffer,
  useOffers,
  useSetOfferStatus,
  useUpdateOffer,
} from '@/features/offers/hooks'
import { optionLabel, useOptions } from '@/features/meta/hooks'
import { errorMessage } from '@/lib/api-error'

const VARIANT = {
  draft: 'secondary',
  sent: 'info',
  accepted: 'success',
  declined: 'destructive',
  withdrawn: 'secondary',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'

// Panel adapts to the candidate's latest hiring decision.
const DECISION = {
  join: {
    title: 'Selected to Join',
    desc: 'Extend an offer letter.',
    letter: { key: 'offer', label: 'Send offer letter' },
  },
  next_round: {
    title: 'Next round',
    desc: 'Send the next round of interview letter.',
    letter: { key: 'next_round', label: 'Send next round letter' },
  },
  on_hold: {
    title: 'On hold',
    desc: 'Optionally send an on-hold letter.',
    letter: { key: 'on_hold', label: 'Send on hold letter', optional: true },
  },
  reject: {
    title: 'Rejected',
    desc: null,
    letter: { key: 'rejected', label: 'Send rejection email' },
  },
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? '—'}</dd>
    </div>
  )
}

export function OfferPanel({ candidate, canManage, decision, onSendLetter }) {
  const { data: options } = useOptions()
  const confirm = useConfirm()
  const { data: offers = [] } = useOffers(candidate.id)
  const offer = offers[0] // most recent

  const createMut = useCreateOffer()
  const updateMut = useUpdateOffer()
  const statusMut = useSetOfferStatus()

  const [dialog, setDialog] = useState({ open: false, offer: null })

  const openCreate = () => setDialog({ open: true, offer: null })
  const openEdit = () => setDialog({ open: true, offer })

  const handleSubmit = (payload) => {
    const opts = {
      onSuccess: () => {
        toast.success(dialog.offer ? 'Offer updated' : 'Offer created')
        setDialog({ open: false, offer: null })
      },
      onError: (e) => toast.error(errorMessage(e, 'Failed to save offer')),
    }
    if (dialog.offer) {
      updateMut.mutate({ id: dialog.offer.id, payload }, opts)
    } else {
      createMut.mutate({ ...payload, candidate_id: candidate.id }, opts)
    }
  }

  const changeStatus = async (status, { confirmText } = {}) => {
    if (confirmText) {
      const ok = await confirm({
        title: confirmText.title,
        description: confirmText.description,
        confirmLabel: confirmText.confirmLabel,
        variant: confirmText.variant,
      })
      if (!ok) return
    }
    statusMut.mutate(
      { id: offer.id, status },
      {
        onSuccess: () => toast.success('Offer updated'),
        onError: (e) => toast.error(errorMessage(e, 'Failed to update offer')),
      },
    )
  }

  const terminal = ['accepted', 'declined', 'withdrawn'].includes(offer?.status)
  const cfg = DECISION[decision]
  // Offer machinery only makes sense for "selected to join" (or before any
  // decision has been recorded). Other states show just their letter action.
  const showOffer = !decision || decision === 'join'
  const letter = cfg?.letter

  return (
    <Panel
      title={cfg?.title ?? 'Offer'}
      action={
        showOffer && canManage && (!offer || terminal) ? (
          <Button variant="ghost" size="sm" onClick={openCreate}>
            <Plus className="size-4" /> {offer ? 'New offer' : 'Create'}
          </Button>
        ) : null
      }
    >
      {cfg && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{cfg.desc}</p>
          {canManage && letter && (
            <Button variant="outline" size="sm" onClick={() => onSendLetter?.(letter.key)}>
              <Mail className="size-4" /> {letter.label}
            </Button>
          )}
        </div>
      )}

      {!showOffer ? null : !offer ? (
        <p className="py-4 text-sm text-muted-foreground">No offer extended yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{offer.title}</span>
            <Badge variant={VARIANT[offer.status] ?? 'secondary'}>
              {optionLabel(options?.offer_statuses, offer.status)}
            </Badge>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <Field label="CTC">{offer.ctc ?? '—'}</Field>
            <Field label="Start">{fmtDate(offer.start_date)}</Field>
            <Field label="Expires">{fmtDate(offer.expiry_date)}</Field>
          </dl>
          {offer.notes && <Field label="Notes">{offer.notes}</Field>}

          {canManage && !terminal && (
            <div className="flex flex-wrap gap-2 pt-1">
              {offer.status === 'draft' && (
                <Button size="sm" onClick={() => changeStatus('sent')}>
                  Send offer
                </Button>
              )}
              {offer.status === 'sent' && (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      changeStatus('accepted', {
                        confirmText: {
                          title: 'Mark offer accepted?',
                          description: 'This moves the candidate to Hired.',
                          confirmLabel: 'Accepted',
                        },
                      })
                    }
                  >
                    Accepted
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      changeStatus('declined', {
                        confirmText: {
                          title: 'Mark offer declined?',
                          description: 'This moves the candidate to Rejected.',
                          confirmLabel: 'Declined',
                          variant: 'destructive',
                        },
                      })
                    }
                  >
                    Declined
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={openEdit}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => changeStatus('withdrawn')}
              >
                Withdraw
              </Button>
            </div>
          )}
        </div>
      )}

      <OfferDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        offer={dialog.offer}
        candidateName={candidate.full_name}
        defaultTitle={candidate.job?.title}
        onSubmit={handleSubmit}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />
    </Panel>
  )
}

export default OfferPanel
