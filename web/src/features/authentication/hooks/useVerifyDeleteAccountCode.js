import { Form, App } from 'antd'
import { useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useVerifyDeleteAccountCode({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()
  const { notification } = App.useApp()

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
          const invalidMsg = msg || 'The OTP code you entered is incorrect. Please check and try again.'
          notification.error({
            message: 'Incorrect OTP Code',
            description: invalidMsg,
            placement: 'top',
            top: 24,
            duration: 4,
            style: { 
              width: 400, 
              margin: '0 auto',
              borderRadius: '8px',
              border: '1px solid #ffccc7',
              backgroundColor: '#fff1f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            },
            key: `otp-error-${Date.now()}`,
          })
          form.setFields([{ name: 'verificationCode', errors: [invalidMsg] }])
          return
        }
        if (status === 410 || lower.includes('expired')) {
          const expiredMsg = msg || 'The OTP code has expired. Please request a new code.'
          notification.error({
            message: 'OTP Code Expired',
            description: expiredMsg,
            placement: 'top',
            top: 24,
            duration: 4,
            style: { 
              width: 400, 
              margin: '0 auto',
              borderRadius: '8px',
              border: '1px solid #ffccc7',
              backgroundColor: '#fff1f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            },
            key: `otp-expired-${Date.now()}`,
          })
          form.setFields([{ name: 'verificationCode', errors: [expiredMsg] }])
          return
        }
        if (status === 404 || lower.includes('no delete request')) {
          const notFoundMsg = msg || 'No active delete request found. Please request a new code.'
          notification.error({
            message: 'Verification Request Not Found',
            description: notFoundMsg,
            placement: 'top',
            top: 24,
            duration: 4,
            style: { 
              width: 400, 
              margin: '0 auto',
              borderRadius: '8px',
              border: '1px solid #ffccc7',
              backgroundColor: '#fff1f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            },
            key: `otp-notfound-${Date.now()}`,
          })
          form.setFields([{ name: 'verificationCode', errors: [notFoundMsg] }])
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