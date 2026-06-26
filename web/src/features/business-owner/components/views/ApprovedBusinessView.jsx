import { useState, useCallback, useEffect } from 'react'
import { Card, Tag, Button, theme, Descriptions, Alert, Space, Collapse } from 'antd'
import {
  SafetyCertificateOutlined, DollarOutlined, FileTextOutlined, EditOutlined, FileDoneOutlined,
  SolutionOutlined, InfoCircleOutlined,
} from '@ant-design/icons'
import { getEditRequests } from '../../services/editRequestsService'
import { formatDate } from '../../utils/formatters.js'
import { usePermitProgress } from '../../hooks/usePermitProgress.js'
import ApplicationFormTab from './approved-business/ApplicationFormTab.jsx'
import PaymentsTab from './approved-business/PaymentsTab.jsx'
import ComplianceTab from './approved-business/ComplianceTab.jsx'
import PostRequirementsTab from './approved-business/PostRequirementsTab.jsx'
import EditRequestDrawer from './approved-business/EditRequestDrawer.jsx'
import AppealDrawer from './approved-business/AppealDrawer.jsx'
import ProgressStepper from './approved-business/ProgressStepper.jsx'
import ActiveActionCard from './approved-business/ActiveActionCard.jsx'

function PermitsTab({ _businessId, _businessName, _onPermitDownloaded }) {
  return <div style={{ padding: 24, textAlign: 'center' }}>Permit download feature coming soon</div>
}

