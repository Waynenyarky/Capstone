import React from 'react'
import { Typography, Card, Tag, Space, Button, theme, Statistic, Divider } from 'antd'
import {
  SafetyCertificateOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(value) {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null
  try {
    const target = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
    return diff
  } catch {
    return null
  }
}

function getPermitStatus(expiryDate) {
  const days = getDaysUntil(expiryDate)
  if (days === null) return { status: 'unknown', color: 'default', label: 'Unknown' }
  if (days < 0) return { status: 'expired', color: 'error', label: 'Expired' }
  if (days <= 30) return { status: 'expiring', color: 'warning', label: 'Expiring Soon' }
  return { status: 'active', color: 'success', label: 'Active' }
}

function getRenewalStatus(expiryDate, renewals) {
  const days = getDaysUntil(expiryDate)
  const hasActiveRenewal = renewals?.some(r => r.renewalStatus === 'submitted' || r.renewalStatus === 'under_review')
  
  if (hasActiveRenewal) {
    return { status: 'in_progress', color: 'processing', label: 'Renewal In Progress' }
  }
  if (days === null) return { status: 'unknown', color: 'default', label: 'Not Set' }
  if (days < 0) return { status: 'overdue', color: 'error', label: 'Overdue' }
  if (days <= 60) return { status: 'due_soon', color: 'warning', label: 'Due Soon' }
  return { status: 'not_due', color: 'default', label: 'Not Due' }
}

function PermitCard({ business, token }) {
  const permitStatus = getPermitStatus(business.permitExpiry)
  const permitNumber = business.permitNumber || business.applicationReferenceNumber || 'Pending'
  
  return (
    <Card
      style={{ height: '100%' }}
      styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ flex: 1 }}>
        <Space align="center" size={8} style={{ marginBottom: 16 }}>
          <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <Title level={5} style={{ margin: 0 }}>Business Permit</Title>
        </Space>
        
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Permit Number</Text>
          <div>
            <Text strong style={{ fontSize: 18 }}>{permitNumber}</Text>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Issue Date</Text>
            <div>
              <Text style={{ fontSize: 14 }}>{formatDate(business.permitIssueDate || business.approvedAt)}</Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Expiry Date</Text>
            <div>
              <Text style={{ fontSize: 14 }}>{formatDate(business.permitExpiry)}</Text>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Tag 
            color={permitStatus.color} 
            icon={permitStatus.status === 'active' ? <CheckCircleOutlined /> : permitStatus.status === 'expiring' ? <WarningOutlined /> : <ExclamationCircleOutlined />}
            style={{ fontSize: 13, padding: '4px 12px' }}
          >
            {permitStatus.label}
          </Tag>
        </div>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <Space>
        <Button icon={<DownloadOutlined />} type="primary">
          Download Permit
        </Button>
        <Button icon={<EyeOutlined />}>
          View Details
        </Button>
      </Space>
    </Card>
  )
}

function RenewalCard({ business, token }) {
  const renewalStatus = getRenewalStatus(business.permitExpiry, business.renewals)
  const daysUntil = getDaysUntil(business.permitExpiry)
  const canStartRenewal = renewalStatus.status === 'due_soon' || renewalStatus.status === 'overdue'
  
  return (
    <Card>
      <Space align="center" size={8} style={{ marginBottom: 16 }}>
        <ReloadOutlined style={{ fontSize: 20, color: token.colorWarning }} />
        <Title level={5} style={{ margin: 0 }}>Renewal</Title>
      </Space>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Next Renewal</Text>
          <div>
            <Text strong style={{ fontSize: 16 }}>{formatDate(business.permitExpiry)}</Text>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {daysUntil !== null && (
            <Statistic
              value={Math.abs(daysUntil)}
              suffix={daysUntil < 0 ? 'days overdue' : 'days left'}
              valueStyle={{ 
                fontSize: 16, 
                color: daysUntil < 0 ? token.colorError : daysUntil <= 30 ? token.colorWarning : token.colorTextSecondary 
              }}
            />
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tag color={renewalStatus.color}>{renewalStatus.label}</Tag>
        {canStartRenewal && (
          <Button type="primary" size="small">
            Start Renewal
          </Button>
        )}
      </div>
    </Card>
  )
}

function PaymentsCard({ business, token }) {
  const outstandingBalance = business.outstandingBalance || 0
  const lastPaymentDate = business.lastPaymentDate
  const hasOutstanding = outstandingBalance > 0
  
  return (
    <Card>
      <Space align="center" size={8} style={{ marginBottom: 16 }}>
        <DollarOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
        <Title level={5} style={{ margin: 0 }}>Payments</Title>
      </Space>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Outstanding Balance</Text>
          <div>
            <Text 
              strong 
              style={{ 
                fontSize: 18, 
                color: hasOutstanding ? token.colorError : token.colorSuccess 
              }}
            >
              {formatCurrency(outstandingBalance)}
            </Text>
          </div>
        </div>
        {lastPaymentDate && (
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Last Payment</Text>
            <div>
              <Text style={{ fontSize: 14 }}>{formatDate(lastPaymentDate)}</Text>
            </div>
          </div>
        )}
      </div>
      
      <Space>
        {hasOutstanding && (
          <Button type="primary" size="small">
            Pay Now
          </Button>
        )}
        <Button size="small">
          View History
        </Button>
      </Space>
    </Card>
  )
}

function ComplianceCard({ business, token }) {
  const inspectionStatus = business.lastInspectionStatus || 'none'
  const violationsCount = business.violationsCount || 0
  const hasViolations = violationsCount > 0
  
  const getInspectionInfo = () => {
    switch (inspectionStatus.toLowerCase()) {
      case 'passed':
        return { color: 'success', label: 'Passed', icon: <CheckCircleOutlined /> }
      case 'scheduled':
        return { color: 'processing', label: 'Scheduled', icon: <ClockCircleOutlined /> }
      case 'failed':
        return { color: 'error', label: 'Failed', icon: <ExclamationCircleOutlined /> }
      default:
        return { color: 'default', label: 'No Recent Inspection', icon: <ClockCircleOutlined /> }
    }
  }
  
  const inspectionInfo = getInspectionInfo()
  
  return (
    <Card>
      <Space align="center" size={8} style={{ marginBottom: 16 }}>
        <CheckCircleOutlined style={{ fontSize: 20, color: token.colorInfo }} />
        <Title level={5} style={{ margin: 0 }}>Compliance</Title>
      </Space>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Inspection Status</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color={inspectionInfo.color} icon={inspectionInfo.icon}>
              {inspectionInfo.label}
            </Tag>
          </div>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Violations</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color={hasViolations ? 'error' : 'success'}>
              {hasViolations ? `${violationsCount} Active` : 'None'}
            </Tag>
          </div>
        </div>
      </div>
      
      <Space>
        <Button size="small">
          View Inspections
        </Button>
        {hasViolations && (
          <Button size="small" danger>
            View Violations
          </Button>
        )}
      </Space>
    </Card>
  )
}

export default function ApprovedBusinessView({ business }) {
  const { token } = theme.useToken()

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left Column - Permit Card (spans full height) */}
        <div style={{ gridRow: 'span 3' }}>
          <PermitCard business={business} token={token} />
        </div>
        
        {/* Right Column - Stacked Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RenewalCard business={business} token={token} />
          <PaymentsCard business={business} token={token} />
          <ComplianceCard business={business} token={token} />
        </div>
      </div>
    </div>
  )
}
