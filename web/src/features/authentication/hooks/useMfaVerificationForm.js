import { Form } from '@/shared/components/AppForm'
import { useState } from 'react'
import { verifyForgotPasswordMfa } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useMfaVerificationForm({ email, onSubmit, form }) {
  const [isSubmitting, setSubmitting] = useState(false)
  const { error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email, code: values.code }
    try {
      setSubmitting(true)
      const result = await verifyForgotPasswordMfa(payload)
      form.resetFields()
      if (typeof onSubmit === 'function') {
        onSubmit({ 
          email, 
          resetToken: result.resetToken, 
          allowedToReset: result.allowedToReset 
        })
      }
    } catch (err) {
      console.error('MFA verification error:', err)
      const message = err?.message || 'Failed to verify authentication code'
      error(err, message)
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}
