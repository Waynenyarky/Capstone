import React from 'react'
import { Card, List, Tag, Button, Space, Typography, Badge } from 'antd'
import { BellOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons'

const { Text } = Typography

const Notifications = ({ data }) => {
  if (!data) return null

  return (
    <Card 
      title={<Space><BellOutlined style={{ color: '#003a70' }} /> Notifications <Badge count={data.length} overflowCount={9} style={{ backgroundColor: '#faad14' }} /></Space>}
      extra={<Button type="link" size="small">Mark all as read</Button>}
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
      styles={{ body: { padding: 0 } }}
    >
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={item => (
          <List.Item style={{ padding: '12px 24px', background: item.type === 'critical' ? '#fff1f0' : 'transparent', borderLeft: item.type === 'critical' ? '3px solid #ff4d4f' : '3px solid transparent' }}>
            <List.Item.Meta
              avatar={
                item.type === 'critical' 
                ? <div style={{ background: '#ffccc7', padding: 8, borderRadius: '50%' }}><WarningOutlined style={{ color: '#cf1322' }} /></div>
                : <div style={{ background: '#bae7ff', padding: 8, borderRadius: '50%' }}><InfoCircleOutlined style={{ color: '#003a70' }} /></div>
              }
              title={<Text strong={item.type === 'critical'} style={{ color: item.type === 'critical' ? '#cf1322' : 'inherit' }}>{item.message}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>}
            />
          </List.Item>
        )}
      />
      <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
        <Button type="link" block>View All Notifications</Button>
      </div>
    </Card>
  )
}

export default Notifications
