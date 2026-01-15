import { Form, App } from 'antd'
import { useState } from 'react'
import { loginStart, loginPost } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'
import React from 'react'
import { ExclamationCircleOutlined } from '@ant-design/icons'

export function useLogin({ onBegin, onSubmit, onError } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()
  const { notification } = App.useApp()

  const handleFinish = async (values) => {
    const payload = { email: values.email, password: values.password }
    try {
      setSubmitting(true)
      if (typeof onBegin === 'function') {
        const data = await loginStart(payload)
        // Keep fields for user convenience during two-step flow
        const beginResult = await onBegin({ email: values.email, rememberMe: values.rememberMe === true, serverData: data })
        // If the onBegin handler indicates we should proceed immediately (MFA disabled),
        // signal the caller to complete the server-side login rather than performing
        // it inside this hook. This centralizes the finalization and ensures the
        // caller (flow orchestrator) is the only place that marks the session
        // as authenticated.
        if (beginResult && beginResult.proceedWithLogin) {
          if (typeof onSubmit === 'function') {
            // Signal the caller to perform the final server login. Provide the
            // original payload so the caller can call `loginPost` and validate
            // the server response before persisting session state.
            try {
              await onSubmit(null, values, { serverLoginPayload: payload })
            } catch (innerErr) {
              console.error('Login completion (delegated) failed:', innerErr)
              throw innerErr
            }
            return
          }
        } else {
          // Only show the verification-sent message when the flow will proceed
          // to a verification step (i.e., MFA / email code is expected).
          const show = beginResult ? beginResult.showVerificationSent !== false : true
          if (show && data && data.sent === true) success('Verification code sent to your email')
        }
      } else {
        const user = await loginPost(payload)
        const role = String(user?.role || '').toLowerCase()
        // Block admin accounts on the generic login page: show invalid credentials
        if (role === 'admin') {
          const professionalMessage = 'The email address or password you entered is incorrect. Please check your credentials and try again.'
          
          // Show professional toast notification at top center
          notification.error({
            message: React.createElement('span', { style: { fontSize: '16px', fontWeight: 600, color: '#1f1f1f' } }, 'Login Failed'),
            description: React.createElement('span', { style: { fontSize: '14px', color: '#666' } }, professionalMessage),
            placement: 'top',
            top: 24,
            duration: 5,
            icon: React.createElement(ExclamationCircleOutlined, { style: { color: '#ff4d4f', fontSize: '22px' } }),
            style: { 
              width: 400, 
              margin: '0 auto',
              borderRadius: '8px',
              border: '1px solid #ffccc7',
              backgroundColor: '#fff1f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            },
            closeIcon: false,
            key: `login-error-${Date.now()}`,
          })
          
          // Clear any field errors
          form.setFields([
            { name: 'email', errors: [] },
            { name: 'password', errors: [] },
          ])
          return
        }
        success('Logged in successfully')
        form.resetFields()
        if (typeof onSubmit === 'function') onSubmit(user, values)
      }
    } catch (err) {
      let handled = false
      // Notify caller about structured server errors (e.g., locked accounts)
      try {
        if (typeof onError === 'function') {
          handled = onError(err) === true
        }
      } catch { /* ignore onError failures */ }
      if (handled) return

      console.error('Login error:', err)
      const msg = String(err?.message || '').toLowerCase()
      const errorCode = err?.code || ''
      const statusCode = err?.status || 0
      
      // Prefer field-level errors for invalid credentials with professional message
      // Check for invalid credentials by message content, error code, or 401 status
      const isInvalidCredentials = 
        msg.includes('invalid email or password') || 
        msg.includes('invalid_credentials') || 
        msg.includes('the email address or password you entered is incorrect') ||
        errorCode === 'invalid_credentials' ||
        (statusCode === 401 && !errorCode) // Generic 401 likely means invalid credentials
      
      if (isInvalidCredentials) {
        // Use the error message if it's already professional, otherwise use default
        const professionalMessage = msg.includes('the email address or password you entered is incorrect') 
          ? err.message 
          : 'The email address or password you entered is incorrect. Please check your credentials and try again.'
        
        // Show professional toast notification at top center
        notification.error({
          message: React.createElement('span', { style: { fontSize: '16px', fontWeight: 600, color: '#1f1f1f' } }, 'Login Failed'),
          description: React.createElement('span', { style: { fontSize: '14px', color: '#666' } }, professionalMessage),
          placement: 'top',
          top: 24,
          duration: 5,
          icon: React.createElement(ExclamationCircleOutlined, { style: { color: '#ff4d4f', fontSize: '22px' } }),
          style: { 
            width: 400, 
            margin: '0 auto',
            borderRadius: '8px',
            border: '1px solid #ffccc7',
            backgroundColor: '#fff1f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          },
          closeIcon: false,
          key: `login-error-${Date.now()}`,
        })
        
        // Also clear any field errors to avoid duplication
        form.setFields([
          { name: 'email', errors: [] },
          { name: 'password', errors: [] },
        ])
      } else {
        error(err, 'Failed to login')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}
