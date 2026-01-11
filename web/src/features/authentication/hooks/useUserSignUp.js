import { Form } from 'antd'
import { notifyUserSignedUp } from "@/features/admin/users/lib/usersEvents.js"
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signupStart, signup } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useUserSignUp({ onBegin, onSubmit } = {}) {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: String(values.email || '').trim(),
      phoneNumber: values.phoneNumber,
      password: values.password,
      termsAccepted: values.termsAndConditions === true,
      role: values.role || 'business_owner',
    }

    try {
      setSubmitting(true)
      if (typeof onBegin === 'function') {
        const data = await signupStart(payload)
        success('Verification code sent to your email')
        onBegin({ email: values.email, serverData: data })
      } else {
        const created = await signup(payload)
        success('Account created successfully')
        form.resetFields()
        if (typeof onSubmit === 'function') onSubmit(created)
        notifyUserSignedUp(created)
      }
    } catch (err) {
      console.error('Signup error:', err)
      const msg = String(err?.message || '').toLowerCase()

      if (msg.includes('email already exists')) {
        error('Email is already verified. Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      if (msg.includes('too many') || msg.includes('wait')) {
          // Extract seconds if present
          const match = msg.match(/(?:in|wait)\s+(\d+)\s*s/i)
          if (match && match[1]) {
              error(`Too many requests. Please wait ${match[1]}s before trying again.`)
          } else {
              error('Too many requests. Please wait a moment.')
          }
      } else {
          error(err, 'Failed to create account')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting }
}
