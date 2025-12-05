import { Form, App } from 'antd'
import { notifyUserSignedUp } from "@/features/admin/users/lib/usersEvents.js"
import { useEffect, useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"
import { signupStart, signup } from "@/features/authentication/services"
import { useNotifier } from '@/shared/notifications.js'

export function useProviderSignUp({ onBegin, onSubmit } = {}) {
  const [form] = Form.useForm()
  const [isSubmitting, setSubmitting] = useState(false)
  const { success, info, error } = useNotifier()
  const [categoryOptions, setCategoryOptions] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      setCategoriesLoading(true)
      const res = await fetchWithFallback('/api/categories')
      if (res && res.ok) {
        const data = await res.json()
        const opts = Array.isArray(data)
          ? data.map((c) => ({ label: c.name, value: c.name }))
          : []
        if (!cancelled) setCategoryOptions(opts)
      }
      if (!cancelled) setCategoriesLoading(false)
    }
    loadCategories()
    return () => { cancelled = true }
  }, [])

  const handleFinish = async (values) => {
    const payload = {
      role: 'provider',
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      password: values.password,
      termsAccepted: values.termsAndConditions === true,
      // business/profile fields (optional persistence)
      businessName: values.businessName,
      businessType: values.businessType,
      yearsInBusiness: Number(values.yearsInBusiness || 0),
      servicesCategories: values.servicesCategories,
      serviceAreas: values.serviceAreas,
      socialLinks: Array.isArray(values.socialLinks) ? values.socialLinks.filter((s) => !!String(s || '').trim()) : [],
      streetAddress: values.streetAddress,
      city: values.city,
      province: values.province,
      zipCode: values.zipCode,
      businessPhone: values.businessPhone,
      businessEmail: values.businessEmail,
      businessDescription: values.businessDescription,
      hasInsurance: values.hasInsurance === true,
      hasLicenses: values.hasLicenses === true,
      consentsToBackgroundCheck: values.consentsToBackgroundCheck === true,
      isSolo: String(values.businessType || '') === 'Sole Proprietor',
      teamMembers: Array.isArray(values.teamMembers) ? values.teamMembers : [],
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
        success('Application submitted successfully')
        form.resetFields()
        if (typeof onSubmit === 'function') onSubmit(created)
        notifyUserSignedUp(created?.user || created)
      }
    } catch (err) {
      console.error('Provider signup error:', err)
      error(err, 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, handleFinish, isSubmitting, categoryOptions, categoriesLoading }
}
