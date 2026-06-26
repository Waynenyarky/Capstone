import { Typography, Card, Divider, Grid, theme } from 'antd'

const { Text } = Typography
const { useBreakpoint } = Grid

export default function HelpRequestInfoCard({ detail, statusLockInfo, formatDateTime }) {
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  return (
    <Card
      size="small"
      style={{
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        background: token.colorBgContainer,
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column' }
      }}
    >
      {/* Left Panel - Icon and Title */}
      <div style={{ flex: screens.md ? '0 0 50%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: screens.md ? '20px 16px' : '96px 24px 16px' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Subject</Text>
          <Typography.Title level={5} style={{ margin: 0 }}>{detail.subject}</Typography.Title>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Message</Text>
          <Text style={{ marginTop: 4, display: 'block' }}>
            {detail.message}
          </Text>
        </div>
      </div>

      {/* Right Panel - Details Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorder}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorder}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
            <div><Text strong>{detail.requestId}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Contact Email</Text>
            <div><Text strong>{detail.contactEmail}</Text></div>
          </div>
          {detail.businessPermitNumber && (
            <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Business Permit Number</Text>
              <div><Text strong>{detail.businessPermitNumber}</Text></div>
            </div>
          )}
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Submitted On</Text>
            <div><Text strong>{formatDateTime(detail.createdAt)}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Last Updated</Text>
            <div><Text strong>{formatDateTime(detail.updatedAt)}</Text></div>
          </div>
          <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Claimed By</Text>
            <div><Text strong>{detail.claimedByName || 'Not claimed'}</Text></div>
          </div>
          {statusLockInfo && (
            <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Status Lock</Text>
              <div><Text strong>{statusLockInfo.message}</Text></div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
