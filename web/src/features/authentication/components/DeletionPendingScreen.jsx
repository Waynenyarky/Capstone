import React from 'react'
import { Button, Typography, ConfigProvider, Divider, Space, Tag } from 'antd'
import { UndoOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { DeletionScheduledBanner } from "@/features/authentication"
import { useAuthSession } from "@/features/authentication/hooks"
import { TopBar } from "@/features/shared"

const { Paragraph, Title, Text } = Typography

export default function DeletionPendingScreen() {
  const { logout, currentUser } = useAuthSession()

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#cf1322', // Red/Danger theme to match urgency
          borderRadius: 8,
        },
      }}
    >
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0f2f5', // Standard Ant Design layout background
      }}>
        <TopBar 
          title="BizClear" 
          roleLabel="Account Locked"
          currentUser={currentUser} 
          onLogout={logout} 
          hideNotifications={true} 
          hideProfileSettings={true} 
        />
        
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', // Ant Design elevated shadow
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            
            {/* Security Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 64,
                height: 64,
                background: '#fff1f0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid #ffa39e'
              }}>
                <LockOutlined style={{ fontSize: '32px', color: '#cf1322' }} />
              </div>
              <Title level={2} style={{ margin: '0 0 8px' }}>Account Locked</Title>
              <Paragraph type="secondary" style={{ fontSize: '16px', margin: 0 }}>
                Access to <Text strong>{currentUser?.email}</Text> is currently restricted.
              </Paragraph>
              <div style={{ marginTop: 12 }}>
                <Tag color="error" icon={<SafetyCertificateOutlined />}>
                  Deletion Pending
                </Tag>
              </div>
            </div>

            {/* Main Action Banner */}
            <div style={{ width: '100%' }}>
              <DeletionScheduledBanner />
            </div>

            <Divider style={{ margin: '32px 0 24px' }} />

            {/* Footer / Support Info */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Reference ID: <Text code>{currentUser?.id?.slice(0, 8).toUpperCase() || 'SEC-REF-NULL'}</Text>
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  If this action was a mistake, please restore your account immediately.
                  <br />
                  For further assistance, contact <a href="#" style={{ color: '#1890ff' }}>IT Support</a>.
                </Text>
              </Space>
            </div>

          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
