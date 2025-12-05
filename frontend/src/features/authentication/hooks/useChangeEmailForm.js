import { Form, App } from 'antd'
import { useState } from 'react'
import { useAuthSession } from "@/features/authentication/hooks"
import { changeEmail } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useChangeEmailForm({ onSubmit, email, resetToken } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { login } = useAuthSession()
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, resetToken, newEmail: values.newEmail }
    try {
      setSubmitting(true)
      const updatedUser = await changeEmail(payload)
      success('Email changed successfully')
      form.resetFields()

      // Persist updated session based on existing storage type
      try {
        const localRaw = localStorage.getItem('auth__currentUser')
        const remember = !!localRaw
        login(updatedUser, { remember })
      } catch {
        // Fall back to simple event bus update via login without remember
        login(updatedUser, { remember: false })
      }

      if (typeof onSubmit === 'function') onSubmit(updatedUser)
    } catch (err) {
      console.error('Change email error:', err)
      error(err, 'Failed to change email')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}