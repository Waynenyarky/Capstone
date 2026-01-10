import { Form, App } from 'antd'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifySignupCode } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

// Generic signup verification hook. Accepts `email` and verifies the code.
// On success, calls `onSubmit` with the created user (and provider if present).
export function useSignUpVerificationForm({ onSubmit, email } = {}) {
  const [form] = Form.useForm()
  const navigate = useNavigate()
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
    console.log('Verifying signup code with payload:', payload, 'Raw code type:', typeof values.verificationCode)
    try {
      setSubmitting(true)
      const created = await verifySignupCode(payload)
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit(created)
    } catch (err) {
      console.error('Signup verification error:', err)
      if (err.details) console.error('Validation details:', err.details)
      const lower = String(err?.message || '').toLowerCase()
      
      if (lower.includes('email already exists')) {
        error('Email is already verified. Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
        return
      }
      
      if (lower.includes('invalid code') || lower.includes('invalid request')) {
        const newAttempts = Math.max(0, attemptsRef.current - 1)
        setAttempts(newAttempts)
        const msg = newAttempts > 0 
          ? `Invalid code. ${newAttempts} attempts remaining` 
          : 'Invalid code. Max attempts reached'
        form.setFields([{ name: 'verificationCode', errors: [msg] }])
      } else if (lower.includes('expired')) {
        form.setFields([{ name: 'verificationCode', errors: ['Code expired, please request a new one'] }])
      } else if (lower.includes('no signup request')) {
        form.setFields([{ name: 'verificationCode', errors: ['No active signup request, please start again'] }])
      } else if (lower.includes('rate limited') || lower.includes('too many') || lower.includes('wait')) {
        setAttempts(0) // Sync with server
        
        // Parse retry time if available
        const match = lower.match(/(?:in|wait)\s+(\d+)\s*s/i)
        if (match && match[1]) {
             error(`Too many attempts. Please request a new code to try again.`)
        } else {
             error('Too many attempts. Please request a new code.')
        }
      } else {
        error(err, 'Failed to verify code')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting, attempts, setAttempts }
}