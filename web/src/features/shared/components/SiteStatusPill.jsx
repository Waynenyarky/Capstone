import { Space, Badge, Typography, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

export default function SiteStatusPill({
  lastUpdated,
  socketConnected,
  onRefresh,
  loading,
  showRefreshButton = true,
  showSocketStatus = true,
}) {
  if (!lastUpdated && !showRefreshButton) {
    return null
  }

  return (
    <Space size="middle" wrap>
      {lastUpdated && (
        <Space size="small" align="center" style={{
          background: showSocketStatus && socketConnected ? 'rgba(82, 196, 26, 0.1)' : 'rgba(0,0,0,0.04)',
          padding: '4px 12px',
          borderRadius: 16,
          border: showSocketStatus ? `1px solid ${socketConnected ? 'rgba(82, 196, 26, 0.3)' : 'rgba(0,0,0,0.1)'}` : '1px solid rgba(0,0,0,0.1)'
        }}>
          {showSocketStatus && (
            <Badge
              status={socketConnected ? 'success' : 'default'}
              text={socketConnected ? 'Live' : 'Offline'}
            />
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            Updated {dayjs(lastUpdated).format('h:mm A')}
          </Text>
        </Space>
      )}
      {showRefreshButton && (
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
        />
      )}
    </Space>
  )
}
