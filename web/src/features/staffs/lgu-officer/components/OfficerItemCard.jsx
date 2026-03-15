import React from 'react'
import { Card, Tag, Typography, theme } from 'antd'
import { 
  FileTextOutlined, AuditOutlined, EditOutlined, StopOutlined, 
  UserOutlined, FormOutlined, HistoryOutlined, ReloadOutlined, EyeOutlined 
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
  confirmed: { color: 'success', label: 'Confirmed' },
  upheld: { color: 'success', label: 'Upheld' },
  overturned: { color: 'error', label: 'Overturned' },
}

const TAB_ICONS = {
  toReview: <EyeOutlined />,
  applications: <FileTextOutlined />,
  appeals: <AuditOutlined />,
  editRequests: <EditOutlined />,
  renewals: <ReloadOutlined />,
  cessation: <StopOutlined />,
  owners: <UserOutlined />,
  drafts: <FormOutlined />,
  logs: <HistoryOutlined />,
}

export default function OfficerItemCard({ item, type, isSelected, onClick }) {
  const { token } = theme.useToken()

  const getTitle = () => {
    switch (type) {
      case 'toReview':
      case 'applications':
      case 'renewals':
      case 'drafts':
        return item.businessName || item.formData?.businessName || 'Unnamed Business'
      case 'appeals':
        return item.businessName || `Appeal #${(item._id || '').slice(-6)}`
      case 'editRequests':
        return item.fieldName || 'Edit Request'
      case 'cessation':
        return item.businessName || item.businesses?.[0]?.businessName || 'Cessation Request'
      case 'owners':
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown'
      case 'logs':
        return item.eventType || item.action || 'Action'
      default:
        return 'Item'
    }
  }

  const getStatus = () => {
    switch (type) {
      case 'toReview':
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
      default:
        return null
    }
  }

  const getSubtext = () => {
    switch (type) {
      case 'toReview':
      case 'applications':
      case 'renewals':
      case 'drafts':
        return item.applicationReferenceNumber || null
      case 'appeals':
        return item.appealType || item.description?.slice(0, 60) || null
      case 'editRequests':
        return item.businessId ? `Business: ${item.businessId.slice(-8)}` : null
      case 'cessation':
        return item.reason?.slice(0, 60) || null
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
  const icon = TAB_ICONS[type] || <FileTextOutlined />

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
        </div>
        {getDate() && (
          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{getDate()}</Text>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {getSubtext() && (
          <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: 180 }}>{getSubtext()}</Text>
        )}
        {statusCfg && (
          <Tag color={statusCfg.color} style={{ fontSize: 11, margin: 0 }}>{statusCfg.label}</Tag>
        )}
      </div>
    </Card>
  )
}
