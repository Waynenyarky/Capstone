import React from 'react'
import { Form } from '@/shared/components/AppForm'
import { Input, Button, Flex, Checkbox, Dropdown, Typography, Grid, Alert, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import { loginEmailRules, loginPasswordRules } from "@/features/authentication/validations"
import { useLoginFlow, useAuthSession } from "@/features/authentication/hooks"
import useWebAuthn from '@/features/authentication/hooks/useWebAuthn.js'
import { LoginVerificationForm } from "@/features/authentication"
import TotpVerificationForm from '@/features/authentication/components/TotpVerificationForm.jsx'
import PlatformPasskeyAuth from '@/features/authentication/components/PlatformPasskeyAuth.jsx'
import useOtpCountdown from '@/features/authentication/hooks/useOtpCountdown.js'
import PasskeySignInOptions from './PasskeySignInOptions.jsx'
import TurnstileWidget from './TurnstileWidget.jsx'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function LoginForm({ onSubmit } = {}) {
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const passwordInputRef = React.useRef(null)
  const turnstileRef = React.useRef(null)
  const turnstileSiteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TURNSTILE_SITE_KEY) || ''

  const {
    step,
    form,
    handleFinish,
    isSubmitting,
    prefillAdmin,
    prefillAdmin2,
    prefillAdmin3,
    prefillUser,
    prefillLguOfficer,
    prefillLguManager,
    prefillInspector,
    prefillCso,
    prefillInvalid,
    verificationProps,
    serverLockedUntil,
    mfaRequired,
    initialValues,
  } = useLoginFlow({
    onSubmit,
    getCaptchaToken: turnstileSiteKey ? () => turnstileRef.current?.getToken?.() ?? '' : undefined,
  })

  const { login } = useAuthSession()
  const { authenticateConditional } = useWebAuthn()

  // State to manage readOnly hack for autofill prevention
  const [fieldsReadOnly, setFieldsReadOnly] = React.useState(true)
  // State to force form remounting (defeats browser bfcache/restoration)
  const [formKey, setFormKey] = React.useState(Date.now())
  // When user dismisses the lockout modal we hide it until next lockout
  const [lockoutAlertDismissed, setLockoutAlertDismissed] = React.useState(false)
  const lockoutCountdown = useOtpCountdown(serverLockedUntil)

  const watchedEmail = Form.useWatch('email', form) ?? ''
  const watchedPassword = Form.useWatch('password', form) ?? ''

  // On initial load only set email/rememberMe (never password) so browser can autofill password.
  // Do NOT remount the form (setFormKey) here: when [form, initialValues] re-run the effect,
  // remounting wipes the entire form including browser-autofilled password (see debug logs).
  // Remount only on bfcache (back/forward) to clear stale credentials.
  React.useEffect(() => {
    const onInitialMount = () => {
      setFieldsReadOnly(false)
      const preserveRememberMe = initialValues?.rememberMe === true
      form.setFieldsValue({
        email: initialValues?.email || '',
        rememberMe: preserveRememberMe ? true : false
      })
      // Intentionally do not set password here so browser can autofill when user selects remembered email
    }

    const clearFieldsForBfcache = () => {
      setFieldsReadOnly(false)
      form.resetFields()
      form.setFieldsValue({ email: '', password: '', rememberMe: false })
    }

    const timer = setTimeout(onInitialMount, 50)

    const handlePageShow = (event) => {
      if (event.persisted) {
        setFormKey(Date.now())
        setTimeout(clearFieldsForBfcache, 50)
      }
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [form, initialValues])

  // Sync browser-autofilled password into form state. Browsers often don't fire input/change for
  // autofill, so the controlled input stays "" and React overwrites the DOM.
  const syncAutofillPassword = React.useCallback(() => {
    const el = passwordInputRef.current
    if (!el) return
    const input = (typeof el.input === 'object' && el.input) ? el.input : el
    const domValue = input?.value ?? ''
    if (domValue.length > 0 && (form.getFieldValue('password') ?? '').length === 0) {
      form.setFieldsValue({ password: domValue })
    }
  }, [form])

  // After email is set, check for autofilled password (browser may fill both when user picks email).
  React.useEffect(() => {
    if (!watchedEmail?.trim() || (watchedPassword ?? '').length > 0) return
    const t1 = setTimeout(syncAutofillPassword, 350)
    const t2 = setTimeout(syncAutofillPassword, 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [form, watchedEmail, watchedPassword, syncAutofillPassword])

  // Conditional UI: start passkey autofill only when email field is focused (avoids
  // "A request is already pending" when user clicks "Sign in with Passkey").
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
        // Login success shown on destination via navigate state (Option A)
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

  // Listen for devtools-driven prefill events (global FAB) — only in dev, not in demo-ui
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
  }, [prefillAdmin, prefillAdmin2, prefillAdmin3, prefillUser, prefillLguOfficer, prefillLguManager, prefillInspector, prefillCso, prefillInvalid])

  // Reset lockout modal dismissed when lockout clears so next lockout shows the alert again
  React.useEffect(() => {
    if (!serverLockedUntil) setLockoutAlertDismissed(false)
  }, [serverLockedUntil])

  const lockoutMessage = serverLockedUntil
    ? (lockoutCountdown.isExpired
        ? 'Account lock has expired — you may try again.'
        : `Account locked. Try again in ${Math.floor(lockoutCountdown.remaining / 60)}:${String(lockoutCountdown.remaining % 60).padStart(2, '0')}`)
    : null

  // When switching to passkey verification step (e.g. after password submit with passkey MFA),
  // abort any conditional UI get() so PlatformPasskeyAuth can start its own get() without "already pending".
  React.useEffect(() => {
    if (step !== 'verify-passkey') return
    getReadyForModalPasskey()
  }, [step, getReadyForModalPasskey])

  if (step === 'verify' || step === 'verify-totp') {
    const VerificationComponent = step === 'verify' ? LoginVerificationForm : TotpVerificationForm
    return <VerificationComponent {...verificationProps} />
  }

  if (step === 'verify-passkey') {
    return (
      <PlatformPasskeyAuth
        form={form}
        onAuthenticated={verificationProps.onSubmit}
        onCancel={verificationProps.onSessionExpired}
      />
    )
  }

  // Show lockout as a modal alert instead of inline banner
  const showLockoutAlert = !!serverLockedUntil && !lockoutAlertDismissed
  const mfaBanner = mfaRequired ? (
    <Alert
      type="warning"
      showIcon
      message="Multi-factor authentication required"
      description={`${mfaRequired.message || 'Use a passkey or authenticator app to continue.'}${mfaRequired.allowedMethods ? ` (Allowed: ${mfaRequired.allowedMethods.join(', ')})` : ''}`}
      style={{ marginBottom: isMobile ? 18 : 24 }}
    />
  ) : null

  return (
    <>
      <Modal
        title="Account locked"
        open={showLockoutAlert}
        onCancel={() => setLockoutAlertDismissed(true)}
        footer={[
          <Button key="close" type="primary" onClick={() => setLockoutAlertDismissed(true)}>
            Close
          </Button>,
        ]}
        closable
      >
        {lockoutMessage}
      </Modal>
      {mfaBanner}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Form
          key={formKey}
          name="login"
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await handleFinish(values)
            } finally {
              turnstileRef.current?.reset?.()
            }
          }}
          initialValues={initialValues || { email: '', password: '', rememberMe: false }}
          size="default"
          requiredMark={false}
          style={{ maxWidth: '300px', width: '100%' }}
        >
          <Title level={isMobile ? 4 : 3} style={{ marginBottom: 48, textAlign: 'center' }}>Sign In with BizClear</Title>
          <Form.Item
            name="email"
            label="Email"
            rules={loginEmailRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <Input
              placeholder="Enter your email"
              variant="filled"
              autoComplete="username webauthn"
              readOnly={fieldsReadOnly}
              onFocus={() => {
                setFieldsReadOnly(false)
                handleEmailFocusForPasskey()
              }}
              data-test="login-email"
              data-testid="login-email"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={loginPasswordRules}
            style={{ marginBottom: isMobile ? 20 : 24 }}
          >
            <Input.Password
              ref={passwordInputRef}
              placeholder="Enter your password"
              variant="filled"
              autoComplete="current-password"
              readOnly={fieldsReadOnly}
              onFocus={() => {
                setFieldsReadOnly(false)
                ;[100, 300, 600].forEach((ms) => setTimeout(syncAutofillPassword, ms))
              }}
              data-test="login-password"
              data-testid="login-password"
            />
          </Form.Item>
          
          <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 20 : 24, flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="rememberMe" valuePropName="checked" noStyle style={{ marginBottom: 0 }}>
              <Checkbox style={{ fontSize: isMobile ? 14 : undefined }} data-test="login-remember" data-testid="login-remember">Remember me</Checkbox>
            </Form.Item>
            <Button type="link" onClick={() => navigate('/forgot-password')} style={{ padding: 0, color: '#001529', fontSize: isMobile ? 14 : undefined }} className="auth-link-hover" data-test="login-forgot" data-testid="login-forgot">
              Forgot password?
            </Button>
          </Flex>

          {turnstileSiteKey ? (
            <Form.Item style={{ marginBottom: isMobile ? 20 : 24 }}>
              <TurnstileWidget ref={turnstileRef} siteKey={turnstileSiteKey} />
            </Form.Item>
          ) : null}

          <Form.Item style={{ marginBottom: isMobile ? 20 : 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isSubmitting || (serverLockedUntil != null && serverLockedUntil > Date.now())}
              block
              size="default"
              data-test="login-submit"
              data-testid="login-submit"
            >
              Sign In
            </Button>
          </Form.Item>

          <Flex justify="center" style={{ marginBottom: isMobile ? 20 : 24 }}>
             <PasskeySignInOptions form={form} onAuthenticated={onSubmit} onBeforePasskeyAuth={getReadyForModalPasskey} />
          </Flex>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Don't have an account? </Text>
            <Button type="link" onClick={() => navigate('/sign-up')} style={{ padding: 0, fontWeight: 600, color: '#001529' }} className="auth-link-hover">Sign up</Button>
          </div>
          {/* Dev Prefill Controls - Labels show emails from root .env (DEV_EMAIL_*); hidden in production and demo-ui */}
          {import.meta.env.DEV === true && import.meta.env.VITE_DEMO_UI !== 'true' && (() => {
            const env = import.meta.env || {}
            const devPrefillItems = [
              { key: 'admin', label: env.VITE_DEV_EMAIL_ADMIN || 'admin@example.com', role: 'Admin' },
              { key: 'admin2', label: env.VITE_DEV_EMAIL_ADMIN2 || 'admin2@example.com', role: 'Admin 2' },
              { key: 'admin3', label: env.VITE_DEV_EMAIL_ADMIN3 || 'admin3@example.com', role: 'Admin 3' },
              { key: 'officer', label: env.VITE_DEV_EMAIL_OFFICER || 'officer@example.com', role: 'LGU Officer' },
              { key: 'manager', label: env.VITE_DEV_EMAIL_MANAGER || 'manager@example.com', role: 'Manager' },
              { key: 'inspector', label: env.VITE_DEV_EMAIL_INSPECTOR || 'inspector@example.com', role: 'Inspector' },
              { key: 'invalid', label: 'wrong@example.com', role: 'Invalid credentials' },
            ]
            return (
              <>
                <div style={{ marginTop: 24, textAlign: 'center', opacity: 0.5 }}>
                  <Dropdown
                  menu={{
                    items: devPrefillItems.map(({ key, label, role }) => ({
                      key,
                      label: `${role}: ${label}`,
                    })),
                    onClick: ({ key }) => {
                      if (key === 'admin') prefillAdmin()
                      else if (key === 'admin2') prefillAdmin2()
                      else if (key === 'admin3') prefillAdmin3()
                      else if (key === 'officer') prefillLguOfficer()
                      else if (key === 'manager') prefillLguManager()
                      else if (key === 'inspector') prefillInspector()
                      else if (key === 'invalid') prefillInvalid()
                    },
                  }}
                >
                  <Button type="text" size="small">Dev Tools</Button>
                </Dropdown>
              </div>
            </>
            )
          })()}
        </Form>
      </div>
    </>
  )
}
