import { AlertTriangle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const ConfirmContext = createContext(null)

const DEFAULTS = {
  title: 'Are you sure?',
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default', // 'default' | 'destructive'
}

/**
 * App-wide themed confirmation dialog. Mount <ConfirmProvider> once near the
 * root, then call `const confirm = useConfirm()` and `await confirm({...})`
 * anywhere — it resolves true/false. Replaces native window.confirm().
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: DEFAULTS, busy: false })
  const resolver = useRef(null)

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setState({ open: true, options: { ...DEFAULTS, ...options }, busy: false })
      }),
    [],
  )

  const settle = (result) => {
    setState((s) => ({ ...s, open: false }))
    resolver.current?.(result)
    resolver.current = null
  }

  const { options, open } = state
  const destructive = options.variant === 'destructive'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => !o && settle(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {destructive && (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </span>
              )}
              <div className="space-y-1">
                <DialogTitle>{options.title}</DialogTitle>
                {options.description && (
                  <DialogDescription>{options.description}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {options.cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {options.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
