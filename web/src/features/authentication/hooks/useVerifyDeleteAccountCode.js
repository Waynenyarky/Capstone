import { Form, App } from 'antd'
import { useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useVerifyDeleteAccountCode({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, code: values.verificationCode }
    try {
      setSubmitting(true)
      const res = await fetchWithFallback('/api/auth/delete-account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({}))
        const msg = err?.error || ''
        const status = res?.status
        const lower = String(msg).toLowerCase()

        if (status === 401 || lower.includes('invalid code')) {
          form.setFields([{ name: 'verificationCode', errors: [msg || 'Invalid code'] }])
          return
        }
        if (status === 410 || lower.includes('expired')) {
          form.setFields([{ name: 'verificationCode', errors: [msg || 'Code expired, please request a new one'] }])
          return
        }
        if (status === 404 || lower.includes('no delete request')) {
          form.setFields([{ name: 'verificationCode', errors: [msg || 'No active delete request, please send a code first'] }])
          return
        }
        throw new Error(msg || `Verification failed: ${status || 'unknown'}`)
      }
      const data = await res.json()
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email, deleteToken: data?.deleteToken })
    } catch (err) {
      console.error('Verify delete code error:', err)
      error(err, 'Failed to verify delete code')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}