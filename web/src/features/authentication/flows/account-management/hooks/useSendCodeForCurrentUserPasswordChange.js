import { useState } from 'react'
import { changePasswordStart } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'

export function useSendCodeForCurrentUserPasswordChange({ email } = {}) {
  const { success, error } = useNotifier()
  const [isSending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email) {
      error('Missing email')
      return { success: false, mfaRequired: false }
    }
    try {
      setSending(true)
      const res = await changePasswordStart({ email })

      // Passkey-only users can proceed directly without OTP
      if (res?.passkeyBypass) {
        return { success: true, mfaRequired: false, passkeyBypass: true }
      }
      
      // Check if MFA is required
      if (res?.mfaRequired || res?.mfaEnabled) {
        return { success: true, mfaRequired: true }
      }
      
      // Email OTP sent
      success('Verification code sent to your email')
      return { success: true, mfaRequired: false }
    } catch (err) {
      console.error('Send password confirm code error:', err)
      error(err, 'Failed to send verification code')
      return { success: false, mfaRequired: false }
    } finally {
      setSending(false)
    }
  }

  return { isSending, handleSend }
}
