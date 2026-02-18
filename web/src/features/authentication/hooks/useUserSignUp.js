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
    if (values.middleName) payload.middleName = values.middleName
    if (values.suffix) payload.suffix = values.suffix

    // Include PIS fields if provided (step 2 of signup)
    if (values.address) payload.address = values.address
    if (values.sex) payload.sex = values.sex
    if (values.maritalStatus) payload.maritalStatus = values.maritalStatus
    if (values.dateOfBirth) {
      // Convert dayjs/moment to ISO string for API
      payload.dateOfBirth = values.dateOfBirth.toISOString ? values.dateOfBirth.toISOString() : values.dateOfBirth
    }
    if (values.placeOfBirth) payload.placeOfBirth = values.placeOfBirth
    if (values.nationality) payload.nationality = values.nationality
    if (values.spouseName) payload.spouseName = values.spouseName
    if (values.fatherName) payload.fatherName = values.fatherName
    if (values.motherName) payload.motherName = values.motherName
    if (values.distinctiveMark) payload.distinctiveMark = values.distinctiveMark
    if (values.highestEducationalAttainment) payload.highestEducationalAttainment = values.highestEducationalAttainment

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
