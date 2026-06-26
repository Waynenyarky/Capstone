import { useState, useEffect } from 'react'
import { get } from '@/lib/http.js'

export function useHelpRequestAudit(requestId) {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    if (!requestId) return

    const fetchAudits = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await get(`/api/auth/audit/help-request/${requestId}?page=${pagination.page}&limit=${pagination.limit}`)
        setAudits(res.logs || [])
        setPagination((prev) => res.pagination || prev)
      } catch (err) {
        setError(err.message || 'Failed to fetch audit logs')
        setAudits([])
      } finally {
        setLoading(false)
      }
    }

    fetchAudits()
  }, [requestId, pagination.page, pagination.limit])

  const refetch = () => {
    if (requestId) {
      setPagination((prev) => ({ ...prev, page: 1 }))
    }
  }

  return { audits, loading, error, pagination, setPagination, refetch }
}
