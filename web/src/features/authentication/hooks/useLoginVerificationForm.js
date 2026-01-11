import { Form, App } from 'antd'
import { useState, useRef, useEffect } from 'react'
import { verifyLoginCode } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useLoginVerificationForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const [attempts, setAttempts] = useState(5)
  const attemptsRef = useRef(attempts)
  const { success, error } = useNotifier()

  useEffect(() => {
    attemptsRef.current = attempts
  }, [attempts])

  const handleFinish = async (values) => {
    if (attemptsRef.current <= 0) {
      form.setFields([{ name: 'verificationCode', errors: ['Too many attempts, please request a new code'] }])
      return
    }

    let codeRaw = values.verificationCode
    // Handle edge case where OTP might be an array or number
    if (Array.isArray(codeRaw)) codeRaw = codeRaw.join('')
    const code = String(codeRaw || '').trim()

    const payload = { email, code }
    console.log('Verifying login code with payload:', payload)
    try {
      setSubmitting(true)
      const user = await verifyLoginCode(payload)
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit(user)
    } catch (err) {
      console.error('Login verification error:', err)
      // Prefer field-level error on common code issues when possible
      const lower = String(err?.message || '').toLowerCase()
      if (lower.includes('invalid code')) {
        const newAttempts = Math.max(0, attemptsRef.current - 1)
        setAttempts(newAttempts)
        const msg = newAttempts > 0 
          ? `Invalid code. ${newAttempts} attempts remaining` 
          : 'Invalid code. Max attempts reached'
        form.setFields([{ name: 'verificationCode', errors: [msg] }])
      } else if (lower.includes('expired')) {
        form.setFields([{ name: 'verificationCode', errors: ['Code expired, please request a new one'] }])
      } else if (lower.includes('no login verification request')) {
        form.setFields([{ name: 'verificationCode', errors: ['No active login verification request, please start again'] }])
      } else {
        error(err, 'Failed to verify code')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting, attempts, setAttempts }
}