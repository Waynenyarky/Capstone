import { useState } from 'react'
import { changeEmailConfirmStart } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'

export function useSendCodeForCurrentUserConfirm({ email, onSent } = {}) {
  const { success, error } = useNotifier()
  const [isSending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email) {
      error('Missing email')
      return { success: false, passkeyBypass: false }
    }
    try {
      setSending(true)
      const res = await changeEmailConfirmStart({ currentEmail: email })

      if (res?.passkeyBypass) {
        return { success: true, passkeyBypass: true }
      }

      success('Verification code sent to current email')
      if (typeof onSent === 'function') onSent({ email })
      return { success: true, passkeyBypass: false }
    } catch (err) {
      console.error('Send confirm code error:', err)
      error(err, 'Failed to send verification code')
      return { success: false, passkeyBypass: false }
    } finally {
      setSending(false)
    }
  }

  return { isSending, handleSend }
}
