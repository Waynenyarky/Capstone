import { Form, App } from 'antd'
import { useState } from 'react'
import { changePassword } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useChangePasswordForm({ onSubmit, email, resetToken } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, resetToken, password: values.password }
    try {
      setSubmitting(true)
      await changePassword(payload)
      success('Password changed successfully')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit()
    } catch (err) {
      console.error('Change password error:', err)
      error(err, 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}