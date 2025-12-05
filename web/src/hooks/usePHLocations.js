import { useEffect, useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"

export function usePHLocations(form) {
  const [province, setProvince] = useState(null)
  const [provincesOptions, setProvincesOptions] = useState([])
  const [citiesOptions, setCitiesOptions] = useState([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProvinces() {
      setLoadingProvinces(true)
      const res = await fetchWithFallback('/api/locations/provinces')
      let data = []
      if (res && res.ok) {
        data = await res.json()
      }
      if (!cancelled) {
        setProvincesOptions((data || []).map((p) => ({ label: p.name || p, value: p.value || p })))
        setLoadingProvinces(false)
      }
    }
    loadProvinces()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadCities() {
      if (!province) {
        setCitiesOptions([])
        return
      }
      setLoadingCities(true)
      const params = new URLSearchParams({ province })
      const res = await fetchWithFallback(`/api/locations/cities?${params.toString()}`)
      let data = []
      if (res && res.ok) {
        data = await res.json()
      }
      if (!cancelled) {
        setCitiesOptions((data || []).map((c) => ({ label: c.name || c, value: c.value || c })))
        setLoadingCities(false)
      }
    }
    loadCities()
    return () => {
      cancelled = true
    }
  }, [province])

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())

  const provinceSelectProps = {
    options: provincesOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select province',
    allowClear: true,
    loading: loadingProvinces,
    onChange: (value) => {
      setProvince(value || null)
      if (form) {
        form.setFieldsValue({ province: value || undefined, city: undefined })
      }
    },
  }

  const citySelectProps = {
    options: citiesOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select city',
    allowClear: true,
    disabled: !province,
    loading: loadingCities,
  }

  return { provinceSelectProps, citySelectProps }
}