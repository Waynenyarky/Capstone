import { Form, App } from 'antd'
import { notifyUserSignedUp } from "@/features/admin/users/lib/usersEvents.js"
import { useState, useCallback } from 'react'
import { signupStart, signup } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useCustomerSignUp({ onBegin, onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, info, error } = useNotifier()

  const handleFinish = async (values) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      password: values.password,
      termsAccepted: values.termsAndConditions === true,
      role: 'customer',
    }

    try {
      setSubmitting(true)
      if (typeof onBegin === 'function') {
        const data = await signupStart(payload)
        success('Verification code sent to your email')
        if (data?.devCode) info(`Dev code: ${data.devCode}`)
        onBegin({ email: values.email, devCode: data?.devCode })
      } else {
        const created = await signup(payload)
        success('Account created successfully')
        form.resetFields()
        if (typeof onSubmit === 'function') onSubmit(created)
        notifyUserSignedUp(created)
      }
    } catch (err) {
      console.error('Signup error:', err)
      error(err, 'Failed to create account')
    } finally {
      setSubmitting(false)
    }
  }

  const prefillDemo = useCallback(() => {
    form.setFieldsValue({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@gmail.com',
      phoneNumber: '09171234567',
      password: 'bhj680CFD531$',
      confirmPassword: 'bhj680CFD531$',
      termsAndConditions: true,
    })
    success('Demo data prefilled')
  }, [form, success])

  return { form, handleFinish, isSubmitting, prefillDemo }
}