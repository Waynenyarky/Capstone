import { useMemo, useState } from 'react'
import { useSupportedServiceAreas } from "@/hooks/useSupportedServiceAreas.js"

export function useSupportedAreasSelectProps(form) {
  const { areasByProvince, isLoading } = useSupportedServiceAreas()

  const activeAreas = useMemo(() => {
    const list = Array.isArray(areasByProvince) ? areasByProvince : []
    return list.filter((grp) => grp?.active !== false)
  }, [areasByProvince])

  const provincesOptions = useMemo(() => {
    return activeAreas
      .map((grp) => ({ label: grp?.province || '', value: grp?.province || '' }))
      .filter((opt) => !!opt.label && !!opt.value)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [activeAreas])

  const [selectedProvince, setSelectedProvince] = useState(null)

  const cityOptions = useMemo(() => {
    const norm = String(selectedProvince || '').trim().toLowerCase()
    const grp = activeAreas.find((g) => String(g?.province || '').trim().toLowerCase() === norm)
    const cities = Array.isArray(grp?.cities) ? grp.cities : []
    return cities
      .map((name) => ({ label: String(name || ''), value: String(name || '') }))
      .filter((opt) => !!opt.label && !!opt.value)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [activeAreas, selectedProvince])

  const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())

  const provinceSelectProps = {
    options: provincesOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select province',
    allowClear: true,
    loading: isLoading,
    onChange: (value) => {
      setSelectedProvince(value || null)
      if (form) {
        form.setFieldsValue({ serviceAreasProvince: value || undefined, serviceAreas: [] })
      }
    },
  }

  const citySelectProps = {
    options: cityOptions,
    showSearch: true,
    filterOption,
    placeholder: 'Select cities from chosen province',
    allowClear: true,
    disabled: !selectedProvince,
    loading: isLoading,
  }

  const allActiveCities = useMemo(() => {
    return activeAreas.flatMap((grp) => (Array.isArray(grp?.cities) ? grp.cities : []))
  }, [activeAreas])

  return { provinceSelectProps, citySelectProps, allActiveCities, loading: isLoading }
}