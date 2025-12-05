import { useState } from 'react'
import { useAuthSession } from "@/features/authentication"
import { resubmitProviderApplication } from "@/features/provider/services"
import { authHeaders } from "@/lib/authHeaders.js"

export function useResubmitProviderApplication() {
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { currentUser, role } = useAuthSession()

  const resubmit = async () => {
    setSubmitting(true)
    try {
      const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
      const data = await resubmitProviderApplication(headers)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const reload = () => {}
  return { isSubmitting, resubmit, isLoading: isSubmitting, error, data: null, reload }
}