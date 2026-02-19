import React from 'react'
import { Typography, Card } from 'antd'
import { theme } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import PendingApprovalAlert from '@/features/user/components/PendingApprovalAlert.jsx'

const { Title, Text } = Typography

export default function GeneralTabContent() {
  const { token } = theme.useToken()

  return (
    <div>
      <Card
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            padding: '24px 24px 20px',
            background: token.colorFillAlter,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            borderTopLeftRadius: token.borderRadiusLG,
            borderTopRightRadius: token.borderRadiusLG,
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${token.colorPrimary}40`,
                flexShrink: 0,
                boxShadow: `0 2px 8px ${token.colorPrimary}15`,
              }}
            >
              <EditOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ margin: 0, marginBottom: 8 }}>Personal Information</Title>
              <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                Update your personal details and profile information. Your profile photo can be updated in the sidebar.
              </Text>
            </div>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <PendingApprovalAlert />
          <EditUserProfileForm embedded={true} />
        </div>
      </Card>
    </div>
  )
}
