import React from 'react'
import { Typography, Grid, theme } from 'antd'
import { ShopOutlined, CalendarOutlined } from '@ant-design/icons'

const { Title } = Typography
const { useBreakpoint } = Grid

function RegistrationTypeSelector({ onSelect }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const options = [
    {
      key: 'permit',
      icon: <ShopOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
      title: 'Regular',
      description: 'Retail, services, restaurants, offices, etc.',
    },
    {
      key: 'general_permit',
      icon: <CalendarOutlined style={{ fontSize: 32, color: token.colorPrimary}} />,
      title: 'Temporary',
      description: 'Food stalls, events, pop-ups, etc. (Monthly permits)',
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>Choose the type of business you want to add:</Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Select the type of business you want to add:
      </Typography.Text>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 16
      }}>
        {options.map((option) => (
          <div
            key={option.key}
            onClick={() => onSelect(option.key)}
            style={{
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              padding: 32,
              transition: 'all 0.2s',
              background: token.colorBgContainer,
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = token.colorPrimary
              e.currentTarget.style.boxShadow = token.boxShadowTertiary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = token.colorBorder
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: token.borderRadiusLG,
              background: token.colorBgLayout,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              {option.icon}
            </div>
            <Title level={5} style={{ margin: '0 0 8px 0' }}>{option.title}</Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {option.description}
            </Typography.Text>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RegistrationTypeSelector
