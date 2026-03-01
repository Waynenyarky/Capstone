import { Form } from '@/shared/components/AppForm'
import { useState } from 'react'
import { sendForgotPassword } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useForgotPasswordForm({ onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email: values.email }
    try {
      setSubmitting(true)
      await sendForgotPassword(payload)
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email: payload.email })
    } catch (err) {
      console.error('Forgot password error:', err)
      const message = err?.message || 'Failed to send reset code'
      error(err, message)
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}