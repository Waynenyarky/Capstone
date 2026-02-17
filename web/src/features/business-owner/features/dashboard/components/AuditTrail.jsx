import React from 'react'
import { Card, Timeline, Typography, Space, Button, Empty, theme } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const AuditTrail = ({ data }) => {
  if (!data) return null
  const { token } = theme.useToken()
  const navigate = useNavigate()

  return (
    <Card 
      title={<Space><HistoryOutlined style={{ color: token.colorPrimary }} /> Recent Activities</Space>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
      extra={<Button type="link" size="small" onClick={() => navigate('/owner/businesses')}>View Full Log</Button>}
    >
      {(data || []).length === 0 ? (
        <Empty description="No audit entries" style={{ padding: 24 }} />
      ) : (
        <Timeline
          mode="left"
          items={data.map((item, index) => ({
            color: index === 0 ? token.colorSuccess : token.colorTextQuaternary,
            dot: index === 0 ? <HistoryOutlined style={{ fontSize: '16px' }} /> : null,
            children: (
              <div style={{ paddingBottom: 12 }}>
                <Text strong style={{ display: 'block' }}>{item.action}</Text>
                <Space split={<div style={{ width: 1, height: 10, background: token.colorBorderSecondary }} />}>
                   <Text type="secondary" style={{ fontSize: 12 }}>{item.actor}</Text>
                   <Text type="secondary" style={{ fontSize: 12 }}>{item.timestamp}</Text>
                </Space>
              </div>
            ),
          }))}
        />
      )}
    </Card>
  )
}

export default AuditTrail
