/**
 * Presentation Component: ApplicationReviewCard
 * Pure presentation - no business logic
 */
import React from 'react'
import { Card, Button, Space, Tag, Typography } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

export default function ApplicationReviewCard({ application, onApprove, onReject, onRequestRevision, loading }) {
  return (
    <Card
      title={application?.businessName || 'Application'}
      extra={
        <Tag color={application?.status === 'approved' ? 'green' : application?.status === 'rejected' ? 'red' : 'orange'}>
          {application?.status || 'Pending'}
        </Tag>
      }
      actions={[
        <Button
          key="approve"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => onApprove?.(application?.id)}
          loading={loading}
        >
          Approve
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseOutlined />}
          onClick={() => onReject?.(application?.id)}
          loading={loading}
        >
          Reject
        </Button>,
        <Button
          key="revision"
          icon={<EditOutlined />}
          onClick={() => onRequestRevision?.(application?.id)}
          loading={loading}
        >
          Request Revision
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Applicant: </Text>
          <Text>{application?.applicantName || 'N/A'}</Text>
        </div>
        <div>
          <Text strong>Type: </Text>
          <Text>{application?.type || 'N/A'}</Text>
        </div>
        {application?.description && (
          <Paragraph>{application.description}</Paragraph>
        )}
      </Space>
    </Card>
  )
}
