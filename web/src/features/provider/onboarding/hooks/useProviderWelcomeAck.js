import { useEffect, useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { acknowledgeWelcome, setOnboardingStatus } from "@/features/provider/services"
import { authHeaders } from "@/lib/authHeaders.js"

export function useProviderWelcomeAck({ status, provider, reload } = {}) {
  const { currentUser, role } = useAuthSession()
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [error, setError] = useState(null)

  // Compute headers inside actions to ensure fresh session values

  useEffect(() => {
    if (status === 'active') {
      setWelcomeOpen(!provider?.welcomeAcknowledged)
    } else {
      setWelcomeOpen(false)
    }
  }, [status, provider?.welcomeAcknowledged])

  const acknowledgeWelcomeAction = async () => {
    const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
    const res = await acknowledgeWelcome(headers)
    setWelcomeOpen(false)
    if (res) {
      if (typeof reload === 'function') {
        try { await reload() } catch (err) { setError(err) }
      }
    }
  }

  const startOnboarding = async () => {
    try {
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      await acknowledgeWelcome(headers)
      await setOnboardingStatus('in_progress', headers)
      setError(null)
    } catch (err) {
      setError(err)
    }
    setWelcomeOpen(false)
    if (typeof reload === 'function') {
      try { await reload() } catch (err) { setError(err) }
    }
  }

  const skipOnboarding = async () => {
    try {
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      await acknowledgeWelcome(headers)
      await setOnboardingStatus('skipped', headers)
      setError(null)
    } catch (err) {
      setError(err)
    }
    setWelcomeOpen(false)
    if (typeof reload === 'function') {
      try { await reload() } catch (err) { setError(err) }
    }
  }

  return { welcomeOpen, acknowledgeWelcome: acknowledgeWelcomeAction, startOnboarding, skipOnboarding, data: welcomeOpen, isLoading: false, error, reload }
}