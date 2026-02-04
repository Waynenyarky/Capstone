import { useCallback, useEffect, useState } from 'react'

/**
 * Debounced search hook for Admin Form Definitions table.
 *
 * Keeps a local input state and pushes a debounced value into the page filters.
 */
export function useFormDefinitionsSearch({ initialValue = '', onDebouncedChange, debounceMs = 350 }) {
  const [value, setValue] = useState(initialValue || '')

  useEffect(() => {
    setValue(initialValue || '')
    // We only want this to respond to external resets (e.g., future "Clear" button)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue])

  useEffect(() => {
    const handle = setTimeout(() => {
      onDebouncedChange?.((value || '').trim())
    }, debounceMs)
    return () => clearTimeout(handle)
  }, [debounceMs, onDebouncedChange, value])

  const submitNow = useCallback(() => {
    onDebouncedChange?.((value || '').trim())
  }, [onDebouncedChange, value])

  const clear = useCallback(() => {
    setValue('')
    onDebouncedChange?.('')
  }, [onDebouncedChange])

  return {
    value,
    setValue,
    submitNow,
    clear,
  }
}

