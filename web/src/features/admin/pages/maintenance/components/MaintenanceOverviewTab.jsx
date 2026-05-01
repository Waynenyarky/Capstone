import React from 'react'
import { theme } from 'antd'
import MaintenanceOverviewCards from './MaintenanceOverviewCards.jsx'
import MaintenanceRecentActivity from './MaintenanceRecentActivity.jsx'
import { useMaintenanceServiceHealth } from '../hooks/useMaintenanceServiceHealth.js'

export default function MaintenanceOverviewTab({
  current,
  approvals = [],
  setTabKey,
  onOpenRequestModal,
}) {
  const { token } = theme.useToken()
  const {
    services,
    dependencies,
    servicesLoading,
    recentLogs,
    recentLoading,
    approvalStats,
    recentActivitySource,
    isAuditLog,
  } = useMaintenanceServiceHealth(approvals)

  const handleRowClick = (record) => {
    if (isAuditLog(record)) return
    setTabKey('requests')
  }

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <MaintenanceOverviewCards
        services={services}
        dependencies={dependencies}
        approvalStats={approvalStats}
        current={current}
        token={token}
      />
      <MaintenanceRecentActivity
        recentActivitySource={recentActivitySource}
        isAuditLog={isAuditLog}
        onRowClick={handleRowClick}
        loading={recentLoading}
      />
    </div>
  )
}
