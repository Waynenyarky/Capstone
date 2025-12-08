import React from 'react'
import { Card, Form, Input, Select, Button, Flex, Typography } from 'antd'
import { PH_LOCATIONS } from '@/lib/phLocations.js'
import { useAuthSession } from '@/features/authentication'
import { createAddress } from '@/features/customer/addresses/services/customerAddressesService.js'
import { useNotifier } from '@/shared/notifications.js'
import { fetchWithFallback } from '@/lib/http.js'

export default function CustomerOnboarding({ onCompleted }) {
  const [form] = Form.useForm()
  const { currentUser, role } = useAuthSession()
  const { success, error } = useNotifier()
  const [province, setProvince] = React.useState(null)
  const provincesOptions = React.useMemo(() => (Array.isArray(PH_LOCATIONS.provinces) ? PH_LOCATIONS.provinces.map((p) => ({ label: p, value: p })) : []), [])
  const citiesOptions = React.useMemo(() => {
    if (!province) return []
    const cities = (PH_LOCATIONS.citiesByProvince || {})[province] || []
    return cities.map((c) => ({ label: c, value: c }))
  }, [province])
  const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())
  const provinceSelectProps = {
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
  }
  const citySelectProps = {
    options: citiesOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select city',
    allowClear: true,
    disabled: !province,
    loading: false,
  }

  const toTitleCase = (str) => String(str || '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  const findOptionCI = (options, target) => {
    const t = String(target || '').trim().toLowerCase()
    return (Array.isArray(options) ? options : []).find((opt) => String(opt?.value || opt?.label || '').trim().toLowerCase() === t) || null
  }

  const detectLocation = async () => {
    if (!('geolocation' in navigator)) return
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }))
      const { latitude, longitude } = pos.coords || {}
      // Best-effort reverse geocoding via Nominatim, may vary in accuracy
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      const data = await res.json()
      const addr = data?.address || {}
      // Try to map to province/city names expected by PSGC dataset
      const cityGuessRaw = addr.city || addr.town || addr.village || ''
      const provinceGuessRaw = addr.state || addr.province || ''

      // Normalize against PH dataset
      // Load provinces from API to ensure standard capitalization
      let provinceNorm = ''
      try {
        const provRes = await fetchWithFallback('/api/locations/provinces')
        const provData = provRes && provRes.ok ? await provRes.json() : []
        const provOptions = (Array.isArray(provData) ? provData : []).map((p) => ({ label: p.name || p, value: p.value || p }))
        const match = findOptionCI(provOptions, provinceGuessRaw)
        provinceNorm = match ? match.value : toTitleCase(provinceGuessRaw)
      } catch {
        provinceNorm = toTitleCase(provinceGuessRaw)
      }

      // Update province select (enables city select and resets city)
      try {
        if (provinceSelectProps?.onChange) provinceSelectProps.onChange(provinceNorm)
      } catch { /* noop */ }

      // Load cities for selected province and normalize
      let cityNorm = ''
      try {
        const params = new URLSearchParams({ province: provinceNorm })
        const cityRes = await fetchWithFallback(`/api/locations/cities?${params.toString()}`)
        const cityData = cityRes && cityRes.ok ? await cityRes.json() : []
        const cityOptions = (Array.isArray(cityData) ? cityData : []).map((c) => ({ label: c.name || c, value: c.value || c }))
        const cityGuess = String(cityGuessRaw || '')
        // Attempt exact match (case-insensitive)
        const matchCity = findOptionCI(cityOptions, cityGuess)
        if (matchCity) {
          cityNorm = matchCity.value
        } else {
          // Try forgiving match: if guess missing " City" suffix
          const guessWithCity = cityGuess.match(/city$/i) ? cityGuess : `${cityGuess} City`
          const matchCity2 = findOptionCI(cityOptions, guessWithCity)
          cityNorm = matchCity2 ? matchCity2.value : toTitleCase(cityGuess)
        }
      } catch {
        cityNorm = toTitleCase(cityGuessRaw)
      }

      form.setFieldsValue({ province: provinceNorm, city: cityNorm })
      success('Detected approximate location')
    } catch (err) { void err }
  }

  const handleFinish = async (values) => {
    const payload = {
      label: values.label || 'Home',
      streetAddress: values.streetAddress || '',
      city: values.city,
      province: values.province,
      zipCode: values.zipCode || '',
      makePrimary: true,
    }
    try {
      await createAddress(payload, currentUser, role)
      success('Address saved')
      if (typeof onCompleted === 'function') onCompleted()
    } catch (err) {
      error(err, 'Failed to save address')
    }
  }

  return (
    <Card title="Welcome! Let's set up your service address">
      <Typography.Paragraph>
        Provide your address so we can find services near you.
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="label" label="Address Label">
          <Input placeholder="e.g., Home, Work" />
        </Form.Item>
        <Form.Item name="streetAddress" label="Street Address">
          <Input placeholder="House/Street" />
        </Form.Item>
        <Form.Item name="province" label="Province" rules={[{ required: true, message: 'Select province' }]}>
          <Select {...provinceSelectProps} />
        </Form.Item>
        <Form.Item name="city" label="City" rules={[{ required: true, message: 'Select city' }]}>
          <Select {...citySelectProps} />
        </Form.Item>
        <Form.Item name="zipCode" label="Zip Code">
          <Input placeholder="Optional" />
        </Form.Item>
        <Flex justify="space-between" gap="small">
          <Button type="dashed" onClick={detectLocation}>Detect Current Location</Button>
          <Button type="primary" htmlType="submit">Save Address</Button>
        </Flex>
      </Form>
    </Card>
  )
}