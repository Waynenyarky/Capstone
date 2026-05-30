import { Card, Tag, Typography, Space, theme } from 'antd'
import { 
  FileTextOutlined, AuditOutlined, EditOutlined, StopOutlined, 
  UserOutlined, FormOutlined, HistoryOutlined, ReloadOutlined, EyeOutlined,
  ShopOutlined, SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS_CONFIG = {
  submitted: { color: 'processing', label: 'Pending Review' },
  under_review: { color: 'processing', label: 'Under Review' },
  resubmit: { color: 'gold', label: 'Resubmitted' },
  approved: { color: 'success', label: 'Approved' },
  rejected: { color: 'error', label: 'Rejected' },
  returned: { color: 'warning', label: 'Returned' },
  needs_revision: { color: 'warning', label: 'Needs Revision' },
  pending: { color: 'processing', label: 'Pending' },
  pending_renewal: { color: 'warning', label: 'Pending Renewal' },
  renewal_submitted: { color: 'processing', label: 'Renewal Submitted' },
  draft: { color: 'default', label: 'Draft' },
  requested: { color: 'warning', label: 'Requested' },
  inspector_verified: { color: 'processing', label: 'Inspector Verified' },
  pending_tax_payment: { color: 'warning', label: 'Pending Tax Payment' },
  confirmed: { color: 'success', label: 'Confirmed' },
  upheld: { color: 'success', label: 'Upheld' },
  overturned: { color: 'error', label: 'Overturned' },
  closed: { color: 'default', label: 'Closed' },
  appeal_pending: { color: 'warning', label: 'Appeal Pending' },
  pending_assignment: { color: 'warning', label: 'Needs Assignment' },
  in_progress: { color: 'processing', label: 'In Progress' },
  completed: { color: 'success', label: 'Completed' },
}

const TAB_ICONS = {
  toReview: <EyeOutlined />,
  business: <ShopOutlined />,
  applications: <FileTextOutlined />,
  appeals: <AuditOutlined />,
  editRequests: <EditOutlined />,
  renewals: <ReloadOutlined />,
  cessation: <StopOutlined />,
  inspections: <SafetyCertificateOutlined />,
  owners: <UserOutlined />,
  drafts: <FormOutlined />,
  logs: <HistoryOutlined />,
}

/** Build a short summary of PENDING request types for consolidated business cards */
function getBusinessRequestSummary(requests) {
  if (!requests) return []
  const parts = []
  
  // Application/Renewal - only show if pending
  if (requests.application) {
    const appStatus = requests.application.status || requests.application.applicationStatus || ''
    const isPending = ['submitted', 'under_review', 'resubmit', 'pending', 'pending_renewal', 'renewal_submitted', 'appeal_pending'].includes(appStatus)
    if (isPending) {
      const appType = requests.application._itemType === 'renewals' ? 'Renewal' : 'Application'
      parts.push({ label: `${appType} Pending`, icon: <FileTextOutlined style={{ fontSize: 11 }} />, color: 'processing' })
    }
  }
  
  // Edit Requests - only show pending ones
  const pendingEdits = (requests.editRequests || []).filter(r => r.status === 'pending')
  if (pendingEdits.length > 0) {
    parts.push({ label: 'Edit Request Pending', icon: <EditOutlined style={{ fontSize: 11 }} />, color: 'processing' })
  }
  
  // Appeals - only show pending ones
  const pendingAppeals = (requests.appeals || []).filter(a => ['submitted', 'pending', 'under_review'].includes(a.status))
  if (pendingAppeals.length > 0) {
    parts.push({ label: 'Appeal Pending', icon: <AuditOutlined style={{ fontSize: 11 }} />, color: 'warning' })
  }
  
  // Cessation - only show if pending
  if (requests.cessation) {
    const cessStatus = requests.cessation.retirementStatus || requests.cessation.status || ''
    const isPending = ['requested', 'inspector_verified', 'pending_tax_payment'].includes(cessStatus)
    if (isPending) {
      parts.push({ label: 'Cessation Pending', icon: <StopOutlined style={{ fontSize: 11 }} />, color: 'warning' })
    }
  }
  
  // Inspections - only show pending ones
  const pendingInspections = (requests.inspections || []).filter(i => ['pending_assignment', 'pending', 'in_progress'].includes(i.status))
  if (pendingInspections.length > 0) {
    parts.push({ label: 'Inspection Pending', icon: <SafetyCertificateOutlined style={{ fontSize: 11 }} />, color: 'processing' })
  }
  
  return parts
}

export default function OfficerItemCard({ item, type, isSelected, onClick }) {
  const { token } = theme.useToken()
  const effectiveType = type === 'toReview' ? (item?._itemType || 'applications') : type

  const getTitle = () => {
    switch (effectiveType) {
      case 'business':
        return item.businessName || 'Unknown Business'
      case 'applications':
      case 'renewals':
      case 'drafts':
        return item.businessName || item.formData?.businessName || 'Unnamed Business'
      case 'appeals':
        return item.businessName || `Appeal #${(item._id || '').slice(-6)}`
      case 'editRequests':
        return item.businessName || item.fieldName || 'Edit Request'
      case 'cessation':
        return item.businessName || item.businesses?.[0]?.businessName || 'Cessation Request'
      case 'inspections':
        return item.businessName || item.businessProfileId?.businessName || 'Inspection'
      case 'owners':
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown'
      case 'logs':
        return item.eventType || item.action || 'Action'
      default:
        return 'Item'
    }
  }

  const getStatus = () => {
    switch (effectiveType) {
      case 'business':
        return null // consolidated cards show badges instead
      case 'applications':
      case 'renewals':
      case 'drafts':
        return item.status || item.applicationStatus
      case 'appeals':
        return item.status
      case 'editRequests':
        return item.status
      case 'cessation':
        return item.retirementStatus || item.status
      case 'inspections':
        return item.status
      default:
        return null
    }
  }

  const getSubtext = () => {
    switch (effectiveType) {
      case 'business':
        return null // handled separately with badges
      case 'applications':
      case 'renewals':
      case 'drafts':
        return item.applicationReferenceNumber || null
      case 'appeals':
        return item.appealType || item.description?.slice(0, 60) || null
      case 'editRequests':
        return item.fieldName ? `Edit: ${item.fieldName}` : null
      case 'cessation':
        return item.reason?.slice(0, 60) || null
      case 'inspections': {
        const parts = []
        if (item.inspectionType) parts.push(item.inspectionType)
        if (item.scheduledDate) parts.push(dayjs(item.scheduledDate).format('MMM D'))
        return parts.join(' · ') || null
      }
      case 'owners':
        return item.email || null
      case 'logs':
        return item.details?.slice(0, 60) || item.metadata?.description || null
      default:
        return null
    }
  }

  const getDate = () => {
    const d = item.createdAt || item.updatedAt || item.submittedAt
    return d ? dayjs(d).format('MMM D') : null
  }

  const status = getStatus()
  const statusCfg = STATUS_CONFIG[status] || (status ? { color: 'default', label: status } : null)
  const icon = TAB_ICONS[effectiveType] || <FileTextOutlined />

  // For consolidated business cards, show request summary badges
  const isBusinessCard = effectiveType === 'business'
  const requestSummary = isBusinessCard ? getBusinessRequestSummary(item._requests) : []

  // Determine if any request in a consolidated card needs attention
  const hasAttentionNeeded = isBusinessCard && item._requests && (
    (item._requests.application && ['submitted', 'resubmit', 'under_review', 'appeal_pending'].includes(item._requests.application.status || item._requests.application.applicationStatus)) ||
    item._requests.editRequests?.some(r => r.status === 'pending') ||
    item._requests.appeals?.some(a => ['submitted', 'pending'].includes(a.status)) ||
    (item._requests.cessation && ['requested', 'inspector_verified', 'pending_tax_payment'].includes(item._requests.cessation.retirementStatus)) ||
    item._requests.inspections?.some(i => i.status === 'pending_assignment')
  )

  return (
    <Card
      hoverable
      size="small"
      onClick={onClick}
      style={{
        width: '100%',
        cursor: 'pointer',
        border: isSelected ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
        background: isSelected ? token.colorPrimaryBg : undefined,
      }}
      styles={{ body: { padding: '8px 12px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ color: isSelected ? token.colorPrimary : token.colorTextSecondary, fontSize: 14, flexShrink: 0 }}>
            {icon}
          </span>
          <Text strong ellipsis style={{ fontSize: 13 }}>{getTitle()}</Text>
          {hasAttentionNeeded && (
            <ExclamationCircleOutlined style={{ color: token.colorWarning, fontSize: 12, flexShrink: 0 }} />
          )}
        </div>
        {getDate() && (
          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{getDate()}</Text>
        )}
      </div>
      {isBusinessCard ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {requestSummary.map((part, idx) => (
            <Tag key={idx} color={part.color || 'default'} style={{ fontSize: 10, margin: 0, lineHeight: '18px', padding: '0 6px' }}>
              <Space size={2}>{part.icon}{part.label}</Space>
            </Tag>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {getSubtext() && (
            <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: 180 }}>{getSubtext()}</Text>
          )}
          {statusCfg && (
            <Tag color={statusCfg.color} style={{ fontSize: 11, margin: 0 }}>{statusCfg.label}</Tag>
          )}
        </div>
      )}
    </Card>
  )
}
