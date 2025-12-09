// Lightweight stub for usePHLocations
// Purpose: keep the same public API used across the app while simplifying behavior.
// Replace with the real network-backed implementation when needed.
import { useCallback } from 'react'

export function usePHLocations(form) {
  // These stubs return empty option lists and simple handlers.
  // The shape matches the previous hook so imports won't break.

  const filterOption = useCallback((input, option) => {
    return (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())
  }, [])

  const provinceSelectProps = {
    options: [],
    showSearch: true,
    filterOption,
    placeholder: 'Select province',
    allowClear: true,
    loading: false,
    onChange: (value) => {
      // Keep the same form update behavior if a `form` is provided.
      if (form && typeof form.setFieldsValue === 'function') {
        form.setFieldsValue({ province: value || undefined, city: undefined })
      }
    },
  }

  const citySelectProps = {
    options: [],
    showSearch: true,
    filterOption,
    placeholder: 'Select city',
    allowClear: true,
    disabled: true,
    loading: false,
  }

  return { provinceSelectProps, citySelectProps }
}
