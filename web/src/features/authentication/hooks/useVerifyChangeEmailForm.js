import { Form } from 'antd'
import { useState, useCallback } from 'react'
import { changeEmailVerify, getProfile } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from '@/features/authentication/hooks'

export function useVerifyChangeEmailForm({ onSubmit, email, currentEmail } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()
  const { login } = useAuthSession()

  const handleFinish = useCallback(async (values) => {
    const payload = { currentEmail, email, code: values.verificationCode }
    try {
      setSubmitting(true)
      await changeEmailVerify(payload)
      // Fetch updated profile and update session
      const updated = await getProfile()
      try {
        const localRaw = localStorage.getItem('auth__currentUser')
        const remember = !!localRaw
        login(updated, { remember })
      } catch {
        login(updated, { remember: false })
      }
      success('Email changed and verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email: updated?.email })
    } catch (err) {
      console.error('Verify new email error:', err)
      error(err, 'Failed to verify new email')
    } finally {
      setSubmitting(false)
    }
  }, [form, onSubmit, success, error, login, currentEmail, email])

  return { form, handleFinish, isSubmitting }
}
