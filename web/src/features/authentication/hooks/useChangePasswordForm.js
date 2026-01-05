import { Form, App } from 'antd'
import { useState } from 'react'
import { changePassword, changePasswordAuthenticated } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useChangePasswordForm({ onSubmit, email, resetToken } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, resetToken, currentPassword: values.currentPassword, password: values.password }
    try {
      setSubmitting(true)
      // If user provided a current password, prefer the authenticated change endpoint
      if (values.currentPassword) {
        await changePasswordAuthenticated({ currentPassword: values.currentPassword, newPassword: values.password })
        success('Password changed successfully')
      } else {
        // Reset flow: use reset token to change password
        await changePassword(payload)
        success('Password changed successfully')
      }
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