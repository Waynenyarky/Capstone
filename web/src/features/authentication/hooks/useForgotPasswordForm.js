import { Form, App } from 'antd'
import { useState } from 'react'
import { sendForgotPassword } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useForgotPasswordForm({ onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, info, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email: values.email }
    try {
      setSubmitting(true)
      const data = await sendForgotPassword(payload)
      success('Verification code sent to your email')
      if (data?.devCode) {
        // Surface dev code for local testing convenience
        info(`Dev code: ${data.devCode}`)
      }
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email: payload.email, devCode: data?.devCode })
    } catch (err) {
      console.error('Forgot password error:', err)
      error(err, 'Failed to send reset code')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}