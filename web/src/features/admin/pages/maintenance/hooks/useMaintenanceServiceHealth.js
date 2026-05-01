import { useState, useEffect } from 'react'
import { getServicesHealth } from '../../services'
import { getAllAuditLogsAdmin } from '../../services'

export function useMaintenanceServiceHealth(approvals) {
  const [services, setServices] = useState([])
  const [dependencies, setDependencies] = useState(null)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [recentLogs, setRecentLogs] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getServicesHealth()
      .then((res) => {
        if (!cancelled) {
          setServices(res?.services || [])
          setDependencies(res?.dependencies ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServices([])
          setDependencies(null)
        }
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getAllAuditLogsAdmin({ limit: 10, eventType: 'maintenance_mode' })
      .then((res) => {
        if (!cancelled) setRecentLogs(res?.logs || [])
      })
      .catch(() => {
        if (!cancelled) setRecentLogs([])
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const approvalStats = {
    pending: approvals?.filter((a) => a.status === 'pending').length || 0,
    approved: approvals?.filter((a) => a.status === 'approved').length || 0,
    rejected: approvals?.filter((a) => a.status === 'rejected').length || 0,
  }

  const recentActivitySource = recentLogs.length > 0 ? recentLogs : 
    [...(approvals || [])].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    ).slice(0, 10)

  const isAuditLog = (record) => record && record.eventType != null

  return {
    services,
    dependencies,
    servicesLoading,
    recentLogs,
    recentLoading,
    approvalStats,
    recentActivitySource,
    isAuditLog,
  }
}
