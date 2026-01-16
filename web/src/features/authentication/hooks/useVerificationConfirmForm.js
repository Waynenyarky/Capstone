import { Form, App } from 'antd'
import { useState, useCallback } from 'react'
import { changeEmailConfirmVerify } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'

export function useVerificationConfirmForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()
  const { notification } = App.useApp()

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
        const invalidMsg = err?.body?.error || 'The OTP code you entered is incorrect. Please check and try again.'
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
      error(err, 'Failed to verify code')
    } finally {
      setSubmitting(false)
    }
  }, [form, onSubmit, success, error, email])

  return { form, handleFinish, isSubmitting }
}
