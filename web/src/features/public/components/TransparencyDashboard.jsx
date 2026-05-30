import { Typography, Grid, theme, Card } from 'antd'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function TransparencyDashboard({ publicStats }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()

  return (
    <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '20px 24px' : '14px 12px',
          background: token.colorBgLayout,
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ marginTop: 0, marginBottom: 8, textAlign: screens.md ? 'left' : 'center' }}>
          Transparency Dashboard
        </Title>
        <div style={{ display: 'flex', gap: 12, justifyContent: screens.md ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
          <Card size="small" style={{ minWidth: 200 }}>
            <Text type="secondary" style={{ display: 'block' }}>Total registered businesses this year</Text>
            <Text strong style={{ fontSize: 20 }}>{publicStats?.totalRegisteredThisYear ?? '—'}</Text>
          </Card>
          <Card size="small" style={{ minWidth: 200 }}>
            <Text type="secondary" style={{ display: 'block' }}>Applications processed this year</Text>
            <Text strong style={{ fontSize: 20 }}>{publicStats?.applicationsProcessedThisYear ?? '—'}</Text>
          </Card>
          <Card size="small" style={{ minWidth: 200 }}>
            <Text type="secondary" style={{ display: 'block' }}>Pending applications</Text>
            <Text strong style={{ fontSize: 20 }}>{publicStats?.pendingApplications ?? '—'}</Text>
          </Card>
        </div>
      </div>
    </section>
  )
}
