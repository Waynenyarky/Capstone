import React from 'react'
import { Typography, Button, Space } from 'antd'
import { ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import MaintenanceNavItem from './MaintenanceNavItem.jsx'
import { NAV_ITEMS } from '../constants/maintenance.constants.js'

const { Text } = Typography

export default function MaintenanceSidebar({ selectedKey, onSelect, onBackToMenu, onInfoClick, token, headerActions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={onBackToMenu} aria-label="Back to menu" />
          <Button icon={<InfoCircleOutlined />} type="text" onClick={onInfoClick} aria-label="Maintenance info" />
        </Space>
      </div>
      <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
        <Text strong style={{ fontSize: 12, color: token.colorTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Maintenance
        </Text>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.filter((item) => item.key !== 'announcements').map((item) => (
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
        {headerActions}
      </div>
    </div>
  )
}
