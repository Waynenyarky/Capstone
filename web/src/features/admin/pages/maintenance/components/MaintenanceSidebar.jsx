import React from 'react'
import MaintenanceNavItem from './MaintenanceNavItem.jsx'
import { NAV_ITEMS } from '../constants/maintenance.constants.js'

export default function MaintenanceSidebar({ selectedKey, onSelect, token }) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        borderRight: `1px solid ${token.colorBorder}`,
        padding: 12,
        overflowY: 'auto',
        background: token.colorBgLayout,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => (
          <MaintenanceNavItem
            key={item.key}
            keyProp={item.key}
            label={item.label}
            icon={item.icon}
            isSelected={selectedKey === item.key}
            onClick={onSelect}
            token={token}
          />
        ))}
      </div>
    </div>
  )
}
