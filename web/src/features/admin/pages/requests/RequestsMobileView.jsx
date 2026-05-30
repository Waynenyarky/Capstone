import { useState, useEffect, useCallback } from 'react'
import { theme } from 'antd'
import { getApprovals, getApproval } from '@/features/admin/services/approvalService'
import { useNotifier } from '@/shared/notifications'
import RequestsTable from './RequestsTable'
import RequestDetailPanel from './RequestDetailPanel'

const PAGE_SIZE = 20

export default function RequestsMobileView({ onLastUpdated } = {}) {
  const { token } = theme.useToken()
  const { error: notifyError } = useNotifier()
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [detailApproval, setDetailApproval] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const query = statusFilter === 'all' ? {} : { status: 'pending' }
      const { approvals: list } = await getApprovals(query)
      setApprovals(list || [])
    } catch (e) {
      setApprovals([])
      notifyError(e, 'Failed to load requests')
    } finally {
      setLoading(false)
      onLastUpdated?.(new Date())
    }
  }, [statusFilter, notifyError, onLastUpdated])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    const onRefresh = () => loadList()
    window.addEventListener('admin-requests-refresh', onRefresh)
    return () => window.removeEventListener('admin-requests-refresh', onRefresh)
  }, [loadList])

  const loadDetail = useCallback(
    async (approvalId) => {
      if (!approvalId) {
        setDetailApproval(null)
        return
      }
      setDetailLoading(true)
      try {
        const { approval } = await getApproval(approvalId)
        setDetailApproval(approval)
      } catch (e) {
        setDetailApproval(null)
        notifyError(e, 'Failed to load request details')
      } finally {
        setDetailLoading(false)
      }
    },
    [notifyError]
  )

  const handleSelect = useCallback(
    (rec) => {
      setSelectedApproval(rec)
      loadDetail(rec?.approvalId ?? rec?._id)
    },
    [loadDetail]
  )

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action, status } = event?.detail || {}
      if (action === 'setStatusFilter' && (status === 'pending' || status === 'all')) {
        setStatusFilter(status)
      } else if (action === 'selectFirst') {
        const first = approvals[0]
        if (first) handleSelect(first)
      }
    }
    window.addEventListener('devtools:requests', handler)
    return () => window.removeEventListener('devtools:requests', handler)
  }, [approvals, handleSelect])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const handleRefresh = useCallback(() => {
    loadList()
    if (selectedApproval?.approvalId) {
      loadDetail(selectedApproval.approvalId)
    } else {
      setDetailApproval(null)
    }
  }, [loadList, loadDetail, selectedApproval?.approvalId])

  const paginatedApprovals = approvals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const pagination = {
    current: currentPage,
    total: approvals.length,
    pageSize: PAGE_SIZE,
    onChange: setCurrentPage,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ flexShrink: 0 }}>
        <RequestsTable
          approvals={paginatedApprovals}
          loading={loading}
          selectedApproval={selectedApproval}
          onSelect={handleSelect}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          pagination={pagination}
        />
      </div>
      <div style={{ flex: 1, minHeight: 200, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <RequestDetailPanel
          approval={detailApproval}
          loading={detailLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}
