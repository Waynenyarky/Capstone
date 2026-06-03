import React from 'react'

/**
 * Handles conditional passkey UI — starts passkey autofill when email field
 * is focused, aborts it before modal passkey to avoid "already pending" errors.
 */
export function useConditionalPasskey({ step, form, login, onSubmit, authenticateConditional }) {
  const conditionalPasskeyRef = React.useRef({ controller: null, promise: null })

  const handleEmailFocusForPasskey = React.useCallback(() => {
    if (step !== 'login') return
    if (conditionalPasskeyRef.current.promise) return // already running
    const controller = new AbortController()
    conditionalPasskeyRef.current.controller = controller
    conditionalPasskeyRef.current.promise = authenticateConditional(controller.signal)
      .then((user) => {
        conditionalPasskeyRef.current.promise = null
        conditionalPasskeyRef.current.controller = null
        if (!user) return
        const remember = !!form.getFieldValue('rememberMe')
        login(user, { remember })
        if (typeof onSubmit === 'function') onSubmit(user)
      })
      .catch((err) => {
        conditionalPasskeyRef.current.promise = null
        conditionalPasskeyRef.current.controller = null
        const isAbort = err?.name === 'AbortError' || err?.code === 'user_cancelled'
        const isAlreadyPending = err?.name === 'OperationError' && typeof err?.message === 'string' && err.message.includes('already pending')
        if (!isAbort && !isAlreadyPending) {
          console.error('[LoginForm] Conditional passkey error', err)
        }
      })
  }, [step, form, login, onSubmit, authenticateConditional])

  const getReadyForModalPasskey = React.useCallback(async () => {
    const ref = conditionalPasskeyRef.current
    if (ref.controller) {
      ref.controller.abort()
      if (ref.promise) await ref.promise.catch(() => {})
      ref.controller = null
      ref.promise = null
      // Brief delay so the browser can release the pending request before we start the modal get()
      await new Promise((r) => setTimeout(r, 100))
    }
  }, [])

  // When switching to passkey verification step, abort conditional UI
  React.useEffect(() => {
    if (step !== 'verify-passkey') return
    getReadyForModalPasskey()
  }, [step, getReadyForModalPasskey])

  return { handleEmailFocusForPasskey, getReadyForModalPasskey }
}
