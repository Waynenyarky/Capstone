import React from 'react'
import { Form } from 'antd'
import { useProviderSignUp } from '@/features/authentication/hooks'
import { PH_LOCATIONS } from '@/lib/phLocations.js'
import { fetchWithFallback } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { notifyUserSignedUp } from '@/features/admin/users/lib/usersEvents.js'

// Owns provider sign-up flow state and side effects; keeps component UI-only
export function useProviderSignUpFlow({ onSubmit } = {}) {
  const [step, setStep] = React.useState('form')
  const [emailForVerify, setEmailForVerify] = React.useState('')
  const [devCodeForVerify, setDevCodeForVerify] = React.useState('')
  const { success, error } = useNotifier()

  const { form, handleFinish, isSubmitting, categoryOptions, categoriesLoading } = useProviderSignUp({
    onBegin: ({ email, devCode }) => {
      setEmailForVerify(email)
      setDevCodeForVerify(String(devCode || ''))
      setStep('verify')
    },
    onSubmit: typeof onSubmit === 'function' ? onSubmit : console.log,
  })

  // Local provinces/cities implementation (replaces `usePHLocations`)
  const [province, setProvince] = React.useState(null)
  const provincesOptions = React.useMemo(() => (Array.isArray(PH_LOCATIONS.provinces) ? PH_LOCATIONS.provinces.map((p) => ({ label: p, value: p })) : []), [])
  const citiesOptions = React.useMemo(() => {
    if (!province) return []
    const cities = (PH_LOCATIONS.citiesByProvince || {})[province] || []
    return cities.map((c) => ({ label: c, value: c }))
  }, [province])
  const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())
  const provinceSelectProps = React.useMemo(() => ({
    options: provincesOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select province',
    allowClear: true,
    loading: false,
    onChange: (value) => {
      setProvince(value || null)
      if (form) form.setFieldsValue({ province: value || undefined, city: undefined })
    }
  }), [provincesOptions, form])

  const citySelectProps = React.useMemo(() => ({
    options: citiesOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select city',
    allowClear: true,
    disabled: !province,
    loading: false,
  }), [citiesOptions, province])

  // Local supported service areas implementation (replaces `useSupportedServiceAreas`)
  const [areasByProvince, setAreasByProvince] = React.useState([])
  const [serviceAreasLoading, setServiceAreasLoading] = React.useState(false)
  const reloadAreas = React.useCallback(async () => {
    setServiceAreasLoading(true)
    try {
      const res = await fetchWithFallback('/api/service-areas')
      if (!res || !res.ok) {
        error('Failed to load supported service areas')
        setServiceAreasLoading(false)
        return
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setAreasByProvince(list)
    } catch (err) {
      void err
      error('Failed to load supported service areas')
    } finally {
      setServiceAreasLoading(false)
    }
  }, [error])
  React.useEffect(() => { reloadAreas() }, [reloadAreas])

  const activeAreas = React.useMemo(() => {
    const list = Array.isArray(areasByProvince) ? areasByProvince : []
    return list.filter((grp) => grp?.active !== false)
  }, [areasByProvince])

  const allActiveCities = React.useMemo(() => {
    return activeAreas.flatMap((grp) => (Array.isArray(grp?.cities) ? grp.cities : []))
  }, [activeAreas])

  const watchedGroups = Form.useWatch('serviceAreasGroups', form)
  React.useEffect(() => {
    if (!form) return
    const groups = Array.isArray(watchedGroups) ? watchedGroups : []
    const flattened = Array.from(new Set(groups.flatMap((g) => (Array.isArray(g?.cities) ? g.cities : []))))
    try {
      form.setFieldsValue({ serviceAreas: flattened })
    } catch (err) { void err }
  }, [watchedGroups, form])

  const businessTypeValue = Form.useWatch('businessType', form)

  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [reviewValues, setReviewValues] = React.useState(null)

  const handleReview = (values) => {
    const groups = Array.isArray(values?.serviceAreasGroups) ? values.serviceAreasGroups : []
    const flattened = Array.from(new Set(groups.flatMap((g) => (Array.isArray(g?.cities) ? g.cities : []))))
    const nextValues = { ...values, serviceAreas: flattened, isSolo: String(values?.businessType || '') === 'Sole Proprietor' }
    setReviewValues(nextValues)
    setReviewOpen(true)
  }

  const closeReview = React.useCallback(() => setReviewOpen(false), [])

  const confirmReviewSubmission = React.useCallback(async () => {
    if (reviewValues) await handleFinish(reviewValues)
    setReviewOpen(false)
    setReviewValues(null)
  }, [reviewValues, handleFinish])

  const prefillDemo = React.useCallback(() => {
    const ts = Math.floor(Date.now() / 1000)
    const demoEmail = `provider@gmail.com`
    const demoBusinessEmail = `business+${ts}@example.com`

    const categories = Array.isArray(categoryOptions) && categoryOptions.length > 0
      ? categoryOptions.slice(0, Math.min(3, categoryOptions.length)).map((o) => (o?.value ?? o))
      : ['elderly-care', 'home-cleaning']

    let addrProvince = 'PANGASINAN'
    let addrCity = 'SAN CARLOS CITY'

    let serviceAreasGroups = [{ province: addrProvince, cities: [addrCity] }]
    if (Array.isArray(activeAreas) && activeAreas.length > 0) {
      const pangasinanGrp = activeAreas.find(
        (g) => String(g?.province || '').trim().toLowerCase() === 'pangasinan'
      )
      if (pangasinanGrp) {
        const cities = Array.isArray(pangasinanGrp?.cities) ? pangasinanGrp.cities : []
        const hasSanCarlos = cities.some(
          (c) => String(c || '').trim().toLowerCase() === 'san carlos city'
        )
        const citiesPick = hasSanCarlos
          ? ['SAN CARLOS CITY']
          : cities.slice(0, Math.min(2, cities.length))
        serviceAreasGroups = [{
          province: pangasinanGrp.province,
          cities: citiesPick.length > 0 ? citiesPick : [addrCity],
        }]
      } else {
        const grp = activeAreas[0]
        const cities = Array.isArray(grp?.cities) ? grp.cities : []
        const citiesPick = cities.slice(0, Math.min(2, cities.length))
        serviceAreasGroups = [{
          province: grp?.province || addrProvince,
          cities: citiesPick.length > 0 ? citiesPick : [addrCity],
        }]
      }
    }

    try {
      if (provinceSelectProps?.onChange) {
        provinceSelectProps.onChange(addrProvince)
      }
    } catch (err) { void err }

    form.setFieldsValue({
      firstName: 'Test',
      lastName: 'Provider',
      email: demoEmail,
      phoneNumber: '09171234567',
      password: 'bhj680CFD531$',
      confirmPassword: 'bhj680CFD531$',
      businessName: 'Demo Home Care Co',
      businessType: 'Sole Proprietor',
      yearsInBusiness: 3,
      servicesCategories: categories,
      serviceAreasGroups,
      socialLinks: ['https://facebook.com/demo', 'https://instagram.com/demo'],
      streetAddress: '123 Care St',
      province: addrProvince,
      city: addrCity,
      zipCode: '2420',
      businessPhone: '09181234567',
      businessEmail: demoBusinessEmail,
      businessDescription: 'We provide quality home care services.',
      hasInsurance: true,
      hasLicenses: true,
      consentsToBackgroundCheck: true,
      termsAndConditions: true,
    })
    success('Demo data prefilled')
  }, [form, categoryOptions, activeAreas, provinceSelectProps, success])

  const verificationProps = {
    title: 'Verify Your Application',
    email: emailForVerify,
    devCode: devCodeForVerify,
    onSubmit: (created) => {
      success('Application submitted successfully')
      notifyUserSignedUp(created?.user || created)
      try { form?.resetFields?.() } catch (err) { void err }
      setStep('form')
      setEmailForVerify('')
      setDevCodeForVerify('')
    }
  }

  const initialValues = { serviceAreasGroups: [{ province: undefined, cities: [] }], socialLinks: [''] }

  return {
    step,
    form,
    handleFinish,
    isSubmitting,
    initialValues,
    categoryOptions,
    categoriesLoading,
    provinceSelectProps,
    citySelectProps,
    serviceAreasLoading,
    activeAreas,
    allActiveCities,
    businessTypeValue,
    reviewOpen,
    reviewValues,
    handleReview,
    closeReview,
    confirmReviewSubmission,
    prefillDemo,
    verificationProps,
  }
}