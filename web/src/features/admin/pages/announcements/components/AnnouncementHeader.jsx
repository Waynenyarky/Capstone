import { Button, Tooltip, Typography, theme } from 'antd'
import { ArrowLeftOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function AnnouncementHeader({
  selected,
  onBack,
  onCreateDraft,
  onRefresh,
  onOpenInfo,
  lastUpdated,
  isMobile = false,
}) {
  const { token } = theme.useToken()

  return (
    <div
      style={{
        flexShrink: 0,
        padding: '16px 16px 12px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {isMobile && selected && onBack && (
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ border: `1px solid ${token.colorBorder}` }}
            >
              Announcements
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={onRefresh} aria-label="Refresh announcements" />
          </Tooltip>
          <Tooltip title="About announcements">
            <Button icon={<InfoCircleOutlined />} onClick={onOpenInfo} aria-label="About announcements" />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateDraft}>
            New Announcement
          </Button>
        </div>
      </div>
    </div>
  )
}
