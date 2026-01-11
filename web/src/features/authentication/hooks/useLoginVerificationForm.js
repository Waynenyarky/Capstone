import { Form } from 'antd'
import { useState } from 'react'
import { verifyLoginCode } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useLoginVerificationForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, code: values.verificationCode }
    try {
      setSubmitting(true)
      const user = await verifyLoginCode(payload)
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit(user)
    } catch (err) {
      console.error('Login verification error:', err)
      // Prefer field-level error on common code issues when possible
      const lower = String(err?.message || '').toLowerCase()
      if (lower.includes('invalid code')) {
        form.setFields([{ name: 'verificationCode', errors: ['Invalid code'] }])
      } else if (lower.includes('expired')) {
        form.setFields([{ name: 'verificationCode', errors: ['Code expired, please request a new one'] }])
      } else if (lower.includes('no login verification request')) {
        form.setFields([{ name: 'verificationCode', errors: ['No active login verification request, please start again'] }])
      } else {
        error(err, 'Failed to verify code')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}
