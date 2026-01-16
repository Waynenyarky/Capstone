import { Form, App } from 'antd'
import { useState } from 'react'
import { verifyLoginTotp } from '@/features/authentication/services/authService'
import { useNotifier } from '@/shared/notifications.js'

export function useTotpVerificationForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()
  const { notification } = App.useApp()

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
        const invalidMsg = 'The authenticator code is incorrect. Please try again.'
        notification.error({
          message: 'Incorrect Code',
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
          key: `totp-error-${Date.now()}`,
        })
        form.setFields([{ name: 'verificationCode', errors: [invalidMsg] }])
      } else if (lower.includes('expired')) {
        const expiredMsg = 'The authenticator code has expired. Please generate a new code.'
        notification.error({
          message: 'Code Expired',
          description: expiredMsg,
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
          key: `totp-expired-${Date.now()}`,
        })
        form.setFields([{ name: 'verificationCode', errors: [expiredMsg] }])
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
