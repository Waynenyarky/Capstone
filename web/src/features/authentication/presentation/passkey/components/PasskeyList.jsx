/**
 * Presentation Component: PasskeyList
 * Displays list of registered passkeys - pure presentation
 */
import React from 'react'
import { List, Tag, Space, Typography, Empty, Button, Popconfirm } from 'antd'
import { SafetyCertificateOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function PasskeyList({ 
  credentials, 
  loading, 
  onDelete, 
  deleting 
}) {
  if (credentials.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={5} style={{ marginBottom: 12 }}>Registered Passkeys</Title>
      <List
        dataSource={credentials}
        loading={loading}
        locale={{ emptyText: <Empty description="No passkeys registered" /> }}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              credentials.length > 1 ? (
                <Popconfirm
                  title="Delete Passkey"
                  description="Are you sure you want to delete this passkey? You won't be able to use it to sign in anymore."
                  onConfirm={() => onDelete(item.credId)}
                  okText="Yes, Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  disabled={deleting}
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    size="small"
                    loading={deleting}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              ) : null
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
              title={
                <Space>
                  <span>Passkey {index + 1}</span>
                  <Tag color="success">Active</Tag>
                </Space>
              }
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Credential ID: {item.credId?.substring(0, 20)}...
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}
