import React from 'react'
import { Typography, Card, Divider, Grid, Button, theme } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { getStatusLabel } from '@/shared/utils/statusUtils'
import { formatDate } from '../utils/formatters.js'
import PermitTypesModal from '@/shared/components/PermitTypesModal'

const { Text } = Typography

export default function ApplicationInfoCard({
  business,
  onProgressClick,
  onViewReceipt,
  onViewAppealReceipt,
  onViewAppealDetails,
  onAppealClick,
  loadingAppealDetails = false,
  appealDetails = null,
  onShowAppRejectionModal,
  onShowAppealRejectionModal,
  onShowApprovalCommentModal,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const [permitModalOpen, setPermitModalOpen] = React.useState(false)
  const status = business.applicationStatus || business.permitStatus || 'submitted'
  const statusLower = status.toLowerCase()
  const isDraft = statusLower === 'draft'
  const isRejected = statusLower === 'rejected'

  const rejectionReason = business?.rejectionReason || null
  const approvalComment = business?.reviewComments || null

  return (
    <>
    <Card
      size="small"
      style={{
        marginBottom: 24,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column' }
      }}
    >
      {/* Left Panel - Icon and Title */}
      <div style={{ flex: screens.md ? '0 0 40%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: screens.md ? '48px 16px 16px' : '96px 24px 16px' }}>
        <div>
          <FileTextOutlined style={{ fontSize: 24, color: token.colorTextSecondary, marginBottom: 8 }} />
          <Typography.Title level={5} style={{ margin: 0 }}>Application Details</Typography.Title>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div>
          {statusLower === 'appeal_rejected' ? (
            <>
              {rejectionReason && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Application Rejection Reason</Text>
                  <div>
                    <Button
                      type="link"
                      size="small"
                      onClick={onShowAppRejectionModal}
                      style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              {appealDetails?.resolution && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Appeal Rejection Reason</Text>
                  <div>
                    <Button
                      type="link"
                      size="small"
                      onClick={onShowAppealRejectionModal}
                      style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>Message</Text>
              <Text style={{ marginTop: 4, display: 'block' }}>
                Your appeal has been reviewed and rejected. This is the final decision on your application. You may submit a new application if you wish to apply for a business permit.
              </Text>
            </>
          ) : statusLower === 'appeal_pending' ? (
            <>
              {rejectionReason && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Application Rejection Reason</Text>
                  <div>
                    <Button
                      type="link"
                      size="small"
                      onClick={onShowAppRejectionModal}
                      style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>Message</Text>
              <Text style={{ marginTop: 4, display: 'block' }}>
                Your appeal has been submitted and is currently under review by the LGU. The review process typically takes 5-7 business days. You will be notified once a decision has been made on your appeal.
              </Text>
            </>
          ) : statusLower === 'rejected' ? (
            <>
              {rejectionReason && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Application Rejection Reason</Text>
                  <div>
                    <Button
                      type="link"
                      size="small"
                      onClick={onShowAppRejectionModal}
                      style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>Message</Text>
              <Text style={{ marginTop: 4, display: 'block' }}>
                Your application has been rejected. You may submit an appeal if you believe this decision was made in error.
              </Text>
            </>
          ) : (
            <>
              <Text type="secondary" style={{ fontSize: 12 }}>Message</Text>
              <Text style={{ marginTop: 4, display: 'block' }}>
                {statusLower === 'submitted' && 'Your application has been submitted and is waiting for assignment to an LGU officer.'}
                {statusLower === 'under_review' && 'Your application is currently under review by an LGU officer. You\'ll be notified when a decision is made.'}
                {statusLower === 'needs_revision' && 'Your application requires changes. Please review the feedback below and make the necessary updates.'}
                {statusLower === 'resubmit' && 'Your application has been resubmitted and is awaiting review.'}
                {statusLower === 'approved' && 'Congratulations! Your application has been approved.'}
                {!['submitted', 'under_review', 'needs_revision', 'resubmit', 'approved'].includes(statusLower) && 'View your application status and track its progress.'}
              </Text>
              {statusLower === 'approved' && approvalComment && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Approval Comment</Text>
                  <div style={{ marginTop: 4 }}>
                    <Button
                      type="link"
                      size="small"
                      onClick={onShowApprovalCommentModal}
                      style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          {isRejected && !(business?.hasActiveAppeal || statusLower === 'appeal_pending') && (
            <div style={{ marginTop: 8 }}>
              <Button
                type="link"
                size="small"
                onClick={onAppealClick}
                style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
              >
                <span>
                  Appeal Rejection
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Details Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorderSecondary}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
            <div>
              <Button
                type="link"
                size="small"
                onClick={onProgressClick}
                style={{
                  padding: 0,
                  height: 'auto',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textDecorationColor: statusLower === 'approved' ? token.colorSuccess
                                  : statusLower === 'rejected' ? token.colorError
                                  : statusLower === 'appeal_pending' ? token.colorPurple
                                  : statusLower === 'appeal_rejected' ? token.colorError
                                  : statusLower === 'needs_revision' ? token.colorVolcano
                                  : token.colorInfo
                }}
              >
                <span style={{
                  color: statusLower === 'approved' ? token.colorSuccess
                         : statusLower === 'rejected' ? token.colorError
                         : statusLower === 'appeal_pending' ? token.colorPurple
                         : statusLower === 'appeal_rejected' ? token.colorError
                         : statusLower === 'needs_revision' ? token.colorVolcano
                         : token.colorInfo
                }}>
                  {statusLower === 'submitted' ? 'Waiting for Assignment'
                   : statusLower === 'under_review' ? 'Under Review'
                   : statusLower === 'needs_revision' ? 'Revision Required'
                   : statusLower === 'approved' ? 'Approved'
                   : statusLower === 'rejected' ? 'Rejected'
                   : statusLower === 'appeal_pending' ? 'Appeal Pending'
                   : statusLower === 'appeal_rejected' ? 'Appeal Rejected'
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
            <div>
              <Button
                type="link"
                size="small"
                onClick={() => setPermitModalOpen(true)}
                style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
              >
                {business.registrationType === 'temporary' ? 'Temporary' : 'Regular'}
              </Button>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
            <div><Text strong>{business.applicationReferenceNumber || 'Pending'}</Text></div>
          </div>
          {!isDraft && business.submittedAt && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Application Payment Receipt</Text>
              <div>
                <Button
                  type="link"
                  size="small"
                  onClick={onViewReceipt}
                  style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                >
                  <span>
                    View Receipt
                  </span>
                </Button>
              </div>
            </div>
          )}
          {(business?.hasActiveAppeal || statusLower === 'appeal_pending') && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Appeal Payment Receipt</Text>
              <div>
                <Button
                  type="link"
                  size="small"
                  onClick={onViewAppealReceipt}
                  style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                >
                  <span>View Receipt</span>
                </Button>
              </div>
            </div>
          )}
          {(business?.hasActiveAppeal || statusLower === 'appeal_pending') && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Submitted Appeal</Text>
              <div>
                <Button
                  type="link"
                  size="small"
                  onClick={onViewAppealDetails}
                  loading={loadingAppealDetails}
                  style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                >
                  <span>View Details</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>

    <PermitTypesModal 
      open={permitModalOpen} 
      onCancel={() => setPermitModalOpen(false)}
      selectedPermitType={business?.registrationType === 'temporary' ? (business?.category || business?.formData?.category || 'other') : 'regular'}
    />
    </>
  )
}
