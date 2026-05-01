import React from 'react'
import { Typography, Tag, Space } from 'antd'

const { Text } = Typography

export default function MaintenanceHeader({ title, statusTag, actions, token }) {
  return (
    <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong style={{ fontSize: 16 }}>{title}</Text>
        <Space>
          {statusTag}
          {actions}
        </Space>
      </Space>
    </div>
  )
}
