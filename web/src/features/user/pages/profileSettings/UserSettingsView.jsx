import React, { useEffect } from 'react'
import { Layout, Typography, Grid, Button } from 'antd'
import { theme } from 'antd'
import { ArrowLeftOutlined, SettingOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { LayoutPageHeader } from '@/features/shared'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import AdminLayout from '@/features/admin/components/AdminLayout'
import ProfileNav from './ProfileNav'
import GeneralTabContent from './GeneralTabContent'
import SecurityTabContent from './SecurityTabContent'
import ThemeTabContent from './ThemeTabContent'
import NotificationsTabContent from './NotificationsTabContent'
import { PROFILE_NAV_ITEMS, PROFILE_NAV_ITEMS_OWNER, PROFILE_NAV_ITEMS_STAFF } from './constants'

const { Title } = Typography


function getTabContent(selectedTab, themeSettings, isBusinessOwner, isStaffOrAdmin) {
  if (isBusinessOwner && selectedTab === 'notifications') {
    return <GeneralTabContent />
  }
  if (isStaffOrAdmin) {
    switch (selectedTab) {
      case 'account':
        return <SecurityTabContent showPasswordSection={false} showDeleteAccountSection={false} showEmailSection={true} showSessionsSection={true} showMfaSection={false} />
      case 'security':
        return <SecurityTabContent showPasswordSection={true} showDeleteAccountSection={false} />
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
      default:
        return <SecurityTabContent showPasswordSection={true} showDeleteAccountSection={false} />
    }
  }
  switch (selectedTab) {
    case 'general':
      return <GeneralTabContent />
    case 'account':
      return <SecurityTabContent showPasswordSection={false} showDeleteAccountSection={false} showEmailSection={true} showSessionsSection={true} showMfaSection={false} />
    case 'security':
      return <SecurityTabContent showPasswordSection={isBusinessOwner} showDeleteAccountSection={isBusinessOwner} />
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

function SettingsTwoPanel({ token, isMobile, backTo, navItems, selectedTab, setSelectedTab, tabContent }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: 400,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      {/* Left panel - fixed width like UserManagementDesktopView */}
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
        {backTo && (
          <Link to={backTo}>
            <Button type="text" icon={<ArrowLeftOutlined />} style={{ marginBottom: 12, paddingLeft: 0 }}>
              Back to dashboard
            </Button>
          </Link>
        )}
        <ProfileNav selectedTab={selectedTab} onSelectTab={setSelectedTab} navItems={navItems} />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: token.colorBgContainer }}>
          <div
            style={{
              padding: isMobile ? 16 : 24,
              width: '100%',
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              background: token.colorBgContainer,
              boxSizing: 'border-box',
            }}
          >
            {tabContent}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UserSettingsView({
  contextHolder,
  user,
  selectedTab,
  setSelectedTab,
  brandColor,
  passkeyEnabled,
  passkeyLoading,
  officeLabel,
  isStaffRole,
  isBusinessOwner,
  isAdmin = false,
  themeSettings,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const isStaffOrAdmin = isAdmin || (isStaffRole && !isBusinessOwner)

  const navItems = isBusinessOwner
    ? PROFILE_NAV_ITEMS_OWNER
    : isStaffOrAdmin
      ? PROFILE_NAV_ITEMS_STAFF
      : PROFILE_NAV_ITEMS

  const effectiveTab = navItems.some((n) => n.key === selectedTab) ? selectedTab : (navItems[0]?.key || 'security')
  useEffect(() => {
    if (effectiveTab !== selectedTab) setSelectedTab(effectiveTab)
  }, [effectiveTab, selectedTab, setSelectedTab])

  const tabContent = getTabContent(effectiveTab, themeSettings, isBusinessOwner, isStaffOrAdmin)
  const backTo = isBusinessOwner ? '/owner' : null

  const twoPanel = (
    <SettingsTwoPanel
      token={token}
      isMobile={isMobile}
      backTo={backTo}
      navItems={navItems}
      selectedTab={effectiveTab}
      setSelectedTab={setSelectedTab}
      tabContent={tabContent}
    />
  )

  if (isBusinessOwner) {
    return (
      <BusinessOwnerLayout>
        {contextHolder}
        {twoPanel}
      </BusinessOwnerLayout>
    )
  }

  if (isAdmin) {
    return (
      <>
        {contextHolder}
        <AdminLayout pageTitle="Settings" pageIcon={<SettingOutlined />} showPageHeader={true}>
          {twoPanel}
        </AdminLayout>
      </>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sidebar />
      <Layout style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LayoutPageHeader
          pageTitle="Settings"
          pageIcon={<SettingOutlined />}
          viewNotificationsPath="/notifications"
          showPageHeader={true}
        />
        <Layout.Content
          style={{
            padding: 0,
            background: token.colorBgLayout,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {twoPanel}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
