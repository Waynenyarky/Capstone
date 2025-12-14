import { Form } from 'antd'
import { useState, useCallback } from 'react'
import { changeEmailConfirmVerify } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'

export function useVerificationConfirmForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = useCallback(async (values) => {
    const payload = { currentEmail: email, code: values.verificationCode }
    try {
      setSubmitting(true)
      await changeEmailConfirmVerify(payload)
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email })
    } catch (err) {
      console.error('Verification confirm error:', err)
      if (err && err.status === 401) {
        form.setFields([{ name: 'verificationCode', errors: [err?.body?.error || 'Invalid code'] }])
        return
      }
      error(err, 'Failed to verify code')
    } finally {
      setSubmitting(false)
    }
  }, [form, onSubmit, success, error, email])

  return { form, handleFinish, isSubmitting }
}
