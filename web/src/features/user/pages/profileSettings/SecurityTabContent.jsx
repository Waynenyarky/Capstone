import React, { useState, useEffect } from 'react'
import { Typography, Grid, Select, Alert } from 'antd'
import { theme } from 'antd'
import { TabletOutlined, KeyOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons'
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'
import PasskeyManager from '@/features/authentication/components/PasskeyManager.jsx'
import LoggedInPasswordChangeFlow from '@/features/authentication/flows/LoggedInPasswordChangeFlow.jsx'
import MfaReenrollmentAlert from '@/features/authentication/components/MfaReenrollmentAlert.jsx'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'
import { SECURITY_SECTIONS } from './constants'

const { Title, Text } = Typography

const SIDEBAR_WIDTH = 240

/** Sections to show in Security tab. Password is only for business owner. */
function getSecuritySections(showPasswordSection) {
  if (showPasswordSection) return SECURITY_SECTIONS
  return SECURITY_SECTIONS.filter((s) => s.key !== 'password')
}

function DetailHeader({ icon: Icon, title, tag }) {
  const { token } = theme.useToken()
  return (
    <div
      style={{
        padding: '16px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: token.borderRadius,
          background: token.colorFillAlter,
          color: token.colorPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon style={{ fontSize: 16 }} /> : null}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
          {title}
        </Title>
      </div>
    </div>
  )
}

export default function SecurityTabContent({ showPasswordSection = false }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const sections = getSecuritySections(showPasswordSection)
  const [selectedKey, setSelectedKey] = useState('mfa')
  const { isAdmin, hasPasskeys } = usePasskeyManager()
  const { enabled: mfaEnabled, refetchMfaStatus } = useLoggedInMfaManager()

  useEffect(() => {
    if (!showPasswordSection && selectedKey === 'password') setSelectedKey('mfa')
  }, [showPasswordSection, selectedKey])

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
    if (selectedKey === 'mfa') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <DetailHeader icon={TabletOutlined} title="Two-Factor Authentication" tag={{ color: 'blue', label: 'TOTP' }} />
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
            {isAdmin && (
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="Admin: one super-authentication method"
                description="You can use only one method at a time: either Passkey or Two-Factor Authentication. Enabling one will disable the other."
                style={{ marginBottom: 16 }}
              />
            )}
            <MfaReenrollmentAlert />
            <LoggedInMfaManager isAdmin={isAdmin} hasPasskeys={hasPasskeys} />
          </div>
        </div>
      )
    }
    if (selectedKey === 'passkey') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <DetailHeader icon={KeyOutlined} title="Passkey" tag={{ color: 'green', label: 'Passwordless' }} />
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
            {isAdmin && (
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="Admin: one super-authentication method"
                description="You can use only one method at a time: either Passkey or Two-Factor Authentication. Enabling one will disable the other."
                style={{ marginBottom: 16 }}
              />
            )}
            <PasskeyManager
              isAdmin={isAdmin}
              mfaEnabled={mfaEnabled}
              onRegistrationSuccess={refetchMfaStatus}
            />
          </div>
        </div>
      )
    }
    if (selectedKey === 'password' && showPasswordSection) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <DetailHeader icon={LockOutlined} title="Password" />
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', height: '100%', display: 'flex', marginTop: 48 }}>
            <LoggedInPasswordChangeFlow />
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
          options={sections.map((s) => ({ value: s.key, label: s.label }))}
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
          {sections.map((item) => renderSectionItem(item, selectedKey === item.key))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgContainer }}>
        {renderDetail()}
      </div>
    </div>
  )
}
