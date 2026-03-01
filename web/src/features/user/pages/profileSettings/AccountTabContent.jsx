import React, { useState } from 'react'
import { Typography, Grid, Select, Button } from 'antd'
import { theme } from 'antd'
import ActiveSessions from '@/features/user/components/ActiveSessions.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import EmailChangeGracePeriod from '@/features/authentication/components/EmailChangeGracePeriod.jsx'
import { ACCOUNT_SECTIONS } from './constants'

const { Title, Paragraph } = Typography

const SECTION_PANEL_WIDTH = 220
/** Centered content width for section detail (login-style consistency) */
const CENTERED_CONTENT_MAX_WIDTH = 420

export default function AccountTabContent() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selectedKey, setSelectedKey] = useState('email')

  const renderDetail = () => {
    const centeredWrapperStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      padding: '0 16px 24px',
    }
    const centeredContentStyle = {
      maxWidth: CENTERED_CONTENT_MAX_WIDTH,
      width: '100%',
    }
    if (selectedKey === 'email') {
      return (
        <div style={{ ...centeredWrapperStyle }}>
          <div style={centeredContentStyle}>
            <EmailChangeGracePeriod />
            <LoggedInEmailChangeFlow />
          </div>
        </div>
      )
    }
    if (selectedKey === 'sessions') {
      return (
        <div style={{ ...centeredWrapperStyle }}>
          <div style={centeredContentStyle}>
            <ActiveSessions />
          </div>
        </div>
      )
    }
    return null
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ flexShrink: 0, marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 4 }}>Account</Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Manage email and active sessions.
          </Paragraph>
        </div>
        <Select
          value={selectedKey}
          onChange={setSelectedKey}
          options={ACCOUNT_SECTIONS.map((s) => ({ value: s.key, label: s.label }))}
          style={{ width: '100%', maxWidth: CENTERED_CONTENT_MAX_WIDTH, margin: '0 auto 16px', display: 'block' }}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {renderDetail()}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 4 }}>Account</Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Manage email and active sessions.
        </Paragraph>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <div
        style={{
          flexShrink: 0,
          width: SECTION_PANEL_WIDTH,
          minWidth: SECTION_PANEL_WIDTH,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          paddingRight: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflowY: 'auto',
        }}
      >
        {ACCOUNT_SECTIONS.map((section) => {
          const IconComponent = section.icon
          return (
          <Button
            key={section.key}
            type={selectedKey === section.key ? 'primary' : 'default'}
            icon={IconComponent ? <IconComponent /> : undefined}
            onClick={() => setSelectedKey(section.key)}
            style={{
              textAlign: 'left',
              justifyContent: 'flex-start',
              fontWeight: selectedKey === section.key ? 600 : 400,
              whiteSpace: 'normal',
              height: 'auto',
              minHeight: 40,
              padding: '8px 12px',
              lineHeight: 1.4,
            }}
          >
            {section.label}
          </Button>
          )
        })}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgContainer }}>
        {renderDetail()}
      </div>
    </div>
    </div>
  )
}
