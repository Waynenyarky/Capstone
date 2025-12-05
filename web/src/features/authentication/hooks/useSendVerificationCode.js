import { App } from 'antd'
import { useState } from 'react'
import { sendForgotPassword } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useSendVerificationCode({ email, onSent } = {}) {
  const { success, info, error } = useNotifier()
  const [isSending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email) {
      error('Missing email')
      return
    }
    const payload = { email }
    try {
      setSending(true)
      const data = await sendForgotPassword(payload)
      success('Verification code sent to your email')
      if (data?.devCode) {
        info(`Dev code: ${data.devCode}`)
      }
      if (typeof onSent === 'function') onSent({ email, devCode: data?.devCode })
    } catch (err) {
      console.error('Send code error:', err)
      error(err, 'Failed to send reset code')
    } finally {
      setSending(false)
    }
  }

  return { isSending, handleSend }
}