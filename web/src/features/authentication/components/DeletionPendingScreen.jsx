import React from 'react'
import { Layout, Typography, Grid } from 'antd'
import { theme } from 'antd'
import { LayoutPageHeader } from '@/features/shared'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'
import { DeletionScheduledBanner } from '@/features/authentication'

const { Title, Paragraph } = Typography

function DeletionPendingHeader() {
  const screens = Grid.useBreakpoint()
  const { token } = theme.useToken()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <BizClearLogo width={screens.sm ? 36 : 28} />
      <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: token.colorPrimary, fontSize: screens.sm ? '18px' : '16px' }}>
        BizClear
      </Title>
    </div>
  )
}

export default function DeletionPendingScreen() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <LayoutPageHeader
        leftContent={<DeletionPendingHeader />}
        hideNotifications
        hideProfileSettings
      />
      <Layout.Content
        style={{
          padding: isMobile ? 16 : 24,
          background: token.colorBgLayout,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4} style={{ margin: '0 0 8px' }}>
              Account scheduled for deletion
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Your account is in a grace period. Undo below to restore full access, or wait until the scheduled date.
            </Paragraph>
          </div>
          <DeletionScheduledBanner />
        </div>
      </Layout.Content>
    </Layout>
  )
}
