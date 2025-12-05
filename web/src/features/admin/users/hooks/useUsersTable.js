import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { fetchWithFallback } from "@/lib/http.js"
import { authHeaders } from "@/lib/authHeaders.js"

export function useUsersTable() {
  const [users, setUsers] = useState([])
  const [isLoading, setLoading] = useState(false)
  const { currentUser, role } = useAuthSession()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithFallback('/api/auth/users', {
        headers: authHeaders(currentUser, role),
      })
      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({}))
        throw new Error(err?.error || `Failed to load users: ${res?.status || 'unknown'}`)
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : (data?.users || []))
    } catch (err) {
      console.error('Load users error:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [currentUser, role])

  useEffect(() => {
    load()
  }, [load])

  return { users, isLoading: isLoading, reloadUsers: load }
}