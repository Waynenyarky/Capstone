import { useState, useMemo } from 'react'
import { Typography, Button, Empty, Badge, theme } from 'antd'
import {
  FileTextOutlined, EditOutlined, AuditOutlined, StopOutlined,
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ApplicationDetailPanel from '../pages/applications/components/ApplicationDetailPanel'
import EditRequestDetailPanel from './EditRequestDetailPanel'
import AppealDetailPanel from './AppealDetailPanel'
import CessationDetailPanel from './CessationDetailPanel'
import InspectionDetailPanel from './InspectionDetailPanel'
import ClaimBar from './ClaimBar'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'

const { Text, Title } = Typography

/**
 * Determines the attention status of a request category.
 * Returns 'ok' (green check), 'attention' (yellow clock), 'rejected' (red X), or null (no items).
 */
function getCategoryStatus(category, items) {
  if (!items) return null

  switch (category) {
    case 'application': {
      if (!items) return null
      const status = items.status || items.applicationStatus || ''
      if (['approved', 'confirmed'].includes(status)) return 'ok'
      if (['rejected', 'returned'].includes(status)) return 'rejected'
      return 'attention' // submitted, under_review, resubmit, etc.
    }
    case 'editRequests': {
      if (!items?.length) return null
      const hasRejected = items.some(r => r.status === 'rejected')
      const allResolved = items.every(r => ['approved', 'rejected'].includes(r.status))
      if (hasRejected) return 'rejected'
      if (allResolved) return 'ok'
      return 'attention'
    }
    case 'appeals': {
      if (!items?.length) return null
      const hasRejected = items.some(a => a.status === 'rejected')
      const allResolved = items.every(a => ['approved', 'rejected'].includes(a.status))
      if (hasRejected) return 'rejected'
      if (allResolved) return 'ok'
      return 'attention'
    }
    case 'cessation': {
      if (!items) return null
      const status = items.retirementStatus || items.status || ''
      if (status === 'confirmed') return 'ok'
      if (status === 'rejected') return 'rejected'
      return 'attention'
    }
    case 'inspections': {
      if (!items?.length) return null
      const allCompleted = items.every(i => i.status === 'completed')
      const hasFailed = items.some(i => i.overallResult === 'failed')
      if (hasFailed) return 'rejected'
      if (allCompleted) return 'ok'
      return 'attention'
    }
    default:
      return null
  }
}

const STATUS_ICONS = {
  ok: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />,
  attention: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 12 }} />,
  rejected: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />,
}

const CATEGORY_CONFIG = [
  { key: 'application', label: 'Application', icon: <FileTextOutlined /> },
  { key: 'editRequests', label: 'Edit Requests', icon: <EditOutlined /> },
  { key: 'appeals', label: 'Appeals', icon: <AuditOutlined /> },
  { key: 'cessation', label: 'Cessation', icon: <StopOutlined /> },
  { key: 'inspections', label: 'Inspections', icon: <SafetyCertificateOutlined /> },
]

