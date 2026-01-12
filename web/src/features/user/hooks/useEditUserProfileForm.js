import { Form } from 'antd'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthSession } from "@/features/authentication"
import { getUserProfile, updateUserProfile } from "@/features/user/services/userService.js"
import { useNotifier } from '@/shared/notifications.js'

export function useEditUserProfileForm({ onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isLoading, setLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const { currentUser, role, login } = useAuthSession()
  const { success, error } = useNotifier()
  
  const initialValuesRef = useRef({})
  const [isDirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUserProfile(currentUser, role)
      const values = {
        firstName: data?.firstName || '',
        lastName: data?.lastName || '',
        phoneNumber: data?.phoneNumber || '09',
      }
      form.setFieldsValue(values)
      initialValuesRef.current = values
      setDirty(false)
    } catch (err) {
      console.error('Load user profile error:', err)
      error(err, 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [form, currentUser, role, error])

  useEffect(() => {
    load()
  }, [load])

  const handleValuesChange = useCallback((_, allValues) => {
    try {
      const dirty = JSON.stringify(allValues) !== JSON.stringify(initialValuesRef.current)
      setDirty(dirty)
    } catch (err) {
      // ignore
    }
  }, [])

  const handleFinish = async (values) => {
    try {
      setSubmitting(true)
      const data = await updateUserProfile(values, currentUser, role)
      success('Profile updated')
      
      // Update snapshot
      initialValuesRef.current = form.getFieldsValue(true)
      setDirty(false)

      try {
        const localRaw = localStorage.getItem('auth__currentUser')
        const remember = !!localRaw
        const nextUser = data?.user || data
        // Preserve existing token (if server returned only user object)
        if (!nextUser?.token && currentUser?.token) {
          nextUser.token = currentUser.token
        }
        login(nextUser, { remember })
      } catch {
        const nextUser = data?.user || data
        if (!nextUser?.token && currentUser?.token) {
          nextUser.token = currentUser.token
        }
        login(nextUser, { remember: false })
      }

      if (typeof onSubmit === 'function') onSubmit(data?.user || data)
    } catch (err) {
      console.error('Update user profile error:', err)
      const lower = String(err?.message || '').toLowerCase()
      if (lower.includes('phone') && (lower.includes('invalid') || lower.includes('format'))) {
        form.setFields([{ name: 'phoneNumber', errors: ['Enter a valid phone number'] }])
      } else if ((lower.includes('first') && lower.includes('name') && lower.includes('required')) || lower.includes('first name is required')) {
        form.setFields([{ name: 'firstName', errors: ['First name is required'] }])
      } else if ((lower.includes('last') && lower.includes('name') && lower.includes('required')) || lower.includes('last name is required')) {
        form.setFields([{ name: 'lastName', errors: ['Last name is required'] }])
      } else {
        error(err, 'Failed to update profile')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { form, isLoading, isSubmitting, handleFinish, reload: load, isDirty, handleValuesChange }
}
