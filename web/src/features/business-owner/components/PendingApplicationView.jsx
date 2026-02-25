import React from 'react'
import { Typography, Steps, Card, Tag, Space, theme, Divider, Button, Alert } from 'antd'
import {
  FileTextOutlined,
  SearchOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  SendOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

const APPLICATION_STEPS = [
  {
    key: 'submitted',
    title: 'Application Submitted',
    description: 'Your application has been received',
    icon: <FileTextOutlined />,
  },
  {
    key: 'verification',
    title: 'Document Verification',
    description: 'Documents are being verified',
    icon: <SearchOutlined />,
  },
  {
    key: 'review',
    title: 'Assessment Review',
    description: 'Application under review by officers',
    icon: <AuditOutlined />,
  },
  {
    key: 'approval',
    title: 'Permit Issuance',
    description: 'Permit approved and ready',
    icon: <CheckCircleOutlined />,
  },
]

function getStepFromStatus(status) {
  const statusLower = (status || '').toLowerCase()
  switch (statusLower) {
    case 'draft':
      return -1
    case 'submitted':
      return 0
    case 'under_review':
    case 'resubmit':
      return 1
    case 'needs_revision':
      return 1
    case 'approved':
    case 'active':
      return 3
    case 'rejected':
      return -1
    default:
      return 0
  }
}

function getStatusInfo(status) {
  const statusLower = (status || '').toLowerCase()
  switch (statusLower) {
    case 'draft':
      return {
        color: 'default',
        label: 'Draft',
        message: 'Your application is saved as a draft. Complete and submit to proceed.',
        icon: <ClockCircleOutlined />,
      }
    case 'submitted':
      return {
        color: 'processing',
        label: 'Pending Review',
        message: 'Your application has been submitted and is waiting to be reviewed by our team.',
        icon: <ClockCircleOutlined />,
      }
    case 'under_review':
      return {
        color: 'processing',
        label: 'Under Review',
        message: 'Your application is currently being reviewed by our officers. This typically takes 3-5 business days.',
        icon: <SearchOutlined />,
      }
    case 'needs_revision':
    case 'resubmit':
      return {
        color: 'warning',
        label: 'Needs Revision',
        message: 'Your application requires some changes. Please review the comments and resubmit.',
        icon: <ExclamationCircleOutlined />,
      }
    case 'rejected':
      return {
        color: 'error',
        label: 'Rejected',
        message: 'Unfortunately, your application has been rejected. Please review the reason below.',
        icon: <ExclamationCircleOutlined />,
      }
    default:
      return {
        color: 'default',
        label: status || 'Unknown',
        message: 'Application status is being processed.',
        icon: <ClockCircleOutlined />,
      }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default function PendingApplicationView({ business, onEdit, onSubmit, submitting }) {
  const { token } = theme.useToken()
  const status = business.applicationStatus || business.permitStatus || 'submitted'
  const currentStep = getStepFromStatus(status)
  const statusInfo = getStatusInfo(status)
  const isRejected = status.toLowerCase() === 'rejected'
  const isDraft = status.toLowerCase() === 'draft'
  const needsRevision = status.toLowerCase() === 'needs_revision' || status.toLowerCase() === 'resubmit'

  return (
    <div style={{ padding: 24 }}>
      {/* Status Card */}
      <Card
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Space align="start" size={16}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: token.borderRadiusLG,
              background: token[`color${statusInfo.color === 'processing' ? 'Primary' : statusInfo.color === 'warning' ? 'Warning' : statusInfo.color === 'error' ? 'Error' : 'Fill'}Bg`],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: token[`color${statusInfo.color === 'processing' ? 'Primary' : statusInfo.color === 'warning' ? 'Warning' : statusInfo.color === 'error' ? 'Error' : 'TextSecondary'}`],
            }}
          >
            {statusInfo.icon}
          </div>
          <div style={{ flex: 1 }}>
            <Space align="center" size={8}>
              <Title level={5} style={{ margin: 0 }}>Current Status</Title>
              <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
            </Space>
            <Paragraph type="secondary" style={{ margin: '8px 0 0', maxWidth: 500 }}>
              {statusInfo.message}
            </Paragraph>
          </div>
        </Space>
      </Card>

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
          </Space>
        </Card>
      )}

      {/* Action Buttons for Needs Revision */}
      {needsRevision && (
        <Card style={{ marginBottom: 24 }}>
          <Space>
            {onEdit && (
              <Button 
                type="default" 
                icon={<EditOutlined />}
                onClick={() => onEdit(business)}
              >
                Edit & Resubmit
              </Button>
            )}
          </Space>
        </Card>
      )}

      {/* Progress Timeline */}
      {!isRejected && (
        <Card title="Application Progress" style={{ marginBottom: 24 }}>
          <Steps
            current={currentStep}
            items={APPLICATION_STEPS.map((step, index) => ({
              title: step.title,
              description: step.description,
              icon: step.icon,
              status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait',
            }))}
          />
        </Card>
      )}

      {/* Rejection Reason */}
      {isRejected && business.rejectionReason && (
        <Card
          title="Rejection Reason"
          style={{ marginBottom: 24, borderColor: token.colorErrorBorder }}
          styles={{ header: { color: token.colorError } }}
        >
          <Paragraph>{business.rejectionReason}</Paragraph>
        </Card>
      )}

      {/* Review Comments (for needs_revision) */}
      {(status.toLowerCase() === 'needs_revision' || status.toLowerCase() === 'resubmit') && business.reviewComments && (
        <Card
          title="Review Comments"
          style={{ marginBottom: 24, borderColor: token.colorWarningBorder }}
          styles={{ header: { color: token.colorWarning } }}
        >
          <Paragraph>{business.reviewComments}</Paragraph>
        </Card>
      )}

      {/* Application Details */}
      <Card title="Application Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {business.applicationReferenceNumber || 'Pending Assignment'}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Submitted Date</Text>
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {formatDate(business.submittedAt)}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Business Name</Text>
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {business.businessName || business.tradeName || 'N/A'}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Application Type</Text>
            <div>
              <Text strong style={{ fontSize: 14, textTransform: 'capitalize' }}>
                {business.formType?.replace(/_/g, ' ') || 'Business Permit'}
              </Text>
            </div>
          </div>
        </div>

        {business.reviewedAt && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    {formatDate(business.reviewedAt)}
                  </Text>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
