import { Typography, Card, Divider, Grid, Button, Modal, List, Drawer } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import { get } from '@/lib/http'
import { formatDate } from './utils/formatters'
import ApplicationProgressTimeline from '@/features/business-owner/components/views/pending-application/ApplicationProgressTimeline.jsx'
import OwnerInfoReadOnlyView from '../../../components/OwnerInfoReadOnlyView'

const { Text } = Typography
const { useBreakpoint } = Grid

export default function ApplicationInfoCard({ application, ownerName, token, ownerIdentity, businessReg, decidedCount, allFieldKeys, fieldReviewDecisions = {}, sections = [] }) {
  const screens = useBreakpoint()
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [ownerModalOpen, setOwnerModalOpen] = useState(false)
  const [changesModalOpen, setChangesModalOpen] = useState(false)
  const [pendingFieldsModalOpen, setPendingFieldsModalOpen] = useState(false)
  const [audits, setAudits] = useState([])

  const applicationId = application?.applicationId || application?._id || application?.businessId

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

  const statusColor = (application?.status === 'approved' || application?.applicationStatus === 'approved') ? token.colorSuccess
                   : (application?.status === 'rejected' || application?.applicationStatus === 'rejected') ? token.colorError
                   : (application?.status === 'needs_revision' || application?.applicationStatus === 'needs_revision') ? token.colorWarning
                   : token.colorInfo

  const isApproved = application?.status === 'approved' || application?.applicationStatus === 'approved'

  const statusLabel = (application?.status === 'submitted' || application?.applicationStatus === 'submitted') ? 'Waiting for Assignment'
                   : (application?.status === 'under_review' || application?.applicationStatus === 'under_review') ? 'Under Review'
                   : (application?.status === 'needs_revision' || application?.applicationStatus === 'needs_revision') ? 'Revision Required'
                   : (application?.status === 'approved' || application?.applicationStatus === 'approved') ? 'Approved'
                   : (application?.status === 'rejected' || application?.applicationStatus === 'rejected') ? 'Rejected'
                   : application?.status || application?.applicationStatus || 'Unknown'

  const businessTypeLabel = application?.businessRegistration?.businessType === 'temporary' ||
                           application?.organizationType === 'temporary' ? 'Temporary' : 'Regular'

  const reviewingOfficerName = application?.reviewedByName ||
    (application?.reviewedBy?.firstName && application?.reviewedBy?.lastName
      ? `${application.reviewedBy.firstName} ${application.reviewedBy.lastName}`
      : application?.reviewedBy?.name) ||
    'LGU Officer'

  const statusLower = (application?.status || application?.applicationStatus)?.toLowerCase() || 'unknown'

  return (
    <>
    <Card
      size="small"
      style={{
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        background: token.colorBgContainer,
      }}
      bodyStyle={{ padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column' }}
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
      </div>

      {/* Right Panel - Details Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorder}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorder}` }}>
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
            <div><Text strong>{businessTypeLabel}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Submitted On</Text>
            <div><Text strong>{formatDate(application?.submittedAt)}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
            <div><Text strong>{application?.reviewedAt ? formatDate(application.reviewedAt) : 'Not yet reviewed'}</Text></div>
          </div>
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

    {screens.md ? (
      <Modal
        title="Application Progress"
        open={progressModalOpen}
        onCancel={() => setProgressModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ApplicationProgressTimeline
            business={application}
            status={application?.status}
            statusLower={statusLower}
            latestAppeal={application?.latestAppeal}
          />
        </div>
      </Modal>
    ) : (
      <Drawer
        title="Application Progress"
        open={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        placement="right"
        width="75%"
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ApplicationProgressTimeline
            business={application}
            status={application?.status}
            statusLower={statusLower}
            latestAppeal={application?.latestAppeal}
          />
        </div>
      </Drawer>
    )}

    <Modal
      title="Owner Details"
      open={ownerModalOpen}
      onCancel={() => setOwnerModalOpen(false)}
      footer={null}
      width={800}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <OwnerInfoReadOnlyView
          application={application}
          ownerIdentity={ownerIdentity}
          businessReg={businessReg}
          ownerName={ownerName}
        />
      </div>
    </Modal>

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
      title="Pending Review Fields"
      open={pendingFieldsModalOpen}
      onCancel={() => setPendingFieldsModalOpen(false)}
      footer={null}
      width={600}
    >
      {pendingFields.length > 0 ? (
        <List
          dataSource={pendingFields}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong>{item.displayName}</Text>}
              />
            </List.Item>
          )}
        />
      ) : (
        <Text type="secondary">All fields have been reviewed</Text>
      )}
    </Modal>
  </>
  )
}
