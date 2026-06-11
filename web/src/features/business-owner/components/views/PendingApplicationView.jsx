import React from 'react'
import { Typography, Card, Space, theme, Button, Alert, Modal, Divider, Grid } from 'antd'
import {
  ExclamationCircleOutlined,
  EditOutlined,
  SendOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { getAppealStatusLabel } from '../../services/appealsService'
import { REJECTION_REASON_OPTIONS } from '@/features/staffs/lgu-officer/constants/rejectionReasons'
import { isDraftStatus, isRejectedStatus } from '../../utils/statusUtils'
import { formatDate } from '../../utils/formatters.js'
import { getRejectedFieldItems } from '../../utils/pendingApplicationUtils.js'
import ApplicationProgressTimeline from './pending-application/ApplicationProgressTimeline.jsx'
import DynamicFaqSection from '@/shared/components/DynamicFaqSection.jsx'
import AppealModal from './pending-application/AppealModal.jsx'
import { useAppeal } from '../../hooks/useAppeal.js'

const { Text } = Typography

function getStatusLabel(statusLower) {
  switch (statusLower) {
    case 'draft': return 'Draft'
    case 'submitted': return 'Pending Review'
    case 'under_review': return 'Under Review'
    case 'needs_revision': return 'Action Required'
    case 'resubmit': return 'Resubmitted'
    case 'rejected': return 'Rejected'
    case 'appeal_pending': return 'Appeal Pending'
    case 'approved': return 'Approved'
    default: return statusLower || 'Unknown'
  }
}



export default function PendingApplicationView({ business, onEdit, onSubmit, onDelete, onOpenForm: _onOpenForm, submitting }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const [formDefinition, setFormDefinition] = React.useState(null)
  const status = business.applicationStatus || business.permitStatus || 'submitted'
  const statusLower = status.toLowerCase()
  const isDraft = isDraftStatus(status)
  const isRejected = isRejectedStatus(status)
  const isNeedsRevision = statusLower === 'needs_revision'
  const isResubmitted = statusLower === 'resubmit'
  const businessId = business?.businessId || business?._id

  const {
    appealOpen,
    setAppealOpen,
    appealSubmitting,
    latestAppeal,
    handleSubmitAppeal,
  } = useAppeal(businessId, isRejected)

  const [progressModalOpen, setProgressModalOpen] = React.useState(false)
  
  // Load form definition for proper field labels
  React.useEffect(() => {
    const loadFormDefinition = async () => {
      if (!business?.formType) return
      try {
        const { get } = await import('@/lib/http')
        const query = new URLSearchParams()
        query.set('type', business.formType)
        if (business?.category) query.set('businessType', business.category)
        if (business?.lguCode) query.set('lgu', business.lguCode)

        const url = `/api/forms/active?${query.toString()}`
        const res = await get(url)
        const definition = res?.definition || res
        if (definition?.sections) {
          setFormDefinition(definition)
        }
      } catch (err) {
        console.error('Failed to load form definition:', err)
      }
    }
    loadFormDefinition()
  }, [business?.formType, business?.category])
  
  const sections = formDefinition?.sections || business?.formDefinition?.sections || business?.sections || []
  const rejectedFieldItems = getRejectedFieldItems(business.fieldReviewDecisions, sections)
  const handleOpenAppeal = () => setAppealOpen(true)

  const handleDeleteClick = () => {
    Modal.confirm({
      title: 'Delete application?',
      content: 'This will permanently remove this draft application. You can add a new business later if needed.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => onDelete?.(business),
    })
  }

  return (
    <>
    <div style={{ padding: 24 }}>
      {/* Single panel layout */}
      <div style={{ marginBottom: 24 }}>
        {/* Application Details */}
        <Card
          size="small"
          style={{
            marginBottom: 24,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
          bodyStyle={{ padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column' }}
        >
          {/* Left Panel - Icon and Title */}
          <div style={{ flex: screens.md ? '0 0 40%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: screens.md ? '96px 20px 16px' : '96px 24px 16px' }}>
            <FileTextOutlined style={{ fontSize: 24, color: token.colorTextSecondary, marginBottom: 8 }} />
            <Typography.Title level={5} style={{ margin: 0 }}>Application Details</Typography.Title>
            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
              {statusLower === 'submitted' && 'Your application has been submitted and is waiting for assignment to an LGU officer.'}
              {statusLower === 'under_review' && 'Your application is currently under review by an LGU officer. You\'ll be notified when a decision is made.'}
              {statusLower === 'needs_revision' && 'Your application requires changes. Please review the feedback below and make the necessary updates.'}
              {statusLower === 'resubmit' && 'Your application has been resubmitted and is awaiting review.'}
              {statusLower === 'approved' && 'Congratulations! Your application has been approved.'}
              {statusLower === 'rejected' && 'Your application was rejected. You may submit an appeal if you believe this was an error.'}
              {statusLower === 'appeal_pending' && 'Your appeal is under review. You\'ll be notified of the decision.'}
              {!['submitted', 'under_review', 'needs_revision', 'resubmit', 'approved', 'rejected', 'appeal_pending'].includes(statusLower) && 'View your application status and track its progress.'}
            </Text>
          </div>

          {/* Right Panel - Details Grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorderSecondary}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                <div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setProgressModalOpen(true)}
                    style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    <span style={{
                      color: statusLower === 'approved' ? token.colorSuccess
                             : statusLower === 'rejected' ? token.colorError
                             : statusLower === 'appeal_pending' ? token.colorWarning
                             : statusLower === 'needs_revision' ? token.colorWarning
                             : token.colorInfo
                    }}>
                      {statusLower === 'submitted' ? 'Waiting for Assignment'
                       : statusLower === 'under_review' ? 'Under Review'
                       : statusLower === 'needs_revision' ? 'Revision Required'
                       : statusLower === 'approved' ? 'Approved'
                       : statusLower === 'rejected' ? 'Rejected'
                       : statusLower === 'appeal_pending' ? 'Appeal Pending'
                       : getStatusLabel(statusLower)}
                    </span>
                  </Button>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
                <div><Text strong>{formatDate(business.submittedAt)}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
                <div><Text strong>{business.reviewedAt ? formatDate(business.reviewedAt) : 'Not yet reviewed'}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Business Type</Text>
                <div><Text strong>{business.registrationType === 'temporary' ? 'Temporary' : 'Regular'}</Text></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
                <div><Text strong>{business.applicationReferenceNumber || 'Pending'}</Text></div>
              </div>
              {business.reviewedBy && (
                  <div style={{ gridColumn: '1 / -1', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Reviewing Officer</Text>
                    <div><Text strong>{business.reviewedBy.name || business.reviewedBy.fullName || 'LGU Officer'}</Text></div>
                  </div>
                )}
            </div>
          </div>
        </Card>

        <Divider style={{ margin: '24px 0' }} />

        <div style={{ marginTop: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 12 }}>Frequently Asked Questions</Typography.Title>
          <DynamicFaqSection slotId="business-owner-application-faq" hideWrapper hideHeader />
        </div>

          {/* Decision Card - shows for rejected/needs_revision applications */}
          {(isRejected || isNeedsRevision) && (
            <Card title="Decision" size="small" style={{ marginBottom: 24 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
                  <div><Text strong>{isRejected 
                    ? 'This application has been rejected.'
                    : 'This application requires changes.'}</Text></div>
                </div>
                {business.rejectionReason && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Rejection reason</Text>
                    <div><Text strong>{REJECTION_REASON_OPTIONS.find(r => r.value === business.rejectionReason)?.label || business.rejectionReason}</Text></div>
                  </div>
                )}
                {business.reviewComments && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Comments</Text>
                    <div><Text strong>{business.reviewComments}</Text></div>
                  </div>
                )}
                {business.reviewedAt && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Decision date</Text>
                    <div><Text strong>{formatDate(business.reviewedAt)}</Text></div>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* Appeal Card - shows for rejected applications */}
          {isRejected && (
            <Card title="Appeal" size="small" style={{ marginBottom: 24 }}>
              {business.appealExhausted || latestAppeal?.status === 'rejected' ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                    <div><Text strong style={{ color: token.colorError }}>Appeal Rejected</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
                    <div><Text strong>No further appeals are allowed for this application.</Text></div>
                  </div>
                  {latestAppeal?.resolution && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Resolution</Text>
                      <div><Text strong>{latestAppeal.resolution}</Text></div>
                    </div>
                  )}
                </Space>
              ) : latestAppeal ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                    <div><Text strong style={{ color: token.colorPrimary }}>{getAppealStatusLabel(latestAppeal.status)}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Type</Text>
                    <div><Text strong>
                      {latestAppeal.appealType === 'rejection_appeal' ? 'Appeal Rejection Decision' 
                        : latestAppeal.appealType === 'wrong_assessment' ? 'Wrong Assessment'
                        : latestAppeal.appealType || 'Other'}
                    </Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
                    <div><Text strong>{latestAppeal.description}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
                    <div><Text strong>{latestAppeal.createdAt ? formatDate(latestAppeal.createdAt) : 'N/A'}</Text></div>
                  </div>
                </Space>
              ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text>You can file an appeal if you believe this decision was made in error.</Text>
                    <div><Text type="secondary" style={{ fontSize: 12 }}>You have 30 days from the rejection date to file an appeal.</Text></div>
                  </div>
                  <Button 
                    type="primary"
                    onClick={handleOpenAppeal}
                    icon={<ExclamationCircleOutlined />}
                  >
                    File Appeal
                  </Button>
                </Space>
              )}
            </Card>
          )}

          {/* Issues Identified Card */}
          {(isNeedsRevision || isResubmitted || isRejected) && rejectedFieldItems.length > 0 ? (
            <Card title="Issues Identified" size="small" style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {rejectedFieldItems.map((item) => (
                  <div key={item.fieldKey}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                    <div><Text strong style={{ color: token.colorError }}>{item.reason}</Text></div>
                  </div>
                ))}
              </div>
              {business.reviewComments && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Officer comments</Text>
                  <div><Text strong>{business.reviewComments}</Text></div>
                </div>
              )}
            </Card>
          ) : null}
      </div>

      {/* Action Buttons for Draft */}
      {isDraft && (
        <Card style={{ marginBottom: 24 }}>
          <Alert
            message="Complete Your Application"
            description="Your application is saved as a draft. Please review and complete the form, then submit it for review."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space>
            {onEdit && (
              <Button 
                type="default" 
                icon={<EditOutlined />}
                onClick={() => onEdit(business)}
              >
                Edit Application
              </Button>
            )}
            {onSubmit && (
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={() => onSubmit(business)}
                loading={submitting}
              >
                Submit Application
              </Button>
            )}
            {onDelete && (
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleDeleteClick}
              >
                Delete Application
              </Button>
            )}
          </Space>
        </Card>
      )}

      <AppealModal
        open={appealOpen}
        onCancel={() => setAppealOpen(false)}
        onSubmit={handleSubmitAppeal}
        submitting={appealSubmitting}
      />

      <Modal
        title="Application Progress"
        open={progressModalOpen}
        onCancel={() => setProgressModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <Text >Track your application&apos;s journey through the review process.</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ApplicationProgressTimeline
            business={business}
            status={status}
            statusLower={statusLower}
            latestAppeal={latestAppeal}
          />
        </div>
      </Modal>
    </div>
    </>
  )
}
