import { useState } from 'react'

/**
 * Manages password strength state for signup form.
 */
export function usePasswordStrength(initialValue = '') {
  const [passwordValue, setPasswordValue] = useState(initialValue)
  return { passwordValue, setPasswordValue }
}
