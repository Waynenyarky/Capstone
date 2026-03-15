import React from 'react'
import { Card, Typography, Button, Space, Grid } from 'antd'
import { ShopOutlined, FileProtectOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

function RegistrationTypeSelector({ onSelect, token }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
        What would you like to apply for?
      </Title>
      <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 32 }}>
        Choose the type of application that best fits your needs
      </Paragraph>

      <Space direction={isMobile ? 'vertical' : 'horizontal'} size={24} style={{ width: '100%', justifyContent: 'center' }}>
        <Card
          hoverable
          style={{ 
            width: isMobile ? '100%' : 300,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: `2px solid ${token.colorBorderSecondary}`,
          }}
          bodyStyle={{ padding: 24 }}
          onClick={() => onSelect('permit')}
        >
          <div style={{ textAlign: 'center' }}>
            <ShopOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0' }}>Business Permit</Title>
            <Text type="secondary">
              Apply for a new business permit or renew an existing one. Includes comprehensive business registration.
            </Text>
          </div>
        </Card>

        <Card
          hoverable
          style={{ 
            width: isMobile ? '100%' : 300,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: `2px solid ${token.colorBorderSecondary}`,
          }}
          bodyStyle={{ padding: 24 }}
          onClick={() => onSelect('general_permit')}
        >
          <div style={{ textAlign: 'center' }}>
            <FileProtectOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0' }}>General Permit</Title>
            <Text type="secondary">
              Apply for specific permits like construction, special events, or other regulatory clearances.
            </Text>
          </div>
        </Card>
      </Space>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Text type="secondary">
          Not sure? Contact our support team for assistance.
        </Text>
      </div>
    </div>
  )
}

export default RegistrationTypeSelector
