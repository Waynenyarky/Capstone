import React from 'react'
import { Typography, theme } from 'antd'
import { DashboardOutlined, TeamOutlined, UserOutlined, SafetyCertificateOutlined, ApartmentOutlined, FileTextOutlined } from '@ant-design/icons'
const { Text } = Typography

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: DashboardOutlined },
  { key: 'office-role', label: 'Staff by Office & Role', icon: ApartmentOutlined },
  { key: 'staff', label: 'Staff Accounts', icon: TeamOutlined },
  { key: 'admins', label: 'Admins', icon: SafetyCertificateOutlined },
  { key: 'business', label: 'Business Owners', icon: UserOutlined },
  { key: 'logs', label: 'Logs', icon: FileTextOutlined },
]

export default function UserManagementDesktopView({
  tabKey,
  setTabKey,
  tabChildren,
  headerActions,
}) {
  const { token } = theme.useToken()

  const renderNavItem = ({ key, label, icon: Icon }, isSelected) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => setTabKey(key)}
      onKeyDown={(e) => e.key === 'Enter' && setTabKey(key)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = token.colorFillTertiary
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {Icon && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 16 }} />
        </span>
      )}
      <Text
        strong={isSelected}
        type={isSelected ? undefined : 'secondary'}
        style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}
      >
        {label}
      </Text>
    </div>
  )

  const selectedLabel = NAV_ITEMS.find((i) => i.key === tabKey)?.label ?? tabKey
  const SelectedIcon = NAV_ITEMS.find((i) => i.key === tabKey)?.icon

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: 400,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      {/* Left panel */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => renderNavItem(item, tabKey === item.key))}
        </div>
      </div>

      {/* Right panel */}
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
        {/* Sticky header with actions */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {SelectedIcon && (
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: token.colorFillTertiary,
                    color: token.colorPrimary,
                  }}
                >
                  <SelectedIcon style={{ fontSize: 18 }} />
                </span>
              )}
              <Text strong style={{ fontSize: 16 }}>{selectedLabel}</Text>
            </div>
            {headerActions}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tabChildren[tabKey]}
        </div>
      </div>
    </div>
  )
}
