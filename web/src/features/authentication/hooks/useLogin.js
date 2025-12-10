import { Form } from 'antd'
import { useState } from 'react'
import { loginStart, loginPost } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useLogin({ onBegin, onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, info, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = { email: values.email, password: values.password }
    try {
      setSubmitting(true)
      if (typeof onBegin === 'function') {
        const data = await loginStart(payload)
        success('Verification code sent to your email')
        if (data?.devCode) {
          info(`Dev code: ${data.devCode}`)
        }
        // Keep fields for user convenience during two-step flow
        onBegin({ email: values.email, rememberMe: values.rememberMe === true, devCode: data?.devCode })
      } else {
        const user = await loginPost(payload)
        const role = String(user?.role || '').toLowerCase()
        // Block admin accounts on the generic login page: show invalid credentials
        if (role === 'admin') {
          form.setFields([
            { name: 'email', errors: ['Invalid credentials'] },
            { name: 'password', errors: ['Invalid credentials'] },
          ])
          return
        }
        success('Logged in successfully')
        form.resetFields()
        if (typeof onSubmit === 'function') onSubmit(user, values)
      }
    } catch (err) {
      console.error('Login error:', err)
      const msg = String(err?.message || '').toLowerCase()
      // Prefer field-level errors for invalid credentials
      if (msg.includes('invalid email or password') || msg.includes('invalid_credentials')) {
        form.setFields([
          { name: 'email', errors: ['Invalid credentials'] },
          { name: 'password', errors: ['Invalid credentials'] },
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
