import { Form } from 'antd'
import { useEffect, useState, useCallback } from 'react'
import { useAuthSession } from "@/features/authentication"
import { getCategories, getProviderProfile, updateProviderProfile } from "@/features/provider/services"
import { useNotifier } from '@/shared/notifications.js'
import { authHeaders } from "@/lib/authHeaders.js"

export function useEditProviderProfileForm({ onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isLoading, setLoading] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, error: notifyError } = useNotifier()
  const [categoryOptions, setCategoryOptions] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const { currentUser, role } = useAuthSession()
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  // Compute headers within actions to ensure fresh session values

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      setCategoriesLoading(true)
      try {
        const data = await getCategories()
        const opts = Array.isArray(data)
          ? data.map((c) => ({ label: c.name, value: c.name }))
          : []
        if (!cancelled) setCategoryOptions(opts)
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }
    loadCategories()
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers = authHeaders(currentUser, role)
      const data = await getProviderProfile(headers)
      setData(data)
      form.setFieldsValue({
        businessName: data?.businessName || '',
        businessType: data?.businessType || undefined,
        yearsInBusiness: data?.yearsInBusiness ?? 0,
        servicesCategories: Array.isArray(data?.servicesCategories) ? data.servicesCategories : [],
        serviceAreas: Array.isArray(data?.serviceAreas) ? data.serviceAreas : [],
        streetAddress: data?.streetAddress || '',
        province: data?.province || undefined,
        city: data?.city || undefined,
        zipCode: data?.zipCode || '',
        businessPhone: data?.businessPhone || '',
        businessEmail: data?.businessEmail || '',
        businessDescription: data?.businessDescription || '',
        hasInsurance: !!data?.hasInsurance,
        hasLicenses: !!data?.hasLicenses,
        consentsToBackgroundCheck: !!data?.consentsToBackgroundCheck,
        isSolo: data?.isSolo !== false,
        teamMembers: Array.isArray(data?.teamMembers) ? data.teamMembers : [],
      })
    } catch (err) {
      console.error('Load provider profile error:', err)
      setError(err)
      notifyError(err, 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [form, currentUser, role, notifyError])

  useEffect(() => {
    load()
  }, [load])

  const handleFinish = async (values) => {
    try {
      setSubmitting(true)
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      await updateProviderProfile(values, headers)
      success('Provider profile updated')
      if (typeof onSubmit === 'function') onSubmit(values)
    } catch (err) {
      console.error('Update provider profile error:', err)
      setError(err)
      notifyError(err, 'Failed to update provider profile')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, isLoading, isSubmitting, handleFinish, reload: load, categoryOptions, categoriesLoading, error, data }
}