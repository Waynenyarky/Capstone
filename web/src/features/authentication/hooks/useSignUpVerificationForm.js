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
  const { notification } = App.useApp()

  useEffect(() => {
    attemptsRef.current = attempts
  }, [attempts])

  const handleFinish = async (values) => {
    if (attemptsRef.current <= 0) {
      form.setFields([{ name: 'verificationCode', errors: ['Too many attempts, please request a new code'] }])
      return
    }

    // Wait a tick to ensure form state is updated (especially after paste)
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Get value from form state as the source of truth
    let codeRaw = form.getFieldValue('verificationCode') || values.verificationCode
    
    // Handle edge case where OTP might be an array, number, null, undefined, or string
    if (codeRaw === null || codeRaw === undefined || codeRaw === '') {
      return // Let the form's required validation handle empty codes
    }
    
    if (Array.isArray(codeRaw)) {
      codeRaw = codeRaw.join('')
    }
    
    // Convert to string and extract only numeric characters, removing any whitespace or special chars
    let code = String(codeRaw || '').replace(/[^0-9]/g, '')
    
    // Skip validation if code is empty (required validation will handle it)
    if (!code || code.length === 0) {
      return // Let the form's required validation handle empty codes
    }
    
    // Only validate that code contains numbers - let the API handle length and correctness validation
    if (!/^[0-9]+$/.test(code)) {
      notification.error({
        message: 'Invalid Verification Code',
        description: 'Please enter a valid numeric code. Only numbers are allowed.',
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
        key: `otp-validation-${Date.now()}`,
      })
      return
    }
    
    // Don't validate length here - let the API handle it and return proper error messages
    // This ensures "incorrect code" errors come from the API, not client-side validation
    
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
      
      // Safely extract and convert error message to string
      let errorMessage = ''
      try {
        errorMessage = String(err?.message || '')
      } catch (e) {
        errorMessage = ''
      }
      
      const lower = errorMessage.toLowerCase()
      
      if (lower && lower.includes('email already exists')) {
        error('Email is already verified. Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
        return
      }
      
      if (lower && (lower.includes('invalid code') || lower.includes('invalid request'))) {
        const newAttempts = Math.max(0, attemptsRef.current - 1)
        setAttempts(newAttempts)
        
        // Use backend error message if available and valid, otherwise use fallback
        const backendMsg = (errorMessage && 
                           !errorMessage.includes('Request failed') && 
                           !errorMessage.includes('[object Object]') &&
                           !errorMessage.includes('includes is not a function'))
          ? errorMessage
          : 'Incorrect code. Please check and try again.'
        
        notification.error({
          message: 'Incorrect OTP Code',
          description: backendMsg,
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
          key: `otp-error-${Date.now()}`,
        })
        form.setFields([{ name: 'verificationCode', errors: [backendMsg] }])
      } else if (lower && lower.includes('expired')) {
        const expiredMsg = 'The OTP code has expired. Please request a new code.'
        notification.error({
          message: 'OTP Code Expired',
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
          key: `otp-expired-${Date.now()}`,
        })
        form.setFields([{ name: 'verificationCode', errors: [expiredMsg] }])
      } else if (lower && lower.includes('no signup request')) {
        const notFoundMsg = 'No active signup request found. Please start the signup process again.'
        notification.error({
          message: 'Verification Request Not Found',
          description: notFoundMsg,
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
          key: `otp-notfound-${Date.now()}`,
        })
        form.setFields([{ name: 'verificationCode', errors: [notFoundMsg] }])
      } else if (lower && (lower.includes('rate limited') || lower.includes('too many') || lower.includes('wait'))) {
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