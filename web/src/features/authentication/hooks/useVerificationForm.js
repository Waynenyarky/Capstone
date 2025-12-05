import { Form, App } from 'antd'
import { useState, useCallback } from 'react'
import { verifyResetCode } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useVerificationForm({ onSubmit, email, devCode } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const prefillDevCode = useCallback(() => {
    if (!devCode) return
    form.setFieldsValue({ verificationCode: String(devCode) })
    success('Dev code prefilled')
  }, [form, devCode, success])

  const handleFinish = async (values) => {
    const payload = { email, code: values.verificationCode }
    try {
      setSubmitting(true)
      const res = await verifyResetCode(payload)
      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({}))
        const msg = err?.error || ''
        const status = res?.status
        const lower = String(msg).toLowerCase()

        // Prefer field-level error on common code issues
        if (status === 401 || lower.includes('invalid code')) {
          form.setFields([{ name: 'verificationCode', errors: [msg || 'Invalid code'] }])
          return
        }
        if (status === 410 || lower.includes('expired')) {
          form.setFields([{ name: 'verificationCode', errors: [msg || 'Code expired, please request a new one'] }])
          return
        }
        if (status === 404 || lower.includes('no reset request')) {
          form.setFields([{ name: 'verificationCode', errors: [msg || 'No active reset request, please send a code first'] }])
          return
        }
        throw new Error(msg || `Verification failed: ${status || 'unknown'}`)
      }
      const data = await res.json()
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email, resetToken: data?.resetToken })
    } catch (err) {
      console.error('Verification error:', err)
      // Only show toast for unexpected errors; field-level handled above
      error(err, 'Failed to verify code')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting, prefillDevCode }
}