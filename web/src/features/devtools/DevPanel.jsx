import { Drawer, Button, Space, Typography, Divider, Tag, List, Tooltip } from 'antd'
import { ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useMemo } from 'react'
import { useDevTools } from './DevToolsProvider'
import './devtools.css'

const { Text, Title } = Typography

const formatTime = (ts) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(ts)

export default function DevPanel({ open, onClose }) {
  const { enabled, pathname, actions, events } = useDevTools()

  const groupedActions = useMemo(() => {
    const byCategory = {}
    actions.forEach((action) => {
      const cat = action.category || 'General'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(action)
    })
    return Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))
  }, [actions])

  if (!enabled) return null

  return (
    <Drawer
      title="Developer Tools"
      placement="right"
      onClose={onClose}
      open={open}
      width={420}
      className="devtools-drawer"
      extra={<Tag color="purple">{pathname}</Tag>}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: 8 }}>Actions by context</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {groupedActions.map(([category, items]) => (
              <div key={category} className="devtools-section">
                <div className="devtools-section-header">
                  <Text strong>{category}</Text>
                  <Tag color="default">{items.length}</Tag>
                </div>
                <List
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      className="devtools-action"
                      actions={[
                        <Button
                          size="small"
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={() => item.run?.()}
                          key="run"
                        >
                          Run
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<span>{item.label}</span>}
                        description={<Text type="secondary">{item.description}</Text>}
                      />
                    </List.Item>
                  )}
                />
              </div>
            ))}
          </Space>
        </div>

        <Divider plain>Recent dev events</Divider>

        <List
          size="small"
          dataSource={events}
          locale={{ emptyText: 'No simulated events yet' }}
          renderItem={(evt) => (
            <List.Item key={evt.id}>
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={evt.type === 'error' ? 'red' : evt.type === 'warning' ? 'orange' : 'blue'}>
                      {evt.type || 'info'}
                    </Tag>
                    <Text strong>{evt.title}</Text>
                    <Tooltip title="Time">
                      <Text type="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ClockCircleOutlined /> {formatTime(evt.ts)}
                      </Text>
                    </Tooltip>
                  </Space>
                }
                description={<Text type="secondary">{evt.description}</Text>}
              />
            </List.Item>
          )}
        />
      </Space>
    </Drawer>
  )
}
