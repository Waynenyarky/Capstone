/**
 * View Page: LGUManagerDashboard
 * Main dashboard page for LGU Manager
 * Clean, functional layout matching Admin/Officer dashboard style
 */
import { useMemo } from 'react'
import { Row, Col, Card, Typography, theme, Space, Tag, List, Divider } from 'antd'
import {
  DashboardOutlined, FileTextOutlined, CheckCircleOutlined, WarningOutlined,
  SolutionOutlined, AuditOutlined, StopOutlined, ClockCircleOutlined,
  BarChartOutlined, SafetyCertificateOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { useLGUManagerDashboard } from '../presentation/hooks/useLGUManagerDashboard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Text } = Typography

// Sum values from a { key: count } status map
function sumStatus(obj) {
  if (!obj || typeof obj !== 'object') return 0
  return Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0)
}

const ACTION_COLORS = {
  create: 'green', update: 'blue', delete: 'red', approve: 'cyan',
  reject: 'orange', login: 'purple', profile_update: 'blue', other: 'default',
}

export default function LGUManagerDashboard() {
  const { token } = theme.useToken()
  const { loading, dashboardData } = useLGUManagerDashboard()

  // Map backend response (permitsByStatus, violationsByStatus, etc.) to display data
  const d = dashboardData || {}
  const permits = d.permitsByStatus || {}
  const violations = d.violationsByStatus || {}
  const inspections = d.inspectionsByStatus || {}
  const appeals = d.appealsByStatus || {}
  const cessations = d.cessationsByStatus || {}
  const overdueInspections = d.overdueInspections || 0
  const avgProcessingDays = d.averageProcessingTimeDays != null
    ? `${Math.round(d.averageProcessingTimeDays * 10) / 10}d`
    : '—'

  const recentActivity = useMemo(() => {
    return Array.isArray(d.recentActivity) ? d.recentActivity.slice(0, 8) : []
  }, [d])

  // Stat cards — matching Admin dashboard compact style
  const statCards = [
    { key: 'permits', label: 'Permit Applications', value: sumStatus(permits), icon: FileTextOutlined, color: token.colorPrimary, to: '/lgu-manager/permit-applications' },
    { key: 'pending', label: 'Pending Review', value: (permits.submitted || 0) + (permits.under_review || 0), icon: ClockCircleOutlined, color: '#fa8c16', to: '/lgu-manager/permit-applications' },
    { key: 'approved', label: 'Approved', value: permits.approved || 0, icon: CheckCircleOutlined, color: token.colorSuccess },
    { key: 'violations', label: 'Violations', value: sumStatus(violations), icon: WarningOutlined, color: token.colorWarning, to: '/lgu-manager/violations-inspections' },
    { key: 'inspections', label: 'Inspections', value: sumStatus(inspections), icon: SafetyCertificateOutlined, color: token.colorPrimary, to: '/lgu-manager/violations-inspections' },
    { key: 'overdue', label: 'Overdue Inspections', value: overdueInspections, icon: ExclamationCircleOutlined, color: token.colorError, to: '/lgu-manager/violations-inspections' },
    { key: 'appeals', label: 'Appeals', value: sumStatus(appeals), icon: AuditOutlined, color: '#1890ff', to: '/lgu-manager/appeals' },
    { key: 'cessations', label: 'Cessation Orders', value: sumStatus(cessations), icon: StopOutlined, color: token.colorError, to: '/lgu-manager/cessation' },
  ]

  // Quick links — matching LGU Officer dashboard style
  const quickLinks = [
    { title: 'Permit Applications', icon: <FileTextOutlined style={{ fontSize: 18, color: token.colorPrimary }} />, to: '/lgu-manager/permit-applications', desc: 'Review permit processing status' },
    { title: 'Violations / Inspections', icon: <SolutionOutlined style={{ fontSize: 18, color: token.colorWarning }} />, to: '/lgu-manager/violations-inspections', desc: 'Monitor violations and inspections' },
    { title: 'Assign Inspection', icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: token.colorPrimary }} />, to: '/lgu-manager/assign-inspection', desc: 'Assign inspectors to businesses' },
    { title: 'Appeals', icon: <AuditOutlined style={{ fontSize: 18, color: '#1890ff' }} />, to: '/lgu-manager/appeals', desc: 'Review appeal submissions' },
    { title: 'Cessation Orders', icon: <StopOutlined style={{ fontSize: 18, color: token.colorError }} />, to: '/lgu-manager/cessation', desc: 'Manage business closure orders' },
    { title: 'Reports & Analytics', icon: <BarChartOutlined style={{ fontSize: 18, color: token.colorPrimary }} />, to: '/lgu-manager/reports', desc: 'View reports and analytics' },
  ]

  const cols = { xs: 12, sm: 8, md: 6, lg: 6 }

  return (
    <LGUManagerLayout pageTitle="Dashboard" pageIcon={<DashboardOutlined />}>
      <div style={{ padding: 16 }}>
        {/* KPI Stat Cards */}
        <Row gutter={[16, 16]}>
          {statCards.map(({ key, label, value, icon: Icon, color, to }) => (
            <Col {...cols} key={key}>
              <Card size="small" loading={loading} style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: token.borderRadius,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, background: color, color: '#fff',
                    }}>
                      <Icon style={{ fontSize: 18 }} />
                    </span>
                    {to ? (
                      <Link to={to}><span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span></Link>
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}

          {/* Avg Processing Time */}
          <Col {...cols}>
            <Card size="small" loading={loading} style={{ height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Avg Processing Time</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: token.borderRadius,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, background: '#722ed1', color: '#fff',
                  }}>
                    <ClockCircleOutlined style={{ fontSize: 18 }} />
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{avgProcessingDays}</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginTop: 24, marginBottom: 16 }}>Quick Links</Divider>

        {/* Quick Links Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {quickLinks.map((link) => (
            <Col xs={24} sm={12} md={8} key={link.to}>
              <Link to={link.to} style={{ textDecoration: 'none' }}>
                <Card hoverable size="small" style={{ height: '100%' }}>
                  <Space direction="vertical" size={4}>
                    <Space>{link.icon}<Title level={5} style={{ margin: 0 }}>{link.title}</Title></Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>{link.desc}</Text>
                  </Space>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        {/* Recent Activity + Status Breakdown */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card size="small" title="Recent Activity" loading={loading && !dashboardData}>
              {recentActivity.length === 0 ? (
                <Text type="secondary">No recent activity.</Text>
              ) : (
                <List
                  size="small"
                  dataSource={recentActivity}
                  renderItem={(log) => (
                    <List.Item>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={ACTION_COLORS[log.eventType?.toLowerCase()] || ACTION_COLORS[log.metadata?.action?.toLowerCase()] || 'default'}>
                            {log.eventType || log.metadata?.action || '—'}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {log.role || '—'}
                          </Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {log.createdAt ? dayjs(log.createdAt).format('MMM D, h:mm A') : '—'}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title="Status Breakdown" loading={loading && !dashboardData}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Text strong style={{ fontSize: 13 }}>Permits</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(permits).map(([status, count]) => (
                    <Tag key={status}>{status}: {count}</Tag>
                  ))}
                  {Object.keys(permits).length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>}
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <Text strong style={{ fontSize: 13 }}>Violations</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(violations).map(([status, count]) => (
                    <Tag key={status}>{status}: {count}</Tag>
                  ))}
                  {Object.keys(violations).length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>}
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <Text strong style={{ fontSize: 13 }}>Appeals</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(appeals).map(([status, count]) => (
                    <Tag key={status}>{status}: {count}</Tag>
                  ))}
                  {Object.keys(appeals).length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>}
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <Text strong style={{ fontSize: 13 }}>Cessations</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(cessations).map(([status, count]) => (
                    <Tag key={status}>{status}: {count}</Tag>
                  ))}
                  {Object.keys(cessations).length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>}
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </LGUManagerLayout>
  )
}
