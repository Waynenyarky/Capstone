import { Typography, Descriptions, Tag, Empty, theme } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Title } = Typography

const EVENT_COLORS = {
  login: 'blue',
  logout: 'default',
  review: 'green',
  approve: 'success',
  reject: 'error',
  claim: 'processing',
  release: 'warning',
  transfer: 'purple',
  create: 'cyan',
  update: 'gold',
  delete: 'red',
}

function formatEventLabel(eventType) {
  return eventType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'
}

export default function LogDetailPanel({ log }) {
  const { token } = theme.useToken()

  if (!log) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a log to view details</Text>}
        />
      </div>
    )
  }

  const eventType = log.eventType || log.action || 'unknown'
  const color = Object.entries(EVENT_COLORS).find(([k]) => eventType.toLowerCase().includes(k))?.[1] || 'default'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorFillTertiary,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <HistoryOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {formatEventLabel(eventType)}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {log.createdAt ? dayjs(log.createdAt).format('MMMM D, YYYY h:mm:ss A') : '—'}
          </Text>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
        <Descriptions
          column={1}
          size="small"
          styles={{
            label: { color: token.colorTextSecondary, fontSize: 12, paddingBottom: 2 },
            content: { fontSize: 13, paddingBottom: 12 },
          }}
        >
        <Descriptions.Item label="Event Type">
          <Tag color={color}>{eventType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Log ID">
          <Text code>{log._id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Timestamp">
          {log.createdAt ? dayjs(log.createdAt).format('MMM D, YYYY h:mm:ss A') : '—'}
        </Descriptions.Item>
        {log.fieldChanged && (
          <Descriptions.Item label="Field Changed">
            <Text strong>{log.fieldChanged}</Text>
          </Descriptions.Item>
        )}
        {log.oldValue && (
          <Descriptions.Item label="Old Value">
            <Text type="secondary">{typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : log.oldValue}</Text>
          </Descriptions.Item>
        )}
        {log.newValue && (
          <Descriptions.Item label="New Value">
            <Text>{typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : log.newValue}</Text>
          </Descriptions.Item>
        )}
        {log.role && (
          <Descriptions.Item label="Role">{log.role}</Descriptions.Item>
        )}
        {log.ipAddress && (
          <Descriptions.Item label="IP Address"><Text code>{log.ipAddress}</Text></Descriptions.Item>
        )}
        {log.hash && (
          <Descriptions.Item label="Hash">
            <Text code copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>{log.hash}</Text>
          </Descriptions.Item>
        )}
        {log.blockchainStatus && (
          <Descriptions.Item label="Blockchain Status">
            <Tag color={log.blockchainStatus === 'confirmed' ? 'success' : log.blockchainStatus === 'pending' ? 'processing' : 'default'}>
              {log.blockchainStatus}
            </Tag>
          </Descriptions.Item>
        )}
        {log.txHash && (
          <Descriptions.Item label="TX Hash">
            <Text code copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>{log.txHash}</Text>
          </Descriptions.Item>
        )}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <Descriptions.Item label="Metadata">
            <pre style={{ fontSize: 11, margin: 0, maxHeight: 200, overflow: 'auto', background: token.colorFillTertiary, padding: 8, borderRadius: token.borderRadius }}>
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </Descriptions.Item>
        )}
        </Descriptions>
      </div>
    </div>
  )
}
