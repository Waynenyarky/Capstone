import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Form, App } from 'antd'
import { useAuthSession } from "@/features/authentication"
import { getUserProfile, updateUserProfile } from "@/features/user/services/userService.js"
import { useNotifier } from '@/shared/notifications.js'
import { setFormError } from '@/shared/utils/errorMessages.js'

export function useEditUserProfileForm({ onSubmit } = {}) {
  const [form] = Form.useForm()
  const { modal } = App.useApp()
  const [isLoading, setLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const { currentUser, role, login } = useAuthSession()
  const { success, error } = useNotifier()
  
  const initialValuesRef = useRef({})
  const [isDirty, setDirty] = useState(false)
  // Optimistic values state (set but not read - used for rollback only)
  const [, setOptimisticValues] = useState(null)

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
    } catch {
      // ignore
    }
  }, [])

  const getChangedFields = useCallback((newValues, oldValues) => {
    const changes = []
    if (newValues.firstName !== oldValues.firstName) {
      changes.push(`First Name: "${oldValues.firstName || '(empty)'}" → "${newValues.firstName}"`)
    }
    if (newValues.lastName !== oldValues.lastName) {
      changes.push(`Last Name: "${oldValues.lastName || '(empty)'}" → "${newValues.lastName}"`)
    }
    if (newValues.phoneNumber !== oldValues.phoneNumber) {
      changes.push(`Phone Number: "${oldValues.phoneNumber || '(empty)'}" → "${newValues.phoneNumber}"`)
    }
    return changes
  }, [])

  const handleFinish = async (values) => {
    const changedFields = getChangedFields(values, initialValuesRef.current)
    const isBusinessOwner = String(role?.slug || role || '').toLowerCase() === 'business_owner'
    
    // Show confirmation dialog
    return new Promise((resolve) => {
      const content = (
        <div>
          <p>You are about to update the following fields:</p>
          <ul style={{ marginTop: 8, marginBottom: 8 }}>
            {changedFields.map((change, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{change}</li>
            ))}
          </ul>
          {isBusinessOwner && (
            <p style={{ color: '#ff4d4f', marginTop: 12, marginBottom: 0 }}>
              <strong>Note:</strong> Changes to your profile may require verification.
            </p>
          )}
        </div>
      )

      modal.confirm({
        title: 'Confirm Profile Changes',
        content,
        okText: 'Save Changes',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            setSubmitting(true)
            
            // Optimistic update: show changes immediately
            setOptimisticValues(values)
            const previousValues = form.getFieldsValue(true)
            
            // Update form values optimistically
            form.setFieldsValue(values)
            initialValuesRef.current = values
            setDirty(false)
            
            try {
              const data = await updateUserProfile(values, currentUser, role)
              success('Profile updated')
              
              // Update snapshot with confirmed values
              initialValuesRef.current = form.getFieldsValue(true)
              setOptimisticValues(null)

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
              resolve()
            } catch (err) {
              console.error('Update user profile error:', err)
              
              // Rollback optimistic update on error
              form.setFieldsValue(previousValues)
              initialValuesRef.current = previousValues
              setOptimisticValues(null)
              
              // Recalculate dirty state
              const currentValues = form.getFieldsValue(true)
              const dirty = JSON.stringify(currentValues) !== JSON.stringify(previousValues)
              setDirty(dirty)
              
              const { field, message } = setFormError(form, err)
              if (!field) {
                error(err, message || 'Failed to update profile')
              }
              resolve()
            } finally {
              setSubmitting(false)
            }
          } catch (err) {
            console.error('Update user profile error:', err)
            const { field, message } = setFormError(form, err)
            if (!field) {
              error(err, message || 'Failed to update profile')
            }
            setSubmitting(false)
            resolve()
          }
        },
        onCancel: () => {
          resolve()
        }
      })
    })
  }

  return { form, isLoading, isSubmitting, handleFinish, reload: load, isDirty, handleValuesChange }
}
