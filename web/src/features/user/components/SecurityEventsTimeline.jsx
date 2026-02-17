import { Timeline, Typography } from 'antd'

const { Text } = Typography

export default function SecurityEventsTimeline({ events = [] }) {
  const items = events.map((e) => ({
    color: e.type === 'alert' ? 'red' : 'blue',
    children: (
      <div>
        <Text strong>{e.title || e.eventType || 'Event'}</Text>
        <div><Text type="secondary">{e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}</Text></div>
        {e.details && <div><Text>{e.details}</Text></div>}
      </div>
    ),
  }))

  return <Timeline items={items} />
}
