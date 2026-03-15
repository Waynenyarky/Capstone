import React from 'react'
import { Modal, Typography, theme } from 'antd'
import { ShopOutlined, CalendarOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function WelcomeModal({ visible, onSelect, onClose }) {
  const { token } = theme.useToken()
  
  return (
    <Modal
      title="Welcome to BizClear!"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      maskClosable={false}
      closable={!!onClose}
    >
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Choose the type of business you want to add:
      </Typography.Text>
      
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16
        }}>
          <div
            onClick={() => onSelect('permit')}
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
              <ShopOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
            </div>
            <Title level={5} style={{ margin: '0 0 8px 0' }}>Regular</Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Retail, services, restaurants, offices, etc.
            </Typography.Text>
          </div>

          <div
            onClick={() => onSelect('general_permit')}
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
              <CalendarOutlined style={{ fontSize: 24, color: token.colorPrimary}} />
            </div>
            <Title level={5} style={{ margin: '0 0 8px 0' }}>Temporary</Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Food stalls, events, pop-ups, etc. (Monthly permits)
            </Typography.Text>
          </div>
        </div>
      </div>
    </Modal>
  )
}
