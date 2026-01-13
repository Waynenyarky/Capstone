import React from 'react'
import { Card, Timeline, Typography, Space, Button, theme } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'

const { Text } = Typography

const AuditTrail = ({ data }) => {
  if (!data) return null
  const { token } = theme.useToken()

  return (
    <Card 
      title={<Space><HistoryOutlined style={{ color: token.colorPrimary }} /> Recent Activities</Space>}
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
      extra={<Button type="link" size="small">View Full Log</Button>}
    >
      <Timeline
        mode="left"
        items={data.map((item, index) => ({
          color: index === 0 ? 'green' : 'gray',
          dot: index === 0 ? <HistoryOutlined style={{ fontSize: '16px' }} /> : null,
          children: (
            <div style={{ paddingBottom: 12 }}>
              <Text strong style={{ display: 'block' }}>{item.action}</Text>
              <Space split={<div style={{ width: 1, height: 10, background: '#ccc' }} />}>
                 <Text type="secondary" style={{ fontSize: 12 }}>{item.actor}</Text>
                 <Text type="secondary" style={{ fontSize: 12 }}>{item.timestamp}</Text>
              </Space>
            </div>
          ),
        }))}
      />
    </Card>
  )
}

export default AuditTrail
