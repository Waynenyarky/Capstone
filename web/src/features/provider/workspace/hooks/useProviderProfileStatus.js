import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { getProviderProfile } from "@/features/provider/services"
import { authHeaders } from "@/lib/authHeaders.js"

export function useProviderProfileStatus() {
  const { currentUser, role } = useAuthSession()
  const [provider, setProvider] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const headers = authHeaders(currentUser, role)
    try {
      const data = await getProviderProfile(headers)
      setProvider(data)
      setError(null)
    } catch (err) {
      setProvider(null)
      setError(err)
    }
    setLoading(false)
  }, [currentUser, role])

  useEffect(() => {
    load()
  }, [load])

  const status = provider?.status || null
  return { provider, status, isLoading, reload: load, data: provider, error }
}