import { Card, List, Tag } from 'antd'

export default function SecurityAlertsWidget({ alerts = [] }) {
  return (
    <Card title="Security Alerts" size="small">
      <List
        dataSource={alerts}
        locale={{ emptyText: 'No alerts' }}
        renderItem={(alert) => (
          <List.Item>
            <List.Item.Meta
              title={<span>{alert.title || 'Security event'} <Tag color={alert.severity === 'high' ? 'red' : 'orange'}>{alert.severity || 'info'}</Tag></span>}
              description={alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
