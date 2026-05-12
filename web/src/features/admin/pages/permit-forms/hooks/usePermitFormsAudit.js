import { useState, useCallback } from 'react'
import { message } from 'antd'
import { getPermitFormsAudit } from '@/features/admin/services/permitFormsService'
import { AUDIT_PAGE_SIZE } from '../constants'

export default function usePermitFormsAudit() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async (p = 1) => {
    try {
      setLoading(true)
      const data = await getPermitFormsAudit(p, AUDIT_PAGE_SIZE)
      setLogs(data?.logs || [])
      setTotal(data?.total || 0)
      setPage(data?.page || p)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      message.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  const changePage = useCallback((p) => {
    fetch(p)
  }, [fetch])

  return { logs, total, page, loading, fetch, changePage, pageSize: AUDIT_PAGE_SIZE }
}
