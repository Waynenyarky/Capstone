import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Form } from '@/shared/components/AppForm'
import { App } from 'antd'
import dayjs from 'dayjs'
import { useAuthSession } from "@/features/authentication"
import {
  getUserProfile,
  updateUserProfile,
  updateBusinessOwnerProfileName,
  updateBusinessOwnerProfileContact,
  updateBusinessOwnerProfilePis,
} from "@/features/user/services/userService.js"
import { useAuthNotification, useNotifier } from '@/shared/notifications.js'
import { setFormError } from '@/shared/utils/errorMessages.js'

export function useEditUserProfileForm({ onSubmit } = {}) {
  const [form] = Form.useForm()
  const { modal } = App.useApp()
  const [isLoading, setLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const { currentUser, role, login } = useAuthSession()
  const { notificationSuccess } = useAuthNotification()
  const { error } = useNotifier()
  
  const initialValuesRef = useRef({})
  const [isDirty, setDirty] = useState(false)
  const [, setOptimisticValues] = useState(null)

  const roleSlug = String(role?.slug || role || '').toLowerCase()
  const isBusinessOwner = roleSlug === 'business_owner'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUserProfile(currentUser, role)
      const base = {
        firstName: data?.firstName || '',
        lastName: data?.lastName || '',
        phoneNumber: data?.phoneNumber || '09',
      }
      const values = isBusinessOwner
        ? {
            ...base,
            middleName: data?.middleName ?? '',
            suffix: data?.suffix ?? '',
            sex: data?.sex ?? undefined,
            dateOfBirth: data?.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
            email: data?.email ?? '',
            maritalStatus: data?.maritalStatus ?? undefined,
            placeOfBirth: data?.placeOfBirth ?? '',
            nationality: data?.nationality ?? '',
            fatherName: data?.fatherName ?? '',
            motherName: data?.motherName ?? '',
            distinctiveMark: data?.distinctiveMark ?? '',
            highestEducationalAttainment: data?.highestEducationalAttainment ?? undefined,
            address: {
              streetAddress: data?.address?.street ?? '',
              postalCode: data?.address?.zipCode ?? '',
              province: data?.address?.province ?? undefined,
              city: data?.address?.city ?? undefined,
              barangay: data?.address?.barangay ?? undefined,
              provinceName: data?.address?.provinceName ?? '',
              cityName: data?.address?.cityName ?? '',
              barangayName: data?.address?.barangayName ?? '',
            },
          }
        : base
      form.setFieldsValue(values)
      initialValuesRef.current = values
      setDirty(false)
    } catch (err) {
      console.error('Load user profile error:', err)
      error(err, 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [form, currentUser, role, error, isBusinessOwner])

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
    const fmt = (v) => (v === undefined || v === null || v === '') ? '(empty)' : String(v)
    const fmtDate = (v) => (!v) ? '(empty)' : (v.toDate ? v.toDate() : v)
    if (newValues.firstName !== oldValues.firstName) {
      changes.push(`First Name: "${fmt(oldValues.firstName)}" → "${fmt(newValues.firstName)}"`)
    }
    if (newValues.lastName !== oldValues.lastName) {
      changes.push(`Last Name: "${fmt(oldValues.lastName)}" → "${fmt(newValues.lastName)}"`)
    }
    if (isBusinessOwner) {
      if (newValues.middleName !== oldValues.middleName) {
        changes.push(`Middle Name: "${fmt(oldValues.middleName)}" → "${fmt(newValues.middleName)}"`)
      }
      if (newValues.suffix !== oldValues.suffix) {
        changes.push(`Suffix: "${fmt(oldValues.suffix)}" → "${fmt(newValues.suffix)}"`)
      }
      if (newValues.sex !== oldValues.sex) {
        changes.push(`Sex: "${fmt(oldValues.sex)}" → "${fmt(newValues.sex)}"`)
      }
      const oldDob = oldValues.dateOfBirth ? (oldValues.dateOfBirth.toDate?.() || oldValues.dateOfBirth) : null
      const newDob = newValues.dateOfBirth ? (newValues.dateOfBirth.toDate?.() || newValues.dateOfBirth) : null
      if (String(oldDob?.toISOString?.() ?? '') !== String(newDob?.toISOString?.() ?? '')) {
        changes.push(`Date of Birth: ${fmtDate(oldValues.dateOfBirth)} → ${fmtDate(newValues.dateOfBirth)}`)
      }
      if (newValues.maritalStatus !== oldValues.maritalStatus) changes.push(`Marital Status: "${fmt(oldValues.maritalStatus)}" → "${fmt(newValues.maritalStatus)}"`)
      if (newValues.placeOfBirth !== oldValues.placeOfBirth) changes.push(`Place of Birth: "${fmt(oldValues.placeOfBirth)}" → "${fmt(newValues.placeOfBirth)}"`)
      if (newValues.nationality !== oldValues.nationality) changes.push(`Nationality: "${fmt(oldValues.nationality)}" → "${fmt(newValues.nationality)}"`)
      if (newValues.highestEducationalAttainment !== oldValues.highestEducationalAttainment) changes.push(`Education: "${fmt(oldValues.highestEducationalAttainment)}" → "${fmt(newValues.highestEducationalAttainment)}"`)
      if (newValues.fatherName !== oldValues.fatherName) changes.push(`Father's Name: "${fmt(oldValues.fatherName)}" → "${fmt(newValues.fatherName)}"`)
      if (newValues.motherName !== oldValues.motherName) changes.push(`Mother's Name: "${fmt(oldValues.motherName)}" → "${fmt(newValues.motherName)}"`)
      if (newValues.distinctiveMark !== oldValues.distinctiveMark) changes.push(`Distinctive Mark: "${fmt(oldValues.distinctiveMark)}" → "${fmt(newValues.distinctiveMark)}"`)
      const oldAddr = oldValues.address || {}
      const newAddr = newValues.address || {}
      if (oldAddr.streetAddress !== newAddr.streetAddress || oldAddr.postalCode !== newAddr.postalCode || oldAddr.province !== newAddr.province || oldAddr.city !== newAddr.city || oldAddr.barangay !== newAddr.barangay) {
        changes.push('Address')
      }
    }
    if (newValues.phoneNumber !== oldValues.phoneNumber) {
      changes.push(`Phone Number: "${fmt(oldValues.phoneNumber)}" → "${fmt(newValues.phoneNumber)}"`)
    }
    return changes
  }, [isBusinessOwner])

  const handleFinish = async (values) => {
    const changedFields = getChangedFields(values, initialValuesRef.current)
    
    return new Promise((resolve) => {
      const content = (
        <div>
          <p>You are about to update the following fields:</p>
          <ul style={{ marginTop: 8, marginBottom: 8 }}>
            {changedFields.map((change, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{change}</li>
            ))}
          </ul>
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
            setOptimisticValues(values)
            const previousValues = form.getFieldsValue(true)
            form.setFieldsValue(values)
            initialValuesRef.current = values
            setDirty(false)
            
            try {
              let data = null
              if (isBusinessOwner) {
                const namePayload = {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  middleName: values.middleName ?? '',
                  suffix: values.suffix ?? '',
                  sex: values.sex ?? '',
                  dateOfBirth: values.dateOfBirth ? (values.dateOfBirth.toDate?.() || values.dateOfBirth) : undefined,
                }
                const contactPayload = { phoneNumber: values.phoneNumber }
                const addr = values.address || {}
                const pisPayload = {
                  address: {
                    street: addr.streetAddress ?? '',
                    zipCode: addr.postalCode ?? '',
                    province: addr.province ?? '',
                    city: addr.city ?? '',
                    barangay: addr.barangay ?? '',
                  },
                  maritalStatus: values.maritalStatus ?? '',
                  placeOfBirth: values.placeOfBirth ?? '',
                  nationality: values.nationality ?? '',
                  fatherName: values.fatherName ?? '',
                  motherName: values.motherName ?? '',
                  distinctiveMark: values.distinctiveMark ?? '',
                  highestEducationalAttainment: values.highestEducationalAttainment ?? '',
                }
                const nameRes = await updateBusinessOwnerProfileName(namePayload, currentUser, role)
                const contactRes = await updateBusinessOwnerProfileContact(contactPayload, currentUser, role)
                const pisRes = await updateBusinessOwnerProfilePis(pisPayload, currentUser, role)
                data = { user: { ...currentUser, ...nameRes?.user, ...contactRes?.user, ...pisRes?.user } }
              } else {
                data = await updateUserProfile(
                  { firstName: values.firstName, lastName: values.lastName, phoneNumber: values.phoneNumber },
                  currentUser,
                  role
                )
              }
              notificationSuccess('Profile updated', 'Your profile has been saved successfully.')
              initialValuesRef.current = form.getFieldsValue(true)
              setOptimisticValues(null)

              const nextUser = data?.user || data
              if (!nextUser?.token && currentUser?.token) nextUser.token = currentUser.token
              try {
                const remember = !!localStorage.getItem('auth__currentUser')
                login(nextUser, { remember })
              } catch {
                login(nextUser, { remember: false })
              }
              if (typeof onSubmit === 'function') onSubmit(nextUser)
              resolve()
            } catch (err) {
              console.error('Update user profile error:', err)
              form.setFieldsValue(previousValues)
              initialValuesRef.current = previousValues
              setOptimisticValues(null)
              const currentValues = form.getFieldsValue(true)
              setDirty(JSON.stringify(currentValues) !== JSON.stringify(previousValues))
              const { field, message } = setFormError(form, err)
              if (!field) error(err, message || 'Failed to update profile')
              resolve()
            } finally {
              setSubmitting(false)
            }
          } catch (err) {
            console.error('Update user profile error:', err)
            const { field, message } = setFormError(form, err)
            if (!field) error(err, message || 'Failed to update profile')
            setSubmitting(false)
            resolve()
          }
        },
        onCancel: () => resolve(),
      })
    })
  }

  return { form, isLoading, isSubmitting, handleFinish, reload: load, isDirty, handleValuesChange }
}
