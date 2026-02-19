import React from 'react'
import { Layout, Typography, Avatar, Tag, Space, Upload, Grid } from 'antd'
import { theme } from 'antd'
import { CameraOutlined, LoadingOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { resolveAvatarUrl } from '@/lib/utils'
import ProfileNav from './ProfileNav'
import GeneralTabContent from './GeneralTabContent'
import SecurityTabContent from './SecurityTabContent'
import AccountTabContent from './AccountTabContent'
import ThemeTabContent from './ThemeTabContent'
import NotificationsTabContent from './NotificationsTabContent'
import { PROFILE_NAV_ITEMS } from './constants'

const { Title, Text } = Typography

function getTabContent(selectedTab, themeSettings) {
  switch (selectedTab) {
    case 'general':
      return <GeneralTabContent />
    case 'security':
      return <SecurityTabContent />
    case 'account':
      return <AccountTabContent />
    case 'theme':
      return (
        <ThemeTabContent
          themeOptions={themeSettings.themeOptions}
          presetColors={themeSettings.presetColors}
          pendingTheme={themeSettings.pendingTheme}
          hoveredTheme={themeSettings.hoveredTheme}
          currentPrimaryColor={themeSettings.currentPrimaryColor}
          onSelectTheme={themeSettings.handleSelectTheme}
          onMouseEnterTheme={themeSettings.handleMouseEnter}
          onMouseLeaveTheme={themeSettings.handleMouseLeave}
          onApplyTheme={themeSettings.handleApplyTheme}
          onColorChange={themeSettings.handleColorChange}
          onColorMouseEnter={themeSettings.handleColorMouseEnter}
          onColorMouseLeave={themeSettings.handleColorMouseLeave}
        />
      )
    case 'notifications':
      return <NotificationsTabContent />
    default:
      return <GeneralTabContent />
  }
}

export default function UserSettingsView({
  contextHolder,
  user,
  selectedTab,
  setSelectedTab,
  brandColor,
  initials,
  uploading,
  handleAvatarUpload,
  passkeyEnabled,
  passkeyLoading,
  officeLabel,
  isStaffRole,
  themeSettings,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const activeTabLabel = PROFILE_NAV_ITEMS.find((n) => n.key === selectedTab)?.label ?? selectedTab
  const tabContent = getTabContent(selectedTab, themeSettings)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sidebar />
      <Layout.Content
        style={{
          padding: isMobile ? 0 : 24,
          background: token.colorBgLayout,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            borderRadius: token.borderRadiusLG,
            overflow: 'hidden',
            background: token.colorBgContainer,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: 240,
              flexShrink: 0,
              borderRight: `1px solid ${token.colorBorder}`,
              padding: 12,
              overflowY: 'auto',
              background: token.colorBgLayout,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 4, color: brandColor }}>Settings</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>Manage your account</Text>
            </div>
            <ProfileNav selectedTab={selectedTab} onSelectTab={setSelectedTab} />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              background: token.colorBgContainer,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: '16px 24px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                <Avatar
                  size={48}
                  src={user?.avatar ? <img src={resolveAvatarUrl(user?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  style={{ backgroundColor: brandColor, fontSize: 18 }}
                >
                  {!user?.avatar && initials}
                </Avatar>
                <Upload
                  showUploadList={false}
                  customRequest={handleAvatarUpload}
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: token.colorBgContainer,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      border: `1px solid ${token.colorBorder}`,
                      boxShadow: token.boxShadowSecondary,
                    }}
                    title="Change profile photo"
                  >
                    {uploading ? <LoadingOutlined style={{ fontSize: 12, color: token.colorText }} /> : <CameraOutlined style={{ fontSize: 12, color: token.colorTextSecondary }} />}
                  </div>
                </Upload>
              </div>
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ fontSize: 16, display: 'block' }}>{user?.name || 'User'}</Text>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>{activeTabLabel}</Text>
                <Space size={[6, 6]} wrap style={{ marginTop: 6 }}>
                  <Tag color={brandColor} style={{ margin: 0 }}>{user?.role ? String(user.role).toUpperCase() : 'USER'}</Tag>
                  {isStaffRole && officeLabel ? <Tag color="blue" style={{ margin: 0 }}>Office: {officeLabel}</Tag> : null}
                  {user?.mfaEnabled ? <Tag color="success" style={{ margin: 0 }}>MFA</Tag> : <Tag color="warning" style={{ margin: 0 }}>MFA off</Tag>}
                  {passkeyLoading ? <Tag color="default" style={{ margin: 0 }}>...</Tag> : passkeyEnabled ? <Tag color="success" style={{ margin: 0 }}>Passkey</Tag> : <Tag color="warning" style={{ margin: 0 }}>Passkey off</Tag>}
                </Space>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: token.colorBgContainer,
              }}
            >
              <div
                style={{
                  padding: isMobile ? 16 : 24,
                  maxWidth: 900,
                  minHeight: '100%',
                  background: token.colorBgContainer,
                  boxSizing: 'border-box',
                }}
              >
                {tabContent}
              </div>
            </div>
          </div>
        </div>
      </Layout.Content>
    </Layout>
  )
}
