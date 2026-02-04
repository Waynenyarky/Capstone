import React from 'react'
import { Modal, Space, Typography, Card, Alert, Button } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getRegistrationStatusTagDisplay } from '../constants/statusConfig.jsx'

const { Text } = Typography

export default function ReviewCommentsModal({
  open,
  onClose,
  selectedComments
}) {
  if (!selectedComments) return null

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined />
          <span>Review Comments & Feedback</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div><Text strong>Business Name:</Text><Text style={{ marginLeft: 8 }}>{selectedComments.businessName || 'N/A'}</Text></div>
        {selectedComments.applicationReferenceNumber && (
          <div><Text strong>Reference Number:</Text><Text style={{ marginLeft: 8 }}>{selectedComments.applicationReferenceNumber}</Text></div>
        )}
        <div><Text strong>Status:</Text><span style={{ marginLeft: 8 }}>{getRegistrationStatusTagDisplay(selectedComments.status)}</span></div>

        {selectedComments.status === 'rejected' && selectedComments.rejectionReason && (
          <Alert message="Rejection Reason" description={selectedComments.rejectionReason} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        {selectedComments.status === 'needs_revision' && selectedComments.generalComments && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Comments:</Text>
            <Card size="small" style={{ backgroundColor: '#fafafa', marginBottom: 16 }}><Text>{selectedComments.generalComments}</Text></Card>
          </div>
        )}

        {selectedComments.status === 'needs_revision' && selectedComments.requiredChanges && (
          <Alert message="Required Changes" description={selectedComments.requiredChanges} type="warning" showIcon style={{ marginBottom: 16 }} />
        )}

        {selectedComments.status === 'needs_revision' && !selectedComments.generalComments && !selectedComments.requiredChanges && selectedComments.reviewComments && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>LGU Officer Message:</Text>
            <Card size="small" style={{ backgroundColor: '#fafafa', marginBottom: 16 }}><Text>{selectedComments.reviewComments}</Text></Card>
          </div>
        )}

        {selectedComments.status === 'needs_revision' && !selectedComments.generalComments && !selectedComments.requiredChanges && !selectedComments.reviewComments && (
          <Alert message="No Changes Specified" description="This application has been marked as needing revision, but no specific changes have been specified yet." type="warning" showIcon />
        )}

        {selectedComments.status === 'rejected' && selectedComments.reviewComments && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Additional Comments:</Text>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}><Text>{selectedComments.reviewComments}</Text></Card>
          </div>
        )}

        {selectedComments.status !== 'rejected' && selectedComments.status !== 'needs_revision' && selectedComments.reviewComments && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Review Comments:</Text>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}><Text>{selectedComments.reviewComments}</Text></Card>
          </div>
        )}

        {selectedComments.reviewedAt && (
          <div><Text type="secondary" style={{ fontSize: 12 }}>Reviewed on: {dayjs(selectedComments.reviewedAt).format('MMMM D, YYYY [at] h:mm A')}</Text></div>
        )}

        {selectedComments.status === 'rejected' && !selectedComments.rejectionReason && (
          <Alert message="No Rejection Reason Available" description="This application has been rejected, but no specific rejection reason has been provided." type="error" showIcon />
        )}

        {selectedComments.status !== 'rejected' && selectedComments.status !== 'needs_revision' && !selectedComments.reviewComments && !selectedComments.rejectionReason && (
          <Alert message="No Comments Available" description="No review comments or feedback have been provided for this application." type="info" showIcon />
        )}
      </Space>
    </Modal>
  )
}
