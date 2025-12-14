import { useState } from 'react'
import { changeEmailConfirmStart } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'

export function useSendCodeForCurrentUserConfirm({ email, onSent } = {}) {
  const { success, error } = useNotifier()
  const [isSending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email) {
      error('Missing email')
      return
    }
    try {
      setSending(true)
      await changeEmailConfirmStart({ currentEmail: email })
      success('Verification code sent to current email')
      if (typeof onSent === 'function') onSent({ email })
    } catch (err) {
      console.error('Send confirm code error:', err)
      error(err, 'Failed to send verification code')
    } finally {
      setSending(false)
    }
  }

  return { isSending, handleSend }
}
