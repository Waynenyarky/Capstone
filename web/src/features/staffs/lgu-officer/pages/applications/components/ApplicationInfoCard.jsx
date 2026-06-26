import { Typography, Card, Divider, Grid, Button, Modal, List, Tag, Descriptions, theme } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import { get } from '@/lib/http'
import { formatDate } from './utils/formatters'
import { getStatusLabel } from '@/shared/utils/statusUtils'
import PermitTypesModal from '@/shared/components/PermitTypesModal'
import DocumentPreviewModal from '@/shared/components/DocumentPreviewModal'
import ApplicationProgressModal from './modals/ApplicationProgressModal'
import OwnerDetailsModal from './modals/OwnerDetailsModal'

const { Text } = Typography
const { useBreakpoint } = Grid

export default function ApplicationInfoCard({ application, ownerName, token, ownerIdentity, businessReg, decidedCount, allFieldKeys, fieldReviewDecisions = {}, sections = [], latestAppeal: propLatestAppeal, onShowAppRejectionModal, onShowAppealRejectionModal, onShowAppealLetterModal, onShowApprovalCommentModal }) {
  const screens = useBreakpoint()
  const { token: themeToken } = theme.useToken()
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [ownerModalOpen, setOwnerModalOpen] = useState(false)
  const [changesModalOpen, setChangesModalOpen] = useState(false)
  const [pendingFieldsModalOpen, setPendingFieldsModalOpen] = useState(false)
  const [audits, setAudits] = useState([])
  const [latestAppeal, setLatestAppeal] = useState(propLatestAppeal || null)
  const [previewModal, setPreviewModal] = useState({ open: false, url: null, label: '', type: 'other' })
  const [permitModalOpen, setPermitModalOpen] = useState(false)

  const applicationId = application?.applicationId || application?._id || application?.businessId
  const businessId = application?.businessId || application?.applicationId
  const isAppealPending = application?.status === 'appeal_pending' || application?.applicationStatus === 'appeal_pending'
  const isAppealRejected = application?.status === 'appeal_rejected' || application?.applicationStatus === 'appeal_rejected'

  useEffect(() => {
    if (!applicationId) return

    const fetchAudits = async () => {
      try {
        const res = await get(`/api/auth/audit/staff/all?page=1&limit=100`)
        // Filter logs to only include those related to this application
        const filteredLogs = (res.logs || []).filter(log => {
          // Check if metadata contains applicationId or businessId
          const metadata = log.metadata || {}
          return metadata.applicationId === applicationId ||
                 metadata.businessId === applicationId ||
                 metadata._businessId === applicationId
        })
        setAudits(filteredLogs)
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
        setAudits([])
      }
    }

    fetchAudits()
  }, [applicationId])

  // Fetch appeal data when status is appeal_pending or appeal_rejected
  useEffect(() => {
    // If prop is provided, use it instead of fetching
    if (propLatestAppeal) {
      setLatestAppeal(propLatestAppeal)
      return
    }

    if (!businessId || (!isAppealPending && !isAppealRejected)) {
      setLatestAppeal(null)
      return
    }

    const fetchAppeal = async () => {
      try {
        const res = await get(`/api/business/appeals/by-business/${businessId}`)
        const appeals = res?.data || []
        // Get the latest appeal (any status for appeal_pending or appeal_rejected applications)
        const activeAppeal = appeals[0] || null
        setLatestAppeal(activeAppeal)
      } catch (err) {
        console.error('Failed to fetch appeal:', err)
        setLatestAppeal(null)
      }
    }

    fetchAppeal()
  }, [businessId, isAppealPending, isAppealRejected, propLatestAppeal])

  // Extract unique reviewer names from field_review events
  const reviewers = useMemo(() => {
    const reviewerSet = new Set()
    audits.forEach(audit => {
      if (audit.eventType === 'field_review' && audit.metadata?.reviewedByName) {
        reviewerSet.add(audit.metadata.reviewedByName)
      }
    })
    return Array.from(reviewerSet)
  }, [audits])

  // Read rejection reason directly from application object
  const rejectionReason = application?.rejectionReason || application?.formData?.rejectionReason || null

  // Read approval comment directly from application object
  const approvalComment = application?.reviewComments || application?.formData?.reviewComments || null

  // Helper to get section and field name from fieldKey
  const getFieldDisplayName = (fieldKey) => {
    const parts = fieldKey.split('.')
    const sectionIdx = parseInt(parts[0], 10)
    const fieldKeyPart = parts.slice(1).join('.')

    const section = sections[sectionIdx]
    if (!section) return fieldKey

    const sectionName = section?.label || section?.title || `Section ${sectionIdx + 1}`

    // Find the field in the section items
    const item = section?.items?.find((item) => item.key === fieldKeyPart || item.label === fieldKeyPart)
    const fieldName = item?.label || fieldKeyPart

    return `${sectionName} - ${fieldName}`
  }

  // Calculate fields with request changes
  const requestChangeFields = Object.entries(fieldReviewDecisions)
    .filter(([_, decision]) => decision?.status === 'request_changes')
    .map(([fieldKey, decision]) => ({
      fieldKey,
      displayName: getFieldDisplayName(fieldKey),
      reason: decision?.requestOther || decision?.requestCode || 'No reason provided'
    }))

  // Calculate pending fields (fields without decisions)
  const pendingFields = (allFieldKeys || []).filter(fieldKey => !fieldReviewDecisions[fieldKey]?.status)
    .map(fieldKey => ({
      fieldKey,
      displayName: getFieldDisplayName(fieldKey)
    }))

  const statusLower = (application?.status || application?.applicationStatus)?.toLowerCase() || 'unknown'

  const statusColor = statusLower === 'approved' ? themeToken.colorSuccess
                   : statusLower === 'rejected' ? themeToken.colorError
                   : statusLower === 'appeal_pending' ? themeToken.colorPurple
                   : statusLower === 'appeal_rejected' ? themeToken.colorError
                   : statusLower === 'needs_revision' ? themeToken.colorVolcano
                   : statusLower === 'resubmit' ? themeToken.colorCyan
                   : statusLower === 'suspended' ? themeToken.colorMagenta
                   : themeToken.colorInfo

  const isApproved = application?.status === 'approved' || application?.applicationStatus === 'approved'

  const statusLabel = statusLower === 'submitted' ? 'Waiting for Assignment'
                   : statusLower === 'under_review' ? 'Under Review'
                   : statusLower === 'needs_revision' ? 'Revision Required'
                   : statusLower === 'resubmit' ? 'Resubmitted'
                   : statusLower === 'approved' ? 'Approved'
                   : statusLower === 'rejected' ? 'Rejected'
                   : statusLower === 'appeal_pending' ? 'Appeal Pending'
                   : statusLower === 'appeal_rejected' ? 'Appeal Rejected'
                   : getStatusLabel(application?.status || application?.applicationStatus)

  const businessTypeLabel = application?.businessRegistration?.businessType === 'temporary' ||
                           application?.organizationType === 'temporary' ? 'Temporary' : 'Regular'

  const reviewingOfficerName = application?.reviewedByName ||
    (application?.reviewedBy?.firstName && application?.reviewedBy?.lastName
      ? `${application.reviewedBy.firstName} ${application.reviewedBy.lastName}`
      : application?.reviewedBy?.name) ||
    'LGU Officer'

  return (
    <>
    <Card
      size="small"
      style={{
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        background: token.colorBgContainer,
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column', alignItems: 'stretch' }
      }}
    >
      {/* Left Panel - Key Information */}
      <div style={{ flex: screens.md ? '0 0 50%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: screens.md ? '20px 16px' : '96px 24px 16px' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Business Name</Text>
          <Typography.Title level={5} style={{ margin: 0 }}>{application?.businessName || application?.formData?.businessName || 'Unnamed Business'}</Typography.Title>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Applicant Name</Text>
          <div>
            <Button
              type="link"
              size="small"
              onClick={() => setOwnerModalOpen(true)}
              style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
            >
              {ownerName}
            </Button>
          </div>
        </div>
        {statusLower === 'rejected' && rejectionReason && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Application Rejection Reason</Text>
              <div style={{ marginTop: 4 }}>
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
          </>
        )}
        {statusLower === 'appeal_pending' && (rejectionReason || latestAppeal?.description) && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            {rejectionReason && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Application Rejection Reason</Text>
                <div style={{ marginTop: 4 }}>
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
            {latestAppeal?.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Appeal Letter</Text>
                <div style={{ marginTop: 4 }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={onShowAppealLetterModal}
                    style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {statusLower === 'appeal_rejected' && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            {rejectionReason && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Application Rejection Reason</Text>
                <div style={{ marginTop: 4 }}>
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
            {latestAppeal?.resolution && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Appeal Rejection Reason</Text>
                <div style={{ marginTop: 4 }}>
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
            {latestAppeal?.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Appeal Letter</Text>
                <div style={{ marginTop: 4 }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={onShowAppealLetterModal}
                    style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {statusLower === 'approved' && approvalComment && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
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
          </>
        )}
      </div>

      {/* Right Panel - Details Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorderSecondary}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
            <div>
              <Button
                type="link"
                size="small"
                onClick={() => setProgressModalOpen(true)}
                style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline', textDecorationColor: statusColor }}
              >
                <span style={{ color: statusColor }}>
                  {statusLabel}
                </span>
              </Button>
            </div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
            <div><Text strong>{application?.applicationReferenceNumber || 'Pending'}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Business Type</Text>
            <div>
              <Button
                type="link"
                size="small"
                onClick={() => setPermitModalOpen(true)}
                style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
              >
                {businessTypeLabel}
              </Button>
            </div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Submitted On</Text>
            <div><Text strong>{formatDate(application?.submittedAt)}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
            <div><Text strong>{application?.reviewedAt ? formatDate(application.reviewedAt) : 'Not yet reviewed'}</Text></div>
          </div>
          {latestAppeal && (isAppealPending || isAppealRejected) && (
            <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Appeal Submitted On</Text>
              <div><Text strong>{latestAppeal.createdAt ? formatDate(latestAppeal.createdAt) : 'Unknown'}</Text></div>
            </div>
          )}
          {!isApproved && (
            <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Review Progress</Text>
              <div>
                {decidedCount !== undefined && allFieldKeys?.length && pendingFields.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setPendingFieldsModalOpen(true)}
                    style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    {`${decidedCount}/${allFieldKeys.length} Fields Completed`}
                  </Button>
                ) : (
                  <Text strong>{decidedCount !== undefined && allFieldKeys?.length ? `${decidedCount}/${allFieldKeys.length} Fields Completed` : 'N/A'}</Text>
                )}
              </div>
            </div>
          )}
          {!isApproved && (
            <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Requested Changes</Text>
              <div>
                {requestChangeFields.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setChangesModalOpen(true)}
                    style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    {requestChangeFields.length} Field{requestChangeFields.length !== 1 ? 's' : ''}
                  </Button>
                ) : (
                  <Text strong>0 Fields</Text>
                )}
              </div>
            </div>
          )}
          {application?.reviewedBy && (
            <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Currently Claimed By</Text>
              <div><Text strong>{reviewingOfficerName}</Text></div>
            </div>
          )}
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Reviewers</Text>
            <div><Text strong>{reviewers.length > 0 ? reviewers.join(', ') : 'None'}</Text></div>
          </div>
        </div>
      </div>
    </Card>

    <ApplicationProgressModal
      open={progressModalOpen}
      onClose={() => setProgressModalOpen(false)}
      application={application}
      status={application?.status}
      statusLower={statusLower}
      latestAppeal={application?.latestAppeal}
      isMobile={!screens.md}
    />

    <OwnerDetailsModal
      open={ownerModalOpen}
      onClose={() => setOwnerModalOpen(false)}
      application={application}
      ownerIdentity={ownerIdentity}
      businessReg={businessReg}
      ownerName={ownerName}
    />

    <DocumentPreviewModal
      open={previewModal.open}
      onClose={() => setPreviewModal({ open: false, url: null, label: '', type: 'other' })}
      url={previewModal.url}
      label={previewModal.label}
      type={previewModal.type}
    />

    <Modal
      title="Requested Changes"
      open={changesModalOpen}
      onCancel={() => setChangesModalOpen(false)}
      footer={null}
      width={600}
    >
      {requestChangeFields.length > 0 ? (
        <List
          dataSource={requestChangeFields}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong>{item.displayName}</Text>}
                description={<Text type="secondary">{item.reason}</Text>}
              />
            </List.Item>
          )}
        />
      ) : (
        <Text type="secondary">No requested changes</Text>
      )}
    </Modal>

    <Modal
      title={`Pending Review Fields (${pendingFields.length})`}
      open={pendingFieldsModalOpen}
      onCancel={() => setPendingFieldsModalOpen(false)}
      footer={null}
      width={600}
    >
      {pendingFields.length > 0 ? (
        (() => {
          // Group fields by section
          const groupedBySection = pendingFields.reduce((acc, item) => {
            const sectionMatch = item.displayName.match(/^Section \d+ - /)
            const sectionName = sectionMatch ? item.displayName.split(' - ')[0] : 'Other'
            const fieldName = sectionMatch ? item.displayName.replace(sectionMatch[0], '') : item.displayName
            if (!acc[sectionName]) {
              acc[sectionName] = []
            }
            acc[sectionName].push(fieldName)
            return acc
          }, {})

          return (
            <div>
              {Object.entries(groupedBySection).map(([sectionName, fields]) => (
                <div key={sectionName} style={{ marginBottom: 24 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 12,
                  }}>
                    <Text strong style={{ fontSize: 14, color: themeToken.colorPrimary }}>
                      {sectionName}
                    </Text>
                    <Tag style={{ marginLeft: 8, marginBottom: 0 }}>{fields.length}</Tag>
                  </div>
                  <Descriptions column={1} size="small" bordered>
                    {fields.map((fieldName, idx) => (
                      <Descriptions.Item key={idx} label="">
                        <Text type="secondary">{fieldName}</Text>
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              ))}
            </div>
          )
        })()
      ) : (
        <Text type="secondary">No pending fields</Text>
      )}
    </Modal>

    <PermitTypesModal 
      open={permitModalOpen} 
      onCancel={() => setPermitModalOpen(false)}
      selectedPermitType={application?.businessRegistration?.businessType === 'temporary' ? (application?.category || application?.formData?.category || 'other') : 'regular'}
    />
  </>
  )
}
