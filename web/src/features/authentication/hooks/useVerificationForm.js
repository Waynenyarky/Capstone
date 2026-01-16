import { Form, App } from 'antd'
import { useState, useCallback } from 'react'
import { verifyResetCode } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useVerificationForm({ onSubmit, email, devCode } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()
  const { notification } = App.useApp()

  const prefillDevCode = useCallback(() => {
    if (!devCode) return
    form.setFieldsValue({ verificationCode: String(devCode) })
    success('Dev code prefilled')
  }, [form, devCode, success])

  const handleFinish = async (values) => {
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
    try {
      setSubmitting(true)
      const res = await verifyResetCode(payload)
      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({}))
        // Safely extract error message
        let msg = ''
        try {
          msg = String(err?.error || '')
        } catch (e) {
          msg = ''
        }
        const status = res?.status
        const lower = typeof msg === 'string' ? msg.toLowerCase() : ''

        // Prefer field-level error on common code issues with user-friendly messages
        if (status === 401 || (lower && (lower.includes('invalid code') || lower.includes('incorrect')))) {
          const friendlyMsg = (typeof msg === 'string' && msg && 
                             !msg.includes('Request failed') && 
                             !msg.includes('[object Object]') &&
                             !msg.includes('includes is not a function'))
            ? msg
            : 'Incorrect code. Please check and try again.'
          notification.error({
            message: 'Incorrect OTP Code',
            description: friendlyMsg,
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
          form.setFields([{ name: 'verificationCode', errors: [friendlyMsg] }])
          return
        }
        if (status === 410 || (lower && lower.includes('expired'))) {
          const friendlyMsg = (typeof msg === 'string' && msg && 
                             !msg.includes('Request failed') && 
                             !msg.includes('[object Object]') &&
                             !msg.includes('includes is not a function'))
            ? msg
            : 'The OTP code has expired. Please request a new code.'
          notification.error({
            message: 'OTP Code Expired',
            description: friendlyMsg,
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
          form.setFields([{ name: 'verificationCode', errors: [friendlyMsg] }])
          return
        }
        if (status === 404 || (lower && (lower.includes('no reset request') || lower.includes('not found')))) {
          const friendlyMsg = (typeof msg === 'string' && msg && 
                             !msg.includes('Request failed') && 
                             !msg.includes('[object Object]') &&
                             !msg.includes('includes is not a function'))
            ? msg
            : 'No active verification request found. Please request a new code.'
          notification.error({
            message: 'Verification Request Not Found',
            description: friendlyMsg,
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
          form.setFields([{ name: 'verificationCode', errors: [friendlyMsg] }])
          return
        }
        // For other errors, provide user-friendly message
        const friendlyMsg = (typeof msg === 'string' && msg && 
                           !msg.includes('Request failed') && 
                           !msg.includes('[object Object]') &&
                           !msg.includes('includes is not a function'))
          ? msg
          : 'Incorrect code. Please try again.'
        throw new Error(friendlyMsg)
      }
      const data = await res.json()
      success('Code verified')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit({ email, resetToken: data?.resetToken })
    } catch (err) {
      console.error('Verification error:', err)
      
      // Extract error message safely
      let errorMessage = ''
      try {
        if (err?.message) {
          errorMessage = String(err.message)
        } else if (typeof err === 'string') {
          errorMessage = err
        }
      } catch (e) {
        errorMessage = ''
      }
      
      const lower = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : ''
      
      // Handle specific OTP errors
      if (lower && (lower.includes('invalid code') || lower.includes('incorrect') || lower.includes('401'))) {
        // Use backend error message if available and valid, otherwise use fallback
        const backendMsg = (typeof errorMessage === 'string' && errorMessage && 
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
      } else if (lower && (lower.includes('expired') || lower.includes('410'))) {
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
      } else {
        // Show user-friendly error message
        const friendlyMsg = (typeof errorMessage === 'string' && errorMessage && 
                           !errorMessage.includes('Request failed') && 
                           !errorMessage.includes('[object Object]') &&
                           !errorMessage.includes('includes is not a function'))
          ? errorMessage
          : 'Incorrect code. Please try again.'
        notification.error({
          message: 'Verification Failed',
          description: friendlyMsg,
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
        form.setFields([{ name: 'verificationCode', errors: [friendlyMsg] }])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting, prefillDevCode }
}