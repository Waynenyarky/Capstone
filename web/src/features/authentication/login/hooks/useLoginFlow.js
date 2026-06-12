import React from 'react'
import { useLogin } from './useLogin.js'
import { useAuthSession } from '@/features/authentication/hooks/useAuthSession.js'
import { useRememberedEmail } from '@/features/authentication/hooks/useRememberedEmail.js'
import { loginPost } from '@/features/authentication/services'

// Orchestrates the login UI flow (login -> verify) and keeps
// business logic out of the component.
export function useLoginFlow({ onSubmit, getCaptchaToken } = {}) {
  const { login } = useAuthSession()
  const { initialEmail, rememberEmail, clearRememberedEmail } = useRememberedEmail()
  const isDemoUi = import.meta.env.VITE_DEMO_UI === 'true'
  const devPassword =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SEED_TEMP_PASSWORD) ||
    // eslint-disable-next-line no-undef
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SEED_TEMP_PASSWORD) ||
    'TempPass123!'

  const [step, setStep] = React.useState('login')
  const [emailForVerify, setEmailForVerify] = React.useState(initialEmail || '')
  const [rememberMe, setRememberMe] = React.useState(!!initialEmail)
  const [otpExpiresAt, setOtpExpiresAt] = React.useState(null)
  const [serverLockedUntil, setServerLockedUntil] = React.useState(null)
  const [devCode, setDevCode] = React.useState(null)
  const [mfaRequired, setMfaRequired] = React.useState(null)

  const { form, handleFinish, isSubmitting } = useLogin({
    getCaptchaToken,
    onBegin: async ({ email, rememberMe: rm, serverData } = {}) => {
      setMfaRequired(null)
      setEmailForVerify(email || '')
      setRememberMe(!!rm)
      setDevCode(null)

      // If backend already issued a session (e.g. first-login or "no MFA enrolled, go set it up"), finish and redirect
      // In demo-ui mode, only allow auto-skip when backend forces MFA setup (mustSetupMfa), so user can reach onboarding
      const canAutoComplete = serverData && serverData.skipEmailVerification && (serverData.token || serverData.accessToken)
      const allowInDemoUi = canAutoComplete && serverData.mustSetupMfa === true
      if (canAutoComplete && (allowInDemoUi || !isDemoUi)) {
        try {
          const remember = rm === true
          login(serverData, { remember })
          // Login success notification shown on destination via navigate state (Option A)
          if (remember && email) rememberEmail(email)
          else clearRememberedEmail()
          setStep('login')
          return { showVerificationSent: false }
        } catch (e) {
          console.error('Prefilled login auto-complete failed:', e)
          // fall through to normal flow if something goes wrong
        }
      }

      // capture OTP expiry info from server response if present
      try {
        if (serverData) {
          if (serverData.devCode && !isDemoUi) setDevCode(serverData.devCode)
          if (serverData.expiresAt) {
            setOtpExpiresAt(Number(serverData.expiresAt))
          } else if (serverData.expires_in || serverData.expiresIn) {
            const secs = Number(serverData.expires_in || serverData.expiresIn)
            if (!Number.isNaN(secs)) setOtpExpiresAt(Date.now() + secs * 1000)
          }
        }
      } catch { /* ignore */ }

      // Check if email OTP is forced (e.g., for scheduled deletion accounts)
      // Even if MFA is enabled, use email OTP when forceEmailOtp is true
      if (serverData && serverData.forceEmailOtp === true) {
        setMfaRequired(null)
        setStep('verify')
        return { showVerificationSent: true }
      }

      // Passkey as second factor: no email sent; user must complete sign-in with passkey
      if (serverData && serverData.forceEmailOtp !== true) {
        const method = String(serverData.mfaMethod || '').toLowerCase()
        if (method.includes('passkey')) {
          setMfaRequired(null)
          setStep('verify-passkey')
          return { showVerificationSent: false }
        }
      }

      if (serverData && serverData.mfaEnabled === true) {
        setStep('verify-totp')
        return { showVerificationSent: false }
      }
      if (serverData && serverData.mfaEnabled === false) {
        setStep('verify')
        return { showVerificationSent: true }
      }
      setStep('verify')
      return { showVerificationSent: true }
    },
    onError: (err) => {
      // Try to parse structured lock info from the error object
      try {
        const maybe = err?.body || err?.response || err?.data || err?.originalError || err
        const locked = maybe?.lockedUntil || maybe?.error?.lockedUntil || maybe?.adminLockedUntil || maybe?.locked_until || maybe?.locked_at || maybe?.lockedUntilMs || maybe?.lockedUntilMs || maybe?.locked_until_ms
        if (locked) {
          const lu = Number(locked) || Date.parse(locked)
          if (!Number.isNaN(lu)) setServerLockedUntil(Number(lu))
        }
        // Rate limit (429) or account locked (423): show lockout
        const status = err?.status || maybe?.status
        const code = maybe?.error?.code || maybe?.code || err?.code
        if (status === 423 || code === 'account_locked') {
          const lockedUntil = maybe?.error?.lockedUntil ?? locked
          const lu = Number(lockedUntil) || Date.parse(lockedUntil)
          if (!Number.isNaN(lu)) setServerLockedUntil(Number(lu))
          return true
        }
        if (status === 429 || code === 'login_code_rate_limited' || code === 'login_verify_rate_limited') {
          const retrySec = maybe?.error?.retryAfterSec ?? err?.retryAfterSec
          const sec = Number(retrySec)
          if (Number.isFinite(sec) && sec > 0) {
            setServerLockedUntil(Date.now() + sec * 1000)
          } else {
            setServerLockedUntil(Date.now() + 10 * 60 * 1000) // default 10 min
          }
          return true
        }
        if (code === 'mfa_required') {
          const allowed = maybe?.error?.details?.allowedMethods || []
          const message = maybe?.error?.message || 'Multi-factor authentication is required. Use a passkey or authenticator app.'
          setMfaRequired({
            message,
            allowedMethods: Array.isArray(allowed) && allowed.length ? allowed : ['authenticator', 'passkey'],
            email: form?.getFieldValue('email') || ''
          })
          setStep('login')
          return true
        }
      } catch { /* ignore */ }
      return false
    },
    onSubmit: async (user, values, opts = {}) => {
      // If the call was a delegation request (no user, but caller asked us
      // to finish server login), perform the server call here so we can
      // validate the server response before calling `login()`.
      if (opts && opts.serverLoginPayload) {
        try {
          const payload = opts.serverLoginPayload
          const serverUser = await loginPost(payload)

          // Strict validation: ensure the server returned an actual user-like
          // object (not an error wrapper). We accept if it contains at least
          // one commonly expected field: id, userId, email, role, or a token.
          const isValidServerUser = (u) => {
            if (!u || typeof u !== 'object') return false
            const hasId = !!(u.id || u.userId || u._id)
            const hasEmail = !!u.email
            const hasRole = typeof u.role === 'string'
            const hasToken = !!(u.token || u.accessToken || u.sessionToken)
            return hasId || hasEmail || hasRole || hasToken
          }

          if (!isValidServerUser(serverUser)) {
            console.error('Server returned unexpected login response:', serverUser)
            form.setFields([
              { name: 'email', errors: ['Invalid server response'] },
              { name: 'password', errors: ['Invalid server response'] },
            ])
            return
          }

          // Complete login centrally only after a successful server response
          const remember = values?.rememberMe === true
          login(serverUser, { remember })
          // Login success notification shown on destination via navigate state (Option A)
          const emailToRemember = values?.email
          if (remember) rememberEmail(emailToRemember)
          else clearRememberedEmail()
          if (typeof onSubmit === 'function') onSubmit(serverUser)
          return
        } catch (err) {
          console.error('Delegated server login failed:', err)
          throw err
        }
      }

      // Normal path: caller provided a full server-validated `user` object.
      const remember = values?.rememberMe === true
      login(user, { remember })
      // Login success notification shown on destination via navigate state (Option A)
      const emailToRemember = values?.email
      if (remember) rememberEmail(emailToRemember)
      else clearRememberedEmail()
      if (typeof onSubmit === 'function') onSubmit(user)
    }
  })

  const handleVerificationSubmit = React.useCallback((user) => {
    // Complete login after verification
    login(user, { remember: rememberMe })
    // Login success notification shown on destination via navigate state (Option A)
    if (rememberMe) rememberEmail(emailForVerify)
    else clearRememberedEmail()
    if (typeof onSubmit === 'function') onSubmit(user)
    // Reset step for next time
    setStep('login')
    setDevCode(null)
  }, [login, rememberMe, emailForVerify, rememberEmail, clearRememberedEmail, onSubmit])

  // Start with empty email so we never pre-fill with last remembered (e.g. admin) account
  const initialValues = React.useMemo(() => ({ rememberMe: false, email: '' }), [])

  // Dev helpers to prefill login form (uses VITE_DEV_EMAIL_* or falls back to @example.com)
  const prefill = (email, password) => {
    form.setFieldsValue({ email, password })
  }
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}
  const prefillAdmin = () => prefill(env.VITE_DEV_EMAIL_ADMIN || 'admin@example.com', devPassword)
  const prefillAdmin2 = () => prefill(env.VITE_DEV_EMAIL_ADMIN2 || 'admin2@example.com', devPassword)
  const prefillAdmin3 = () => prefill(env.VITE_DEV_EMAIL_ADMIN3 || 'admin3@example.com', devPassword)
  const prefillUser = () => prefill(env.VITE_DEV_EMAIL_BUSINESS || 'business@example.com', devPassword)
  const prefillLguOfficer = () => prefill(env.VITE_DEV_EMAIL_OFFICER || 'officer@example.com', devPassword)
  const prefillLguOfficer2 = () => prefill(env.VITE_DEV_EMAIL_OFFICER2 || 'officer2@example.com', devPassword)
  const prefillLguManager = () => prefill(env.VITE_DEV_EMAIL_MANAGER || 'manager@example.com', devPassword)
  const prefillInspector = () => prefill(env.VITE_DEV_EMAIL_INSPECTOR || 'inspector@example.com', devPassword)
  const prefillCso = () => prefill(env.VITE_DEV_EMAIL_CSO || 'cso@example.com', devPassword)

  const prefillInvalid = () => prefill('wrong@example.com', 'WrongPassword123!')

  const goBackToLogin = React.useCallback(() => {
    setStep('login')
    setDevCode(null)
  }, [])

  const verificationProps = {
    email: emailForVerify,
    title: 'Login Verification',
    onSubmit: handleVerificationSubmit,
    otpExpiresAt,
    serverLockedUntil,
    devCode,
    onSessionExpired: goBackToLogin,
  }

  return {
    step,
    form,
    handleFinish,
    isSubmitting,
    initialValues,
    verificationProps,
    serverLockedUntil,
    mfaRequired,
    prefillAdmin,
    prefillUser,
    prefillLguOfficer,
    prefillLguOfficer2,
    prefillLguManager,
    prefillInspector,
    prefillCso,
    prefillAdmin2,
    prefillAdmin3,
    prefillInvalid,
  }
}
