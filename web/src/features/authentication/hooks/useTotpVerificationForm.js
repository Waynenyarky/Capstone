import { Form } from 'antd'
import { useState } from 'react'
import { verifyLoginTotp } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications.js'

export function useTotpVerificationForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, code: values.verificationCode }
    try {
      setSubmitting(true)
      const user = await verifyLoginTotp(payload)
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit(user)
    } catch (err) {
      console.error('TOTP verification error:', err)
      const lower = String(err?.message || '').toLowerCase()
      if (lower.includes('invalid')) {
        form.setFields([{ name: 'verificationCode', errors: ['Invalid code'] }])
      } else if (lower.includes('expired')) {
        form.setFields([{ name: 'verificationCode', errors: ['Code expired'] }])
      } else {
        error(err, 'Failed to verify code')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}

export default useTotpVerificationForm
