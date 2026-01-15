/**
 * Presentation Component: PermitApplicationsList
 * Pure presentation - no business logic
 */
import React from 'react'
import { Card, List, Tag, Button, Space, Typography } from 'antd'
import { FileTextOutlined, CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

export default function PermitApplicationsList({ applications, loading, onView, onApprove, onReject, onRequestRevision }) {
  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <Title level={5} style={{ margin: 0 }}>Permit Applications</Title>
        </Space>
      }
    >
      <List
        loading={loading}
        dataSource={applications}
        renderItem={(application) => (
          <List.Item
            actions={[
              <Button key="view" size="small" onClick={() => onView?.(application.id)}>
                View
              </Button>,
              <Button 
                key="approve" 
                type="primary" 
                icon={<CheckOutlined />} 
                onClick={() => onApprove?.({ applicationId: application.id, decision: 'approve' })}
                size="small"
              >
                Approve
              </Button>,
              <Button 
                key="reject" 
                danger 
                icon={<CloseOutlined />} 
                onClick={() => onReject?.({ applicationId: application.id, decision: 'reject' })}
                size="small"
              >
                Reject
              </Button>,
              <Button 
                key="revision" 
                icon={<EditOutlined />} 
                onClick={() => onRequestRevision?.({ applicationId: application.id, decision: 'request_revision' })}
                size="small"
              >
                Request Revision
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{application.businessName || 'N/A'}</Text>
                  <Tag color={application.status === 'pending' ? 'orange' : application.status === 'approved' ? 'green' : 'red'}>
                    {application.status}
                  </Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary">Type: {application.type || 'N/A'}</Text>
                  {application.submittedDate && (
                    <Text type="secondary">
                      Submitted: {new Date(application.submittedDate).toLocaleDateString()}
                    </Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
