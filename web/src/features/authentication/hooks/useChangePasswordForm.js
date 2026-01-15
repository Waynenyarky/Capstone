import { Form, App } from 'antd'
import { useState } from 'react'
import { changePassword, changePasswordAuthenticated, changePasswordStart, changePasswordVerify } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useChangePasswordForm({ onSubmit, email, resetToken, isLoggedInFlow = false } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const [step, setStep] = useState('password') // 'password' or 'verify'
  const [otpSent, setOtpSent] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    try {
      setSubmitting(true)
      
      // If this is a password reset flow (has valid resetToken and email, NOT logged in flow), use the old flow
      // For logged-in users, always use OTP flow (new endpoints use JWT auth)
      const isResetFlow = resetToken && typeof resetToken === 'string' && resetToken.trim().length > 0 && email && !isLoggedInFlow
      
      if (isResetFlow) {
        const payload = { email, resetToken, password: values.password }
        await changePassword(payload)
        success('Password changed successfully')
        form.resetFields()
        if (typeof onSubmit === 'function') onSubmit()
        return
      }

      // For authenticated users (logged in), always use OTP flow
      if (step === 'password') {
        // Step 1: Send OTP to email
        if (!values.password || !values.confirmPassword) {
          error('Please enter and confirm your new password')
          return
        }
        if (values.password !== values.confirmPassword) {
          form.setFields([{ name: 'confirmPassword', errors: ['Passwords do not match'] }])
          return
        }
        
        await changePasswordStart({ newPassword: values.password })
        setOtpSent(true)
        setStep('verify')
        success('Verification code sent to your email')
        form.setFieldsValue({ verificationCode: '' })
      } else if (step === 'verify') {
        // Step 2: Verify OTP and change password
        if (!values.verificationCode) {
          error('Please enter the verification code')
          return
        }
        
        const user = await changePasswordVerify({ code: values.verificationCode })
        success('Password changed successfully')
        form.resetFields()
        setStep('password')
        setOtpSent(false)
        if (typeof onSubmit === 'function') onSubmit(user)
      }
    } catch (err) {
      console.error('Change password error:', err)
      const lower = String(err?.message || '').toLowerCase()
      if (lower.includes('invalid code') || lower.includes('expired')) {
        if (step === 'verify') {
          form.setFields([{ name: 'verificationCode', errors: [err.message || 'Invalid or expired code'] }])
        }
      } else {
        error(err, 'Failed to change password')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    try {
      const password = form.getFieldValue('password')
      if (!password) {
        error('Please enter your new password first')
        return
      }
      await changePasswordStart({ newPassword: password })
      success('Verification code resent to your email')
    } catch (err) {
      error(err, 'Failed to resend code')
    }
  }

  return { form, handleFinish, isSubmitting, step, otpSent, handleResendCode }
}