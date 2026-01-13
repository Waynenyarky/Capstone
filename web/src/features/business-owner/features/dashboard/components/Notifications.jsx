import React from 'react'
import { Card, List, Tag, Button, Space, Typography, Badge, theme } from 'antd'
import { BellOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons'

import { Link } from 'react-router-dom'

const { Text } = Typography

const Notifications = ({ data }) => {
  const { token } = theme.useToken();
  if (!data) return null

  return (
    <Card 
      title={<Space><BellOutlined style={{ color: token.colorPrimary }} /> Notifications <Badge count={data.length} overflowCount={9} style={{ backgroundColor: token.colorWarning }} /></Space>}
      extra={<Link to="/owner/notifications"><Button type="link" size="small">View All</Button></Link>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
      styles={{ body: { padding: 0 } }}
    >
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={item => (
          <List.Item style={{ padding: '12px 24px', background: item.type === 'critical' ? token.colorErrorBg : 'transparent', borderLeft: item.type === 'critical' ? `3px solid ${token.colorError}` : '3px solid transparent' }}>
            <List.Item.Meta
              avatar={
                item.type === 'critical' 
                ? <div style={{ background: token.colorErrorBgHover, padding: 8, borderRadius: '50%' }}><WarningOutlined style={{ color: token.colorError }} /></div>
                : <div style={{ background: token.colorInfoBg, padding: 8, borderRadius: '50%' }}><InfoCircleOutlined style={{ color: token.colorPrimary }} /></div>
              }
              title={<Text strong={item.type === 'critical'} style={{ color: item.type === 'critical' ? token.colorError : 'inherit' }}>{item.message}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>}
            />
          </List.Item>
        )}
      />
      <div style={{ padding: 12, textAlign: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Link to="/owner/notifications"><Button type="link" block>View All Notifications</Button></Link>
      </div>
    </Card>
  )
}

export default Notifications
