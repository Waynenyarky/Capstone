import { Form, App } from 'antd'
import { useState } from 'react'
import { verifySignupCode } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

// Generic signup verification hook. Accepts `email` and verifies the code.
// On success, calls `onSubmit` with the created user (and provider if present).
export function useSignUpVerificationForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, code: values.verificationCode }
    try {
      setSubmitting(true)
      const created = await verifySignupCode(payload)
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit(created)
    } catch (err) {
      console.error('Signup verification error:', err)
      const lower = String(err?.message || '').toLowerCase()
      if (lower.includes('invalid code')) {
        form.setFields([{ name: 'verificationCode', errors: ['Invalid code'] }])
      } else if (lower.includes('expired')) {
        form.setFields([{ name: 'verificationCode', errors: ['Code expired, please request a new one'] }])
      } else if (lower.includes('no signup request')) {
        form.setFields([{ name: 'verificationCode', errors: ['No active signup request, please start again'] }])
      } else {
        error(err, 'Failed to verify code')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}