import React from 'react'
import { DashboardOutlined, ToolOutlined, NotificationOutlined } from '@ant-design/icons'

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
        if (!isSelected) {
          e.currentTarget.style.background = token.colorBgTextSecondary
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {Icon && <Icon style={{ fontSize: 16, color: isSelected ? token.colorPrimary : token.colorTextSecondary }} />}
      <span style={{ fontSize: 13, color: isSelected ? token.colorPrimary : token.colorTextSecondary, fontWeight: isSelected ? 500 : 400 }}>
        {label}
      </span>
    </div>
  )
}