export default function ApprovedBusinessView({ business, onRefresh }) {
  const { token } = theme.useToken()
  const [editOpen, setEditOpen] = useState(false)
  const [appealOpen, setAppealOpen] = useState(false)
  const [permitDownloaded, setPermitDownloaded] = useState(false)
  const [pendingEditRequests, setPendingEditRequests] = useState([])
  const [recentEditResults, setRecentEditResults] = useState([])
  const [dismissedEditResults, setDismissedEditResults] = useState([])

  const businessId = business?.businessId || business?._id

  // Fetch edit requests (pending and recently processed)
  const fetchEditRequests = useCallback(() => {
    if (!businessId) return
    getEditRequests()
      .then(data => {
        const all = Array.isArray(data) ? data : data?.data || data?.requests || []
        const forBusiness = all.filter(r => r.businessId === businessId)
        
        const pending = forBusiness.filter(r => 
          r.status === 'pending' || r.status === 'submitted' || !r.status
        )
        setPendingEditRequests(pending)
        
        // Get recently processed (approved/rejected) within last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentlyProcessed = forBusiness.filter(r => 
          (r.status === 'approved' || r.status === 'rejected') &&
          r.updatedAt && new Date(r.updatedAt) > sevenDaysAgo
        )
        setRecentEditResults(recentlyProcessed)
      })
      .catch(() => {
        setPendingEditRequests([])
        setRecentEditResults([])
      })
  }, [businessId])

  useEffect(() => {
    fetchEditRequests()
  }, [fetchEditRequests])

  const dismissEditResult = (requestId) => {
    setDismissedEditResults(prev => [...prev, requestId])
  }

  // Filter out dismissed results
  const visibleEditResults = recentEditResults.filter(r => !dismissedEditResults.includes(r._id))

  const {
    payments, pendingPayments, allPaid,
    hasActivePermit, pendingPostReqs,
    currentStep, stepStatuses, nextAction, loading, refetchPayments,
  } = usePermitProgress(business, businessId, permitDownloaded)

  const hasPendingEditRequest = pendingEditRequests.length > 0

  const collapseItems = [
    {
      key: 'payments',
      label: (
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Payments & Fees
          {pendingPayments.length > 0 && <Tag color="warning" style={{ marginLeft: 8, color: '#000' }}>{pendingPayments.length} pending</Tag>}
        </span>
      ),
      children: <PaymentsTab businessId={businessId} onPaymentComplete={refetchPayments} />,
    },
    {
      key: 'permit',
      label: (
        <span style={{ color: (!allPaid && pendingPayments.length > 0) ? '#bfbfbf' : undefined }}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          Mayor&apos;s Permit
          {hasActivePermit && <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag>}
          {!allPaid && pendingPayments.length > 0 && <Tag color="default" style={{ marginLeft: 8 }}>Complete payments first</Tag>}
        </span>
      ),
      children: (!allPaid && pendingPayments.length > 0) 
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Please complete all payments to access permit information</div>
          </div>
        : <PermitsTab businessId={businessId} businessName={business?.businessName} onPermitDownloaded={() => setPermitDownloaded(true)} />,
      disabled: !allPaid && pendingPayments.length > 0,
    },
    {
      key: 'compliance',
      label: (
        <span style={{ color: (!allPaid && pendingPayments.length > 0) ? '#bfbfbf' : undefined }}>
          <SolutionOutlined style={{ marginRight: 8 }} />
          Inspections & Compliance
          {!allPaid && pendingPayments.length > 0 && <Tag color="default" style={{ marginLeft: 8 }}>Complete payments first</Tag>}
        </span>
      ),
      children: (!allPaid && pendingPayments.length > 0) 
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Please complete all payments to access compliance information</div>
          </div>
        : <ComplianceTab businessId={businessId} />,
      disabled: !allPaid && pendingPayments.length > 0,
    },
    {
      key: 'post-requirements',
      label: (
        <span style={{ color: (!allPaid && pendingPayments.length > 0) ? '#bfbfbf' : undefined }}>
          <FileDoneOutlined style={{ marginRight: 8 }} />
          Post-Requirements
          {pendingPostReqs.length > 0 && <Tag color="warning" style={{ marginLeft: 8 }}>{pendingPostReqs.length} pending</Tag>}
          {!allPaid && pendingPayments.length > 0 && <Tag color="default" style={{ marginLeft: 8 }}>Complete payments first</Tag>}
        </span>
      ),
      children: (!allPaid && pendingPayments.length > 0) 
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Please complete all payments to access post-requirements</div>
          </div>
        : <PostRequirementsTab businessId={businessId} />,
      disabled: !allPaid && pendingPayments.length > 0,
    },
    {
      key: 'application-form',
      label: <span><FileTextOutlined style={{ marginRight: 8 }} />Submitted Application Form</span>,
      children: <ApplicationFormTab business={business} />,
    },
  ]

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Left Column - Actions, Alerts, and Progress */}
        <div style={{ flex: '0 0 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Actions Card */}
          <Card
            size="small"
            title="Actions"
            style={{ borderRadius: token.borderRadiusLG }}
          >
            {/* Alerts inside Actions card */}
            {visibleEditResults.map(result => (
              <Alert
                key={result._id}
                type={result.status === 'approved' ? 'success' : 'error'}
                showIcon
                closable
                onClose={() => dismissEditResult(result._id)}
                message={result.status === 'approved' ? 'Edit Request Approved' : 'Edit Request Rejected'}
                description={
                  <>
                    Your request to change <strong>{result.fieldName}</strong> to &ldquo;{result.requestedValue}&rdquo; was {result.status}.
                    {result.reviewNotes && <div style={{ marginTop: 4 }}><em>Note: {result.reviewNotes}</em></div>}
                  </>
                }
                style={{ marginBottom: 16 }}
              />
            ))}

            {hasPendingEditRequest && (
              <Alert
                type="info"
                showIcon
                icon={<EditOutlined />}
                message="Edit Request Pending"
                description={`You have ${pendingEditRequests.length} edit request${pendingEditRequests.length > 1 ? 's' : ''} awaiting review by the BPLO. You will be notified once processed.`}
                style={{ marginBottom: 16 }}
              />
            )}
            
            {!loading && <ActiveActionCard nextAction={nextAction} token={token} style={{ marginBottom: 16 }} />}

            <Space wrap size="small" style={{ paddingTop: 12 }}>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditOpen(true)}
                disabled={hasPendingEditRequest || pendingPayments.length > 0}
              >
                {pendingPayments.length > 0 ? 'Clear Payments First' : hasPendingEditRequest ? 'Edit Request Pending' : 'Request Edits'}
              </Button>
            </Space>
          </Card>

          {/* Permit Application Progress Card */}
          <Card title="Permit Application Progress" size="small" >
            <ProgressStepper stepStatuses={stepStatuses} currentStep={currentStep} token={token} business={business} payments={payments} />
          </Card>

          {/* Business Details Card */}
          <Card title="Business Details" size="small" style={{ marginBottom: 24 }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Business Name">
                {business?.formData?.businessName || 
                 business?.businessName || 
                 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{business?.applicationReferenceNumber || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Registration Date">{formatDate(business?.submittedAt || business?.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Approval Date">{formatDate(business?.reviewedAt || business?.approvedAt)}</Descriptions.Item>
              <Descriptions.Item label="Permit Status">
                {hasActivePermit
                  ? <Tag color="success">Active — {business?.permitNumber}</Tag>
                  : <Tag color="default">Not yet issued</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {business?.formData?.businessEmail || 
                 business?.emailAddress || 
                 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {business?.formData?.businessPhone || 
                 business?.mobileNumber || 
                 business?.contactNumber || 
                 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Right Column - Details Only */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Collapsible Detail Sections */}
          <Collapse
            defaultActiveKey={['payments']}
            items={collapseItems}
            accordion
            style={{ borderRadius: token.borderRadiusLG }}
          />
        </div>
      </div>

      <EditRequestDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        business={business}
        onSuccess={() => { fetchEditRequests(); onRefresh?.(); }}
      />
      <AppealDrawer
        open={appealOpen}
        onClose={() => setAppealOpen(false)}
        business={business}
        onSuccess={onRefresh}
      />
    </div>
  )
}
