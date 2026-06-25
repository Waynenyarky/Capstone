import { Card, Tag, Typography, Space, theme } from 'antd'
import { 
  FileTextOutlined, AuditOutlined, EditOutlined, StopOutlined, 
  UserOutlined, FormOutlined, HistoryOutlined, ReloadOutlined, EyeOutlined,
  ShopOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS_CONFIG = {
  submitted: { color: 'blue', label: 'Pending Review' },
  under_review: { color: 'gold', label: 'Under Review' },
  resubmit: { color: 'cyan', label: 'Resubmitted' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  returned: { color: 'warning', label: 'Returned' },
  needs_revision: { color: 'volcano', label: 'Needs Revision' },
  pending: { color: 'blue', label: 'Pending' },
  pending_renewal: { color: 'gold', label: 'Pending Renewal' },
  renewal_submitted: { color: 'blue', label: 'Renewal Submitted' },
  draft: { color: 'default', label: 'Draft' },
  requested: { color: 'warning', label: 'Requested' },
  inspector_verified: { color: 'blue', label: 'Inspector Verified' },
  pending_tax_payment: { color: 'warning', label: 'Pending Tax Payment' },
  confirmed: { color: 'green', label: 'Confirmed' },
  upheld: { color: 'green', label: 'Upheld' },
  overturned: { color: 'red', label: 'Overturned' },
  closed: { color: 'default', label: 'Closed' },
  appeal_pending: { color: 'purple', label: 'Appeal Pending' },
  pending_assignment: { color: 'warning', label: 'Needs Assignment' },
  in_progress: { color: 'blue', label: 'In Progress' },
  completed: { color: 'green', label: 'Completed' },
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

export default function OfficerApplicationCard({ item, type, isSelected, onClick }) {
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
        return null // reference number shown as tag instead
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

  const getReferenceNumber = () => {
    switch (effectiveType) {
      case 'applications':
      case 'renewals':
      case 'drafts':
        return item.applicationReferenceNumber || null
      default:
        return null
    }
  }

  const getPermitType = () => {
    if (effectiveType !== 'applications' && effectiveType !== 'renewals' && effectiveType !== 'drafts') {
      return null
    }
    const formType = item.formType || item.formData?.formType
    if (!formType || formType === '') {
      // Fallback for existing data without formType set
      return 'Regular'
    }
    if (formType === 'general_permit') {
      const category = item.formData?.generalPermitCategory
      if (category === 'cooperative') return 'Cooperative'
      if (category === 'association_foundation') return 'Association/Foundation'
      if (category === 'chainsaw') return 'Chainsaw'
      if (category === 'firecrackers_stallholders') return 'Firecracker Stall'
      if (category === 'bazaar_festival_vendors') return 'Bazaar/Festival Vendor'
      if (category === 'peddlers') return 'Peddler'
      if (category === 'promotions_exhibitors') return 'Promotions/Exhibitor'
      if (category === 'cemetery_stallholders') return 'Cemetery Stall'
      if (category === 'fish_trap_fish_pen') return 'Fish Trap/Pen'
      if (category === 'fish_pond') return 'Fish Pond'
      return 'General'
    }
    if (formType === 'unified_business_permit') return 'Regular'
    return 'Regular' // Fallback for unknown form types
  }

  const getClaimedBy = () => {
    return item.reviewedByName || item.claimedByName || null
  }

  const status = getStatus()
  const statusCfg = STATUS_CONFIG[status] || (status ? { color: 'default', label: status } : null)

  const getDate = () => {
    const d = item.submittedAt || item.createdAt || item.updatedAt
    return d ? dayjs(d).format('MMMM D, YYYY') : null
  }

  // For consolidated business cards, show request summary badges
  const isBusinessCard = effectiveType === 'business'
  const requestSummary = isBusinessCard ? getBusinessRequestSummary(item._requests) : []

  return (
    <Card
      hoverable
      size="small"
      onClick={onClick}
      style={{
        width: '100%',
        cursor: 'pointer',
        border: isSelected ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        transition: 'all 0.2s',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: token.colorText, marginBottom: 4 }}>
            {getTitle()}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {getPermitType() && (
              <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                {getPermitType()}
              </span>
            )}
            {getPermitType() && getReferenceNumber() && (
              <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                •
              </span>
            )}
            {getReferenceNumber() && (
              <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                {getReferenceNumber()}
              </span>
            )}
          </div>
        </div>
        {statusCfg && (
          <Tag 
            color={statusCfg.color} 
            style={{ 
              margin: 0, 
              fontSize: 11, 
              textTransform: 'capitalize',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {statusCfg.label}
          </Tag>
        )}
      </div>

      {getSubtext() && (
        <div
          style={{
            fontSize: 12,
            lineHeight: '1.4',
            color: token.colorTextSecondary,
            marginBottom: 12,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getSubtext()}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: token.colorTextTertiary }}>
        {getDate() && (
          <span>Last Updated: {getDate()}</span>
        )}
        {getClaimedBy() && (
          <span>Claimed by {getClaimedBy()}</span>
        )}
      </div>

      {isBusinessCard && requestSummary.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {requestSummary.map((part, idx) => (
            <Tag key={idx} color={part.color || 'default'} style={{ margin: 0, fontSize: 10, padding: '1px 6px' }}>
              <Space size={2}>{part.icon}{part.label}</Space>
            </Tag>
          ))}
        </div>
      )}
    </Card>
  )
}
