import { App } from 'antd'
import { useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { fetchJsonWithFallback } from "@/lib/http.js"
import { authHeaders } from "@/lib/authHeaders.js"
import { useNotifier } from '@/shared/notifications.js'

export function useSendDeleteAccountCode({ email, onSent } = {}) {
  const { success, info, error } = useNotifier()
  const [isSending, setSending] = useState(false)
  const { currentUser } = useAuthSession()

  const handleSend = async () => {
    const targetEmail = email || currentUser?.email
    if (!targetEmail) {
      error('Missing email')
      return
    }
    const payload = { email: targetEmail }
    const headers = authHeaders(currentUser, null, { 'Content-Type': 'application/json' })
    try {
      setSending(true)
      const data = await fetchJsonWithFallback('/api/auth/delete-account/send-code', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      success('Verification code sent to your email')
      if (data?.devCode) {
        info(`Dev code: ${data.devCode}`)
      }
      if (typeof onSent === 'function') onSent({ email: targetEmail, devCode: data?.devCode })
    } catch (err) {
      console.error('Send delete code error:', err)
      error(err, 'Failed to send delete verification code')
    } finally {
      setSending(false)
    }
  }

  return { isSending, handleSend }
}