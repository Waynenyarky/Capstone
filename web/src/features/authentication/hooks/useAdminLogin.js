import { useCallback, useEffect, useState } from 'react'
import { adminLoginStart, adminVerifyLoginCode } from '../services/authService.js'
import { useAuthSession } from '@/features/authentication'

// Hook: useAdminLogin
// Encapsulates admin login UI state and handlers (credentials, resend, verify,
// cooldown, server lockout). Accepts an optional `onSuccess` callback which is
// invoked after successful verify/login.
export default function useAdminLogin({ onSuccess } = {}) {
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const [serverLockedUntil, setServerLockedUntil] = useState(null)

  const { login } = useAuthSession()

  const parseLockFromError = useCallback((err) => {
      const locked = err?.body?.adminLockedUntil || err?.body?.lockedUntil || err?.body?.locked_until || err?.body?.lockedUntilMs || err?.body?.lockExpires || err?.body?.locked_until_ms || null
      if (!locked) return null
      try {
         if (typeof locked === 'number') return locked > 1e12 ? Number(locked) : Number(locked) * 1000
         const parsed = Date.parse(String(locked))
         return Number.isNaN(parsed) ? null : parsed
      } catch {
         return null
      }
   }, [])

  const handleCredentials = useCallback(async (values) => {
      setError(null)
      setLoading(true)
      try {
         const data = await adminLoginStart({ email: values.email, password: values.password })
         if (data && data.devCode) {
         const code = String(data.devCode)
         setDevCode(code)
         }
         setEmail(values.email)
         setPassword(values.password)
         setCooldown(60)
         setStep('verify')
         return data
      } catch (err) {
         const ts = parseLockFromError(err)
         if (ts) setServerLockedUntil(ts)
         setError('Authentication failed')
         return Promise.reject(err)
      } finally {
         setLoading(false)
      }
   }, [parseLockFromError])

  // cooldown countdown
  useEffect(() => {
      if (!cooldown) return undefined
      const id = setInterval(() => setCooldown((c) => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 1000)
      return () => clearInterval(id)
   }, [cooldown])

  const handleResend = useCallback(async () => {
      setError(null)
      setLoading(true)
      try {
         const data = await adminLoginStart({ email, password })
         if (data && data.devCode) {
         const code = String(data.devCode)
         setDevCode(code)
         }
         setCooldown(60)
         return data
      } catch (err) {
         const ts = parseLockFromError(err)
         if (ts) setServerLockedUntil(ts)
         setError('Authentication failed')
         return Promise.reject(err)
      } finally {
         setLoading(false)
      }
   }, [email, password, parseLockFromError])

  const handleVerify = useCallback(async (values) => {
    setError(null)
    setLoading(true)
    try {
         const data = await adminVerifyLoginCode({ email, code: values.code })

         if (data && data.user) {
         try { login(data.user) } catch { /* ignore */ }
         } else if (data && data.token) {
         // Safely decode base64url JWT payload and parse JSON. This works in
         // browser environments (atob) and avoids deprecated/unsafe helpers.
         try {
            const parts = String(data.token).split('.')
            if (parts.length === 3) {
               const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
               const pad = b64.length % 4
               const padded = b64 + (pad ? '='.repeat(4 - pad) : '')
               let payloadText = null
               try {
               const binary = atob(padded)
               // Convert binary string to percent-encoded then decode to support UTF-8
               const percentEncoded = Array.prototype.map.call(binary, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
               payloadText = decodeURIComponent(percentEncoded)
               } catch {
               // Fallback to plain atob output if percent-decoding fails
               try { payloadText = atob(padded) } catch { payloadText = null }
               }

               if (payloadText) {
               try {
                  const payload = JSON.parse(payloadText)
                  const userFromToken = { ...(payload || {}), token: data.token }
                  try { login(userFromToken) } catch { /* ignore */ }
               } catch (jsonErr) {
                  console.warn('Failed to parse token payload JSON', jsonErr)
               }
               }
            }
         } catch (err) {
            console.warn('Failed to decode token payload', err)
         }
         }

         if (typeof onSuccess === 'function') onSuccess(data)
         return data
      } catch (err) {
         const ts = parseLockFromError(err)
         if (ts) setServerLockedUntil(ts)
         setError('Authentication failed')
         return Promise.reject(err)
      } finally {
         setLoading(false)
      }
   }, [email, login, onSuccess, parseLockFromError])

  // Server lock countdown
  const [serverLockRemaining, setServerLockRemaining] = useState(0)
  useEffect(() => {
      if (!serverLockedUntil) { setServerLockRemaining(0); return undefined }
      const update = () => {
         const rem = Math.max(0, Math.ceil((serverLockedUntil - Date.now()) / 1000))
         setServerLockRemaining(rem)
         if (rem <= 0) setServerLockedUntil(null)
      }
      update()
      const id = setInterval(update, 1000)
      return () => clearInterval(id)
   }, [serverLockedUntil])

  return {
    step, setStep, email, setEmail, password, setPassword, devCode, loading, error, cooldown, serverLockedUntil, serverLockRemaining, handleCredentials, handleResend, handleVerify, setDevCode, setError,
   }
}
