import { Row, Col, Card, Typography, theme, Table } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { Link } from 'react-router-dom'
import { useSiteSettingsOverview } from '../hooks/useSiteSettingsOverview.jsx'

const { Text } = Typography

export default function SiteSettingsOverviewTab({
  current,
  approvals = [],
  services = [],
  dependencies = null,
  servicesLoading = false,
  recentLogs = [],
  recentLoading = false,
  setTabKey,
}) {
  const { token } = theme.useToken()
  const { cardGroups, recentColumns, recentActivitySource, onRowClick, isAuditLog, CARD_COLORS } = useSiteSettingsOverview({
    current,
    approvals,
    services,
    dependencies,
    servicesLoading,
    recentLogs,
  })

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
        {cardGroups.map((group) => (
          <div key={group.title}>
            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15, color: token.colorText }}>
              {group.title}
            </Text>
            <Row gutter={[16, 16]} align="stretch">
              {group.cards.map(({ key, label, value, icon: Icon, status, sub }) => (
                <Col xs={24} sm={12} md={8} lg={6} key={key}>
                  <Card size="small" style={{ height: '100%' }}>
                    {key === 'loading' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LottieSpinner size="small" />
                        <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: token.borderRadius,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background:
                                status === 'up'
                                  ? token.colorSuccess
                                  : status === 'degraded'
                                    ? token.colorWarning
                                    : status === 'down'
                                      ? token.colorError
                                      : CARD_COLORS[key] || token.colorPrimary,
                              color: '#fff',
                            }}
                          >
                            {Icon && <Icon style={{ fontSize: 18 }} />}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>{value ?? '—'}</span>
                        </div>
                        {sub && (
                          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                            {sub}
                          </Text>
                        )}
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15, color: token.colorText }}>
              Recent activity
            </Text>
            {recentActivitySource.length > 0 && isAuditLog(recentActivitySource[0]) ? (
              <Link to="/admin/users?tab=logs">View all logs</Link>
            ) : (
              <span
                role="button"
                tabIndex={0}
                onClick={() => setTabKey('requests')}
                onKeyDown={(e) => e.key === 'Enter' && setTabKey('requests')}
                style={{ color: token.colorPrimary, cursor: 'pointer' }}
              >
                View all requests
              </span>
            )}
          </div>
          <Card size="small">
            <Table
              size="small"
              dataSource={recentActivitySource}
              rowKey={(r) => r.approvalId || r.id || r._id || Math.random()}
              loading={recentLoading && recentLogs.length === 0}
              pagination={false}
              onRow={(record) => ({
                onClick: () => onRowClick(record, setTabKey),
                style: { cursor: 'pointer' },
              })}
              columns={recentColumns}
              locale={{ emptyText: 'No recent activity' }}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