export default function BusinessReviewPanel({ item, onReviewComplete, onClaimChange, refresh }) {
  const { token } = theme.useToken()
  const { reviewApplication } = usePermitApplications()
  const [activeCategory, setActiveCategory] = useState(null)

  const requests = item?._requests || {}

  // Build visible tabs based on what requests exist
  const visibleTabs = useMemo(() => {
    const tabs = []
    if (requests.application) tabs.push('application')
    if (requests.editRequests?.length > 0) tabs.push('editRequests')
    if (requests.appeals?.length > 0) tabs.push('appeals')
    if (requests.cessation) tabs.push('cessation')
    if (requests.inspections?.length > 0) tabs.push('inspections')
    return tabs
  }, [requests])

  // Auto-select first tab if none selected or current tab no longer visible
  const effectiveCategory = useMemo(() => {
    if (activeCategory && visibleTabs.includes(activeCategory)) return activeCategory
    return visibleTabs[0] || null
  }, [activeCategory, visibleTabs])

  // Determine the primary item for ClaimBar (application takes priority)
  const primaryItem = requests.application || requests.cessation || requests.editRequests?.[0] || requests.appeals?.[0] || null
  const claimBarApiPath = requests.application
    ? undefined // default: /api/lgu-officer/permit-applications
    : requests.cessation
      ? '/api/business/retirements'
      : requests.editRequests?.length
        ? '/api/business/edit-requests'
        : requests.appeals?.length
          ? '/api/business/appeals'
          : undefined

  const renderContent = () => {
    if (!effectiveCategory) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="No pending requests for this business" />
        </div>
      )
    }

    switch (effectiveCategory) {
      case 'application':
        return (
          <ApplicationDetailPanel
            application={requests.application}
            onReviewComplete={onReviewComplete}
            onReviewStarted={() => {}}
            onReview={reviewApplication}
          />
        )

      case 'editRequests':
        return (
          <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
            {requests.editRequests.map((req, idx) => (
              <div key={req._id || idx} style={{ marginBottom: idx < requests.editRequests.length - 1 ? 16 : 0 }}>
                {requests.editRequests.length > 1 && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                    Edit Request {idx + 1} of {requests.editRequests.length}
                  </Text>
                )}
                <EditRequestDetailPanel request={req} onReviewComplete={onReviewComplete} />
              </div>
            ))}
          </div>
        )

      case 'appeals':
        return (
          <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
            {requests.appeals.map((appeal, idx) => (
              <div key={appeal._id || idx} style={{ marginBottom: idx < requests.appeals.length - 1 ? 16 : 0 }}>
                {requests.appeals.length > 1 && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                    Appeal {idx + 1} of {requests.appeals.length}
                  </Text>
                )}
                <AppealDetailPanel appeal={appeal} onReviewComplete={onReviewComplete} />
              </div>
            ))}
          </div>
        )

      case 'cessation':
        return (
          <CessationDetailPanel cessation={requests.cessation} onReviewComplete={onReviewComplete} />
        )

      case 'inspections':
        return (
          <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
            {requests.inspections.map((insp, idx) => (
              <div key={insp._id || idx} style={{ marginBottom: idx < requests.inspections.length - 1 ? 16 : 0 }}>
                {requests.inspections.length > 1 && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
                    Inspection {idx + 1} of {requests.inspections.length}
                  </Text>
                )}
                <InspectionDetailPanel inspection={insp} onReviewComplete={onReviewComplete} />
              </div>
            ))}
          </div>
        )

      default:
        return <Empty description="Select a category" />
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ClaimBar at top */}
      {primaryItem && (
        <div style={{ flexShrink: 0 }}>
          <ClaimBar
            application={requests.application || undefined}
            item={!requests.application ? primaryItem : undefined}
            onClaimChange={onClaimChange}
            apiBasePath={claimBarApiPath}
            entityLabel={requests.application ? undefined : 'business requests'}
          />
        </div>
      )}

      {/* Main content area: vertical nav + detail */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Left vertical nav — same pattern as ApplicationDetailPanel */}
        <div
          style={{
            width: 180,
            minWidth: 180,
            flexShrink: 0,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 8px',
            gap: 4,
            overflowY: 'auto',
            background: token.colorBgLayout,
          }}
        >
          {/* Business name header */}
          <div style={{ padding: '4px 8px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.3 }}>
              {item?.businessName || 'Business'}
            </Text>
            {item?.businessId && (
              <Text type="secondary" style={{ fontSize: 10 }}>
                {String(item.businessId).slice(-8)}
              </Text>
            )}
          </div>

          {/* Tab buttons */}
          {visibleTabs.map(tabKey => {
            const config = CATEGORY_CONFIG.find(c => c.key === tabKey)
            if (!config) return null
            const isActive = effectiveCategory === tabKey
            const categoryItems = tabKey === 'application' ? requests.application
              : tabKey === 'cessation' ? requests.cessation
              : requests[tabKey]
            const status = getCategoryStatus(tabKey, categoryItems)
            const statusIcon = status ? STATUS_ICONS[status] : null
            const count = Array.isArray(categoryItems) ? categoryItems.length : (categoryItems ? 1 : 0)

            return (
              <Button
                key={tabKey}
                type={isActive ? 'primary' : 'text'}
                ghost={isActive}
                onClick={() => setActiveCategory(tabKey)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 36,
                  padding: '4px 10px',
                  borderColor: isActive ? token.colorPrimary : 'transparent',
                  background: isActive ? token.colorPrimaryBg : 'transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{config.icon}</span>
                  <Text
                    ellipsis
                    style={{
                      fontSize: 12,
                      color: isActive ? token.colorPrimary : token.colorText,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {config.label}
                  </Text>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {count > 1 && (
                    <Badge
                      count={count}
                      size="small"
                      style={{
                        backgroundColor: token.colorFillTertiary,
                        color: token.colorTextSecondary,
                        fontSize: 10,
                        minWidth: 16,
                        height: 16,
                        lineHeight: '16px',
                        border: 'none',
                        boxShadow: 'none',
                      }}
                    />
                  )}
                  {statusIcon}
                </span>
              </Button>
            )
          })}
        </div>

        {/* Right content area */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
