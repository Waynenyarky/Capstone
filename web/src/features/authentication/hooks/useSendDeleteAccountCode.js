import { useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { deleteAccountStart } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'

export function useSendDeleteAccountCode({ email, onSent } = {}) {
  const { success, error } = useNotifier()
  const [isSending, setSending] = useState(false)
  const { currentUser } = useAuthSession()

  const handleSend = async () => {
    const targetEmail = email || currentUser?.email
    if (!targetEmail) {
      error('Missing email')
      return { success: false }
    }
    const payload = { email: targetEmail }
    try {
      setSending(true)
      const result = await deleteAccountStart(payload)
      if (result?.mfaRequired) {
        if (typeof onSent === 'function') onSent({ email: targetEmail, mfaRequired: true, method: result.method })
        return { success: true, mfaRequired: true, method: result.method }
      }
      if (result?.passkeyBypass) {
        if (typeof onSent === 'function') onSent({ email: targetEmail, passkeyBypass: true, method: result.method })
        return { success: true, passkeyBypass: true, method: result.method }
      }
      success('Verification code sent to your email')
      if (typeof onSent === 'function') onSent({ email: targetEmail, sent: true })
      return { success: true, sent: true }
    } catch (err) {
      console.error('Send delete code error:', err)
      error(err, 'Failed to send delete verification code')
      return { success: false, error: err }
    } finally {
      setSending(false)
    }
  }

  return { isSending, handleSend }
}
