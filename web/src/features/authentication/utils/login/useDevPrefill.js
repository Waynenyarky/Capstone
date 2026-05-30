import React from 'react'

/**
 * Listens for devtools-driven prefill events (global FAB) — only in dev, not in demo-ui.
 */
export function useDevPrefill({
  prefillAdmin, prefillAdmin2, prefillAdmin3,
  prefillUser, prefillLguOfficer, prefillLguManager,
  prefillInspector, prefillCso, prefillInvalid,
  setFieldsReadOnly,
}) {
  React.useEffect(() => {
    if (import.meta.env.DEV !== true || import.meta.env.VITE_DEMO_UI === 'true') return undefined
    const handler = (event) => {
      const preset = event?.detail?.preset
      const map = {
        admin: prefillAdmin,
        admin2: prefillAdmin2,
        admin3: prefillAdmin3,
        business: prefillUser,
        officer: prefillLguOfficer,
        manager: prefillLguManager,
        inspector: prefillInspector,
        cso: prefillCso,
        invalid: prefillInvalid,
      }
      const fn = map[preset]
      if (fn) {
        setFieldsReadOnly(false)
        fn()
      }
    }
    window.addEventListener('devtools:login-prefill', handler)
    return () => window.removeEventListener('devtools:login-prefill', handler)
  }, [prefillAdmin, prefillAdmin2, prefillAdmin3, prefillUser, prefillLguOfficer, prefillLguManager, prefillInspector, prefillCso, prefillInvalid, setFieldsReadOnly])
}
