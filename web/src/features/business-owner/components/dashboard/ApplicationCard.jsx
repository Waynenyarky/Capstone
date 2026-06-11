import { Card, Tag, Space, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ShopOutlined } from '@ant-design/icons'
import { getStatusTagColor, isDraftStatus } from '../../utils/statusUtils'

dayjs.extend(relativeTime)

const { Text } = Typography

export default function ApplicationCard({ business, isSelected, onClick, style }) {
  const { token } = theme.useToken()
  const isDraft = isDraftStatus(business.permitStatus)
  const hasRef = business.referenceNumber != null && business.referenceNumber !== ''
  const timeSinceCreation = business.createdAt ? dayjs(business.createdAt).fromNow() : null
  const timeSinceUpdate = business.updatedAt ? dayjs(business.updatedAt).fromNow() : null
  const statusColor = business.rawStatus ? getStatusTagColor(business.rawStatus) : getStatusTagColor(business.permitStatus)

  return (
    <Card
      hoverable
      size="small"
      onClick={onClick}
      style={{
        width: '100%',
        cursor: 'pointer',
        border: isSelected ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
        borderRadius: 6,
        ...(style || {}),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Space size={8}>
          <ShopOutlined style={{ fontSize: 16, color: isSelected ? token.colorPrimary : token.colorTextSecondary }} />
          <Text strong style={{ fontSize: 13 }}>{business.name}</Text>
        </Space>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <Tag color={statusColor} style={{ fontSize: 11 }}>{business.permitStatus}</Tag>
        {hasRef && (
          <Tag style={{ fontSize: 11 }}>{business.referenceNumber}</Tag>
        )}
        {timeSinceUpdate && (
          <Tag style={{ fontSize: 11 }}>Updated {timeSinceUpdate}</Tag>
        )}
        {isDraft && timeSinceCreation && (
          <Tag style={{ fontSize: 11 }}>Created {timeSinceCreation}</Tag>
        )}
      </div>
    </Card>
  )
}
