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
      const errCode = String(err?.code || '').toLowerCase()
      
      // Check if account deletion is scheduled - user should use email OTP instead
      if (lower.includes('scheduled deletion') || lower.includes('use email otp') || errCode === 'use_email_otp_for_scheduled_deletion') {
        error(
          'Account deletion is scheduled. Please use the email verification code sent to your email instead of TOTP. Check your inbox for the verification code.',
          'Use Email OTP Instead'
        )
        form.setFields([{ 
          name: 'verificationCode', 
          errors: ['Account deletion scheduled - please use email OTP code instead'] 
        }])
      } else if (lower.includes('invalid')) {
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
