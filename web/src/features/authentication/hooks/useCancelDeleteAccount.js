import { App } from 'antd'
import { useAuthSession } from "@/features/authentication"
import { fetchWithFallback } from "@/lib/http.js"
import { authHeaders } from "@/lib/authHeaders.js"
import { useNotifier } from '@/shared/notifications.js'

export function useCancelDeleteAccount({ onSubmit } = {}) {
  const { success, error } = useNotifier()
  const { currentUser, role, login } = useAuthSession()

  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })

  const cancel = async () => {
    try {
      const res = await fetchWithFallback('/api/auth/delete-account/cancel', {
        method: 'POST',
        headers,
      })
      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({}))
        throw new Error(err?.error || `Failed to cancel deletion: ${res?.status || 'unknown'}`)
      }
      const data = await res.json()
      const user = data?.user || null
      if (user) {
        try { login(user, { remember: true }) } catch (err) { void err }
      }
      success('Account deletion cancelled')
      if (typeof onSubmit === 'function') onSubmit(data)
      return data
    } catch (err) {
      console.error('Cancel delete account error:', err)
      error(err, 'Failed to cancel account deletion')
      return null
    }
  }

  return { cancel }
}