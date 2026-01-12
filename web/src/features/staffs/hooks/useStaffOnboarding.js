import React, { useState, useEffect } from 'react'
import { Form } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'
import { firstLoginChangeCredentials } from '@/features/authentication/services/authService.js'
import { useNotifier } from '@/shared/notifications'

export function useStaffOnboarding() {
  const navigate = useNavigate()
  const { currentUser, role, login } = useAuthSession()
  const { success, error } = useNotifier()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleKey)
  const mustChange = !!currentUser?.mustChangeCredentials
  const mustMfa = !!currentUser?.mustSetupMfa
  const homePath = '/staff'

  useEffect(() => {
    if (!currentUser?.token) return
    if (!isStaffRole) {
      navigate('/dashboard', { replace: true })
      return
    }
  }, [currentUser, isStaffRole, navigate])

  const stepKey = mustChange ? 'credentials' : (mustMfa ? 'mfa' : 'done')
  const stepIndex = stepKey === 'credentials' ? 0 : (stepKey === 'mfa' ? 1 : 2)

  const handleCredentialsFinish = async (values) => {
    try {
      setSubmitting(true)
      const res = await firstLoginChangeCredentials({
        newPassword: values.password,
        newUsername: values.username,
      })
      const updated = res?.user
      if (updated && typeof updated === 'object') {
        const raw = localStorage.getItem('auth__currentUser')
        const remember = !!raw
        const merged = { ...currentUser, ...updated }
        login(merged, { remember })
      }
      form.resetFields()
      success('Credentials updated')
      navigate('/mfa/setup', { replace: true })
    } catch (e) {
      console.error('First login change credentials error:', e)
      error(e, 'Failed to update credentials')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    form,
    submitting,
    stepIndex,
    mustChange,
    mustMfa,
    currentUser,
    homePath,
    handleCredentialsFinish,
    navigate
  }
}
