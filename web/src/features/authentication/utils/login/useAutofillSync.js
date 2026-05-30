import React from 'react'

/**
 * Handles browser autofill password syncing into form state.
 * Browsers often don't fire input/change for autofill, so the controlled
 * input stays "" and React overwrites the DOM.
 */
export function useAutofillSync(form, passwordInputRef) {
  const syncAutofillPassword = React.useCallback(() => {
    const el = passwordInputRef.current
    if (!el) return
    const input = (typeof el.input === 'object' && el.input) ? el.input : el
    const domValue = input?.value ?? ''
    if (domValue.length > 0 && (form.getFieldValue('password') ?? '').length === 0) {
      form.setFieldsValue({ password: domValue })
    }
  }, [form, passwordInputRef])

  return { syncAutofillPassword }
}
