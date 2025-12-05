import { useCallback, useState } from 'react'

export function useConfirmLogoutModal({ onConfirm } = {}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const show = useCallback(() => setOpen(true), [])
  const hide = useCallback(() => setOpen(false), [])

  const handleConfirm = useCallback(async () => {
    setConfirming(true)
    try {
      if (typeof onConfirm === 'function') await onConfirm()
    } catch (err) {
      // No-op; errors are handled by the caller via notifier
      void err
    } finally {
      setConfirming(false)
      setOpen(false)
    }
  }, [onConfirm])

  return { open, show, hide, confirming, handleConfirm }
}