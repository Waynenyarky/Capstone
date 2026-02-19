import React, { useState } from 'react'
import { Typography, Tag, Grid, Select } from 'antd'
import { theme } from 'antd'
import { MailOutlined, DesktopOutlined } from '@ant-design/icons'
import ActiveSessions from '@/features/user/components/ActiveSessions.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import EmailChangeGracePeriod from '@/features/authentication/components/EmailChangeGracePeriod.jsx'
import { ACCOUNT_SECTIONS } from './constants'

const { Title, Text } = Typography

const SIDEBAR_WIDTH = 240

function DetailHeader({ icon: Icon, title, tag, danger }) {
  const { token } = theme.useToken()
  const iconColor = danger ? token.colorError : token.colorPrimary
  const borderColor = danger ? token.colorErrorBorder : token.colorBorderSecondary
  return (
    <div
      style={{
        padding: '16px 16px',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        ...(danger ? { background: token.colorErrorBg } : {}),
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: danger ? token.colorErrorBg : token.colorFillAlter,
          color: iconColor,
          border: `1px solid ${danger ? token.colorErrorBorder : token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon style={{ fontSize: 16 }} /> : null}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Title level={5} style={{ margin: 0, lineHeight: 1.3, color: danger ? token.colorError : undefined }}>
          {title}
          {tag && <Tag color={tag.color} style={{ marginLeft: 8, fontSize: 11 }}>{tag.label}</Tag>}
        </Title>
      </div>
    </div>
  )
}

export default function AccountTabContent() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selectedKey, setSelectedKey] = useState('email')

  const renderSectionItem = ({ key: itemKey, label, icon: Icon }, isSelected) => (
    <div
      key={itemKey}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedKey(itemKey)}
      onKeyDown={(e) => e.key === 'Enter' && setSelectedKey(itemKey)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
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

  const renderDetail = () => {
    if (selectedKey === 'email') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <DetailHeader icon={MailOutlined} title="Email" />
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
            <EmailChangeGracePeriod />
            <LoggedInEmailChangeFlow />
          </div>
        </div>
      )
    }
    if (selectedKey === 'sessions') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <DetailHeader icon={DesktopOutlined} title="Active Sessions" />
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
            <ActiveSessions />
          </div>
        </div>
      )
    }
    return null
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select
          size="large"
          value={selectedKey}
          onChange={setSelectedKey}
          options={ACCOUNT_SECTIONS.map((s) => ({ value: s.key, label: s.label }))}
          style={{ width: '100%' }}
        />
        {renderDetail()}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 400 }}>
      <div
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          padding: 12,
          overflowY: 'auto',
          background: token.colorBgLayout,
          borderRight: `1px solid ${token.colorBorder}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ACCOUNT_SECTIONS.map((item) => renderSectionItem(item, selectedKey === item.key))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgContainer }}>
        {renderDetail()}
      </div>
    </div>
  )
}
