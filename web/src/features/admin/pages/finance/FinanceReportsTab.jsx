import React from 'react'
import { Typography, theme } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function FinanceReportsTab() {
  const { token } = theme.useToken()

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <BarChartOutlined style={{ fontSize: 40, color: token.colorTextQuaternary, marginBottom: 12 }} />
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        Revenue reports
      </Text>
      <Text type="secondary">
        Export revenue by period (CSV/PDF) will be available here once the backend report APIs are connected.
      </Text>
    </div>
  )
}
