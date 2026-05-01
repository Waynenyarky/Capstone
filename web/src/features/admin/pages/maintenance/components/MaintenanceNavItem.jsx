import React from 'react'
import { Typography } from 'antd'
import { DashboardOutlined, ToolOutlined, NotificationOutlined } from '@ant-design/icons'

const { Text } = Typography

const ICON_MAP = {
  DashboardOutlined,
  ToolOutlined,
  NotificationOutlined,
}

export default function MaintenanceNavItem({ key, label, icon, isSelected, onClick, token }) {
  const Icon = typeof icon === 'string' ? ICON_MAP[icon] : icon

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(key)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(key)}
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
            flexShrink: 0,
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
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
}
