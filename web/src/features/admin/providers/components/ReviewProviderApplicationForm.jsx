import { Descriptions, Typography, Button, Divider, Spin, Card, Form, Flex, Modal, Input, App } from 'antd'
import { useReviewProviderApplicationForm } from "@/features/admin/providers/hooks/useReviewProviderApplicationForm.js"
import { useState } from 'react'

export default function ReviewProviderApplicationForm({ providerId, onReviewed }) {
  const { modal } = App.useApp()
  const { provider, isLoading, isApproving, isRejecting, approve, reject, updateRejectionReason, reload } = useReviewProviderApplicationForm(providerId)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectForm] = Form.useForm()
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [snapshot, setSnapshot] = useState(null)
  const canAct = !!providerId && !!provider && provider.status === 'pending' && !isLoading

  const onApprove = async () => {
    modal.confirm({
      title: 'Approve Provider Application',
      content: 'Are you sure you want to approve this provider application? The account status will become Active.',
      okText: 'Approve',
      cancelText: 'Cancel',
      onOk: async () => {
        const updated = await approve()
        if (updated && typeof onReviewed === 'function') onReviewed(updated)
      },
    })
  }
  const onReject = async () => {
    setRejectModalOpen(true)
  }

  if (!providerId) {
    return (
        <Card>
          <Typography.Text type="secondary">Select an application to review.</Typography.Text>
        </Card>
    )
  }

  return (
    <Card title="Review Provider Application">
      {isLoading && (
        <Spin />
      )}
      {!isLoading && provider && (
        <Form>
            <Descriptions variant="outlined" column={1} size="small">
                <Descriptions.Item label="Name">{provider.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Email">{provider.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="Business Name">{provider.businessName || '-'}</Descriptions.Item>
                <Descriptions.Item label="Business Type">{provider.businessType || '-'}</Descriptions.Item>
                <Descriptions.Item label="Years in Business">{provider.yearsInBusiness ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Services Categories">{Array.isArray(provider.servicesCategories) && provider.servicesCategories.length ? provider.servicesCategories.join(', ') : '-'}</Descriptions.Item>
                <Descriptions.Item label="Service Areas">{Array.isArray(provider.serviceAreas) && provider.serviceAreas.length ? provider.serviceAreas.join(', ') : '-'}</Descriptions.Item>
                <Descriptions.Item label="Street Address">{provider.streetAddress || '-'}</Descriptions.Item>
                <Descriptions.Item label="City">{provider.city || '-'}</Descriptions.Item>
                <Descriptions.Item label="Province">{provider.province || '-'}</Descriptions.Item>
                <Descriptions.Item label="Zip Code">{provider.zipCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="Business Phone">{provider.businessPhone || '-'}</Descriptions.Item>
                <Descriptions.Item label="Business Email">{provider.businessEmail || '-'}</Descriptions.Item>
                <Descriptions.Item label="Description">{provider.businessDescription || '-'}</Descriptions.Item>
                <Descriptions.Item label="Has Insurance">{provider.hasInsurance ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Has Licenses">{provider.hasLicenses ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Consents to Background Check">{provider.consentsToBackgroundCheck ? 'Yes' : 'No'}</Descriptions.Item>
                <Descriptions.Item label="Operating Mode">{provider.isSolo ? 'Solo' : 'Team'}</Descriptions.Item>
                {!provider.isSolo && Array.isArray(provider.teamMembers) && provider.teamMembers.length > 0 && (
                  <Descriptions.Item label="Team Members">
                    {provider.teamMembers.map((m, idx) => (
                      <div key={idx}>
                        {(m.firstName || '-') + ' ' + (m.lastName || '-')}
                        {' — ' + (m.email || '-')}
                        {' • ' + (m.phone || '-')}
                      </div>
                    ))}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Status">{provider.status || '-'}</Descriptions.Item>
                <Descriptions.Item label="Application Status">{provider.applicationStatus || '-'}</Descriptions.Item>
                {provider.rejectionReason && (
                  <Descriptions.Item label="Rejection Reason">{provider.rejectionReason}</Descriptions.Item>
                )}
                {provider.reviewedAt && (
                  <Descriptions.Item label="Reviewed At">{new Date(provider.reviewedAt).toLocaleString()}</Descriptions.Item>
                )}
                {provider.reviewedByEmail && (
                  <Descriptions.Item label="Reviewed By">{provider.reviewedByEmail}</Descriptions.Item>
                )}
                <Descriptions.Item label="Submission Count">{provider.applicationSubmissionCount ?? 0}</Descriptions.Item>
                {provider.lastApplicationEditedAt && (
                  <Descriptions.Item label="Last Edited">{new Date(provider.lastApplicationEditedAt).toLocaleString()}</Descriptions.Item>
                )}
                {provider.lastApplicationSubmittedAt && (
                  <Descriptions.Item label="Last Submitted">{new Date(provider.lastApplicationSubmittedAt).toLocaleString()}</Descriptions.Item>
                )}
                <Descriptions.Item label="ID">{provider.id || '-'}</Descriptions.Item>
            </Descriptions>
            {Array.isArray(provider.applicationHistory) && provider.applicationHistory.length > 0 && (
              <>
                <Divider />
                <Typography.Title level={5}>Application History</Typography.Title>
                {provider.applicationHistory.map((entry, idx) => (
                  <Card key={idx} size="small" style={{ marginBottom: 8 }}>
                    <Flex align="center" justify="space-between">
                      <div>
                        <Typography.Text>
                          Version {entry.version} • Submitted {new Date(entry.submittedAt).toLocaleString()} • Decision {entry.decision}
                        </Typography.Text>
                        {entry.reviewedAt && (
                          <Typography.Text type="secondary"> — Reviewed {new Date(entry.reviewedAt).toLocaleString()} by {entry.reviewedByEmail || '-'}</Typography.Text>
                        )}
                        {entry.decision === 'rejected' && entry.rejectionReason && (
                          <div><Typography.Text type="secondary">Reason: {entry.rejectionReason}</Typography.Text></div>
                        )}
                      </div>
                      <Button onClick={() => { setSnapshot(entry.businessSnapshot || null); setSnapshotOpen(true) }}>
                        View Snapshot
                      </Button>
                    </Flex>
                  </Card>
                ))}
              </>
            )}
            <Flex justify="end" gap="small" style={{ marginTop: 24 }}>
                <Button onClick={reload} disabled={isLoading}>
                    Reload
                </Button>
                <Button type="primary" onClick={onApprove} loading={isApproving} disabled={!canAct}>
                    Approve
                </Button>
                <Button danger onClick={onReject} loading={isRejecting} disabled={!canAct}>
                    Reject
                </Button>
                <Button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={!provider || provider.applicationStatus !== 'rejected' || isLoading}
                >
                  Update Reason
                </Button>
            </Flex>
        </Form>
      )}

      <Modal
        title={provider?.applicationStatus === 'rejected' ? 'Update Rejection Reason' : 'Reject Provider Application'}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        okText={provider?.applicationStatus === 'rejected' ? 'Update Reason' : 'Reject'}
        confirmLoading={isRejecting}
        onOk={async () => {
          try {
            const values = await rejectForm.validateFields()
            const reason = values?.rejectionReason || ''
            let updated
            if (provider?.applicationStatus === 'rejected') {
              updated = await updateRejectionReason(reason)
            } else {
              updated = await reject(reason)
            }
            setRejectModalOpen(false)
            rejectForm.resetFields()
            if (updated && typeof onReviewed === 'function') onReviewed(updated)
          } catch (err) { void err }
        }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Reason(s) for Rejection"
            rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
          >
            <Input.TextArea rows={4} placeholder="Explain why this application is being rejected" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Application Snapshot"
        open={snapshotOpen}
        onCancel={() => { setSnapshotOpen(false); setSnapshot(null) }}
        footer={<Button onClick={() => { setSnapshotOpen(false); setSnapshot(null) }}>Close</Button>}
      >
        {snapshot ? (
          <Descriptions variant="outlined" column={1} size="small">
            <Descriptions.Item label="Business Name">{snapshot.businessName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Business Type">{snapshot.businessType || '-'}</Descriptions.Item>
            <Descriptions.Item label="Years in Business">{snapshot.yearsInBusiness ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Service Categories">{Array.isArray(snapshot.servicesCategories) && snapshot.servicesCategories.length ? snapshot.servicesCategories.join(', ') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Service Areas">{Array.isArray(snapshot.serviceAreas) && snapshot.serviceAreas.length ? snapshot.serviceAreas.join(', ') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Street Address">{snapshot.streetAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="City">{snapshot.city || '-'}</Descriptions.Item>
            <Descriptions.Item label="Province">{snapshot.province || '-'}</Descriptions.Item>
            <Descriptions.Item label="Zip Code">{snapshot.zipCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Business Phone">{snapshot.businessPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="Business Email">{snapshot.businessEmail || '-'}</Descriptions.Item>
            <Descriptions.Item label="Description">{snapshot.businessDescription || '-'}</Descriptions.Item>
            <Descriptions.Item label="Has Insurance">{snapshot.hasInsurance ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Has Licenses">{snapshot.hasLicenses ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Consents to Background Check">{snapshot.consentsToBackgroundCheck ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Operating Mode">{snapshot.isSolo ? 'Solo' : 'Team'}</Descriptions.Item>
            {!snapshot.isSolo && Array.isArray(snapshot.teamMembers) && snapshot.teamMembers.length > 0 && (
              <Descriptions.Item label="Team Members">
                {snapshot.teamMembers.map((m, idx) => (
                  <div key={idx}>
                    {(m.firstName || '-') + ' ' + (m.lastName || '-')}
                    {' — ' + (m.email || '-')}
                    {' • ' + (m.phone || '-')}
                  </div>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">No snapshot available.</Typography.Text>
        )}
      </Modal>
    </Card>
  )
}