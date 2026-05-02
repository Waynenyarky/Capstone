import React from 'react'
import { Typography } from 'antd'

const { Text } = Typography

export default function MaintenanceHeader({ title, statusTag, actions, onBackToMenu, token }) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '16px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBackToMenu && onBackToMenu}
          <Text strong style={{ fontSize: 16 }}>
            {title}
          </Text>
          {statusTag}
        </div>
        {actions}
      </div>
    </div>
  )
}
