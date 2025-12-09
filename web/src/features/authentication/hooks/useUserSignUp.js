import { Form } from 'antd'
import { notifyUserSignedUp } from "@/features/admin/users/lib/usersEvents.js"
import { useState } from 'react'
import { signupStart, signup } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useUserSignUp({ onBegin, onSubmit } = {}) {
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
      role: 'user',
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

  const prefillDemo = () => {
    try {
      form.setFieldsValue({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phoneNumber: '5550101',
        password: 'StrongPass1!',
        confirmPassword: 'StrongPass1!',
        termsAndConditions: true,
      })
    } catch (err) { void err }
  }

  return { form, handleFinish, isSubmitting, prefillDemo }
}
