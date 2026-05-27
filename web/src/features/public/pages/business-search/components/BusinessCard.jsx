import React from 'react'
import { Typography, Tag } from 'antd'

const { Text } = Typography

export default function BusinessCard({ business, onClick, token, screens }) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        marginBottom: 12,
        cursor: 'pointer',
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        padding: screens.md ? '24px' : '20px',
        transition: 'all 0.2s',
        background: token.colorBgContainer,
      }}
      onClick={() => onClick(business)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(business)
        }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: screens.md ? 18 : 16, display: 'block', marginBottom: 6, color: token.colorText }}>
            {business.name}
          </Text>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {business.businessType}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              &bull; {business.barangay}
            </Text>
          </div>
        </div>
        <Tag color="success" style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px' }}>
          {business.verificationBadge}
        </Tag>
      </div>
    </div>
  )
}
