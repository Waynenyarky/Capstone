/**
 * View Page: LGUManagerDashboard
 * Main dashboard page for LGU Manager
 * Provides comprehensive overview of all key metrics and activities
 */
import React, { useMemo } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Spin, 
  theme, 
  Space, 
  Statistic,
  Button,
  Alert,
  Badge,
  Tag,
  Divider,
  Timeline,
  List,
  Empty
} from 'antd'
import { 
  BarChartOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  SolutionOutlined,
  AuditOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  TeamOutlined,
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { useLGUManagerDashboard } from '../presentation/hooks/useLGUManagerDashboard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Paragraph, Text } = Typography

// Default empty shape so the UI never crashes on missing data
const EMPTY_METRICS = {
  permits: { total: 0, pending: 0, approved: 0, rejected: 0, overdue: 0 },
  violations: { total: 0, pending: 0, resolved: 0, overdue: 0 },
  inspections: { scheduled: 0, completed: 0, missed: 0, compliance: 0 },
  appeals: { total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, overdue: 0, slaCompliance: 0 },
  cessations: { total: 0, active: 0, resolved: 0, pending: 0, compliance: 0 },
  department: { totalOfficers: 0, activeOfficers: 0, totalWorkload: 0, avgWorkloadPerOfficer: 0 },
  trends: {
    permits: { current: 0, previous: 0, change: 0 },
    violations: { current: 0, previous: 0, change: 0 },
    appeals: { current: 0, previous: 0, change: 0 },
    cessations: { current: 0, previous: 0, change: 0 },
  },
}

function formatTrend(change) {
  if (change == null || change === 0) return null
  return `${change > 0 ? '+' : ''}${change}%`
}

export default function LGUManagerDashboard() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { loading, dashboardData } = useLGUManagerDashboard()

  // Derive all display data from the API response with safe fallbacks
  const metrics = useMemo(() => {
    if (!dashboardData) return EMPTY_METRICS
    return {
      permits: { ...EMPTY_METRICS.permits, ...dashboardData.permits },
      violations: { ...EMPTY_METRICS.violations, ...dashboardData.violations },
      inspections: { ...EMPTY_METRICS.inspections, ...dashboardData.inspections },
      appeals: { ...EMPTY_METRICS.appeals, ...dashboardData.appeals },
      cessations: { ...EMPTY_METRICS.cessations, ...dashboardData.cessations },
      department: { ...EMPTY_METRICS.department, ...dashboardData.department },
      trends: {
        permits: { ...EMPTY_METRICS.trends.permits, ...dashboardData.trends?.permits },
        violations: { ...EMPTY_METRICS.trends.violations, ...dashboardData.trends?.violations },
        appeals: { ...EMPTY_METRICS.trends.appeals, ...dashboardData.trends?.appeals },
        cessations: { ...EMPTY_METRICS.trends.cessations, ...dashboardData.trends?.cessations },
      },
    }
  }, [dashboardData])

  const recentActivity = useMemo(() => {
    return Array.isArray(dashboardData?.recentActivity) ? dashboardData.recentActivity : []
  }, [dashboardData])

  const upcomingDeadlines = useMemo(() => {
    return Array.isArray(dashboardData?.upcomingDeadlines) ? dashboardData.upcomingDeadlines : []
  }, [dashboardData])

  // Build critical alerts from real data
  const criticalAlerts = useMemo(() => {
    const alerts = []
    if (metrics.appeals.overdue > 0) {
      alerts.push({
        type: 'error',
        message: `${metrics.appeals.overdue} Appeal(s) Exceeding SLA`,
        description: 'Immediate review required for overdue appeals',
        action: '/lgu-manager/appeals',
      })
    }
    if (metrics.inspections.missed > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.inspections.missed} Overdue Inspection(s)`,
        description: 'Follow-up inspections are past due',
        action: '/lgu-manager/violations-inspections',
      })
    }
    if (metrics.permits.overdue > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.permits.overdue} Permit Application(s) Overdue`,
        description: 'Permit applications require immediate attention',
        action: '/lgu-manager/permit-applications',
      })
    }
    return alerts
  }, [metrics])

  const quickActions = useMemo(() => [
    {
      title: 'Permit Applications',
      icon: <FileTextOutlined />,
      path: '/lgu-manager/permit-applications',
      color: token.colorPrimary,
      count: metrics.permits.pending,
      label: 'Pending Review',
    },
    {
      title: 'Violations / Inspections',
      icon: <SolutionOutlined />,
      path: '/lgu-manager/violations-inspections',
      color: token.colorWarning,
      count: metrics.violations.pending,
      label: 'Pending Actions',
    },
    {
      title: 'Appeals',
      icon: <AuditOutlined />,
      path: '/lgu-manager/appeals',
      color: token.colorInfo,
      count: metrics.appeals.pending,
      label: 'Pending Review',
    },
    {
      title: 'Cessation Orders',
      icon: <StopOutlined />,
      path: '/lgu-manager/cessation',
      color: token.colorError,
      count: metrics.cessations.active,
      label: 'Active Orders',
    },
  ], [metrics, token])

  // Compute an overall SLA from available data
  const overallSla = useMemo(() => {
    const vals = [metrics.appeals.slaCompliance, metrics.inspections.compliance, metrics.cessations.compliance].filter(v => v > 0)
    if (vals.length === 0) return 0
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }, [metrics])

  return (
    <LGUManagerLayout pageTitle="LGU Manager Dashboard">
      <div style={{ paddingBottom: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
              LGU Manager Dashboard
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
              Comprehensive overview of permits, violations, inspections, appeals, and cessations
            </Paragraph>
          </Space>
        </div>

        {loading && !dashboardData ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              Loading dashboard data...
            </Paragraph>
          </div>
        ) : (
          <>
            {/* Critical Alerts Section */}
            {criticalAlerts.length > 0 && (
              <Card 
                style={{ 
                  marginBottom: 24,
                  border: `1px solid ${token.colorError}30`,
                  background: `linear-gradient(135deg, ${token.colorError}08 0%, ${token.colorBgContainer} 100%)`
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Space align="center">
                    <ExclamationCircleOutlined style={{ fontSize: 20, color: token.colorError }} />
                    <Title level={4} style={{ margin: 0 }}>Critical Alerts Requiring Attention</Title>
                  </Space>
                  <Row gutter={[16, 16]}>
                    {criticalAlerts.map((alert, index) => (
                      <Col xs={24} md={8} key={index}>
                        <Alert
                          type={alert.type}
                          message={
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Text strong>{alert.message}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {alert.description}
                              </Text>
                            </Space>
                          }
                          action={
                            <Button 
                              type="link" 
                              size="small"
                              icon={<ArrowRightOutlined />}
                              onClick={() => navigate(alert.action)}
                            >
                              View
                            </Button>
                          }
                          showIcon
                        />
                      </Col>
                    ))}
                  </Row>
                </Space>
              </Card>
            )}

            {/* Key Performance Indicators */}
            <Card 
              title={
                <Space>
                  <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                  <Title level={4} style={{ margin: 0 }}>Key Performance Indicators</Title>
                </Space>
              }
              style={{ 
                marginBottom: 24,
                boxShadow: token.boxShadowSecondary
              }}
              headStyle={{
                background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                borderBottom: `2px solid ${token.colorPrimary}30`
              }}
            >
              <Row gutter={[16, 16]}>
                {/* Permit Metrics */}
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    hoverable
                    style={{ 
                      height: '100%',
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadiusLG
                    }}
                    onClick={() => navigate('/lgu-manager/permit-applications')}
                  >
                    <Statistic
                      title={
                        <Space>
                          <FileTextOutlined style={{ color: token.colorPrimary }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Total Permits
                          </Text>
                        </Space>
                      }
                      value={metrics.permits.total}
                      suffix={formatTrend(metrics.trends.permits.change) ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {metrics.trends.permits.change > 0
                            ? <RiseOutlined style={{ color: token.colorSuccess, marginRight: 4 }} />
                            : <FallOutlined style={{ color: token.colorError, marginRight: 4 }} />}
                          {formatTrend(metrics.trends.permits.change)}
                        </Text>
                      ) : null}
                      valueStyle={{ fontSize: 24, fontWeight: 600 }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Pending: <Text strong>{metrics.permits.pending}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Approved: <Text strong style={{ color: token.colorSuccess }}>{metrics.permits.approved}</Text>
                      </Text>
                    </Space>
                  </Card>
                </Col>

                {/* Violation Metrics */}
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    hoverable
                    style={{ 
                      height: '100%',
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadiusLG
                    }}
                    onClick={() => navigate('/lgu-manager/violations-inspections')}
                  >
                    <Statistic
                      title={
                        <Space>
                          <SolutionOutlined style={{ color: token.colorWarning }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Total Violations
                          </Text>
                        </Space>
                      }
                      value={metrics.violations.total}
                      suffix={formatTrend(metrics.trends.violations.change) ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {metrics.trends.violations.change < 0
                            ? <FallOutlined style={{ color: token.colorSuccess, marginRight: 4 }} />
                            : <RiseOutlined style={{ color: token.colorError, marginRight: 4 }} />}
                          {formatTrend(metrics.trends.violations.change)}
                        </Text>
                      ) : null}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorWarning }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Pending: <Text strong>{metrics.violations.pending}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Resolved: <Text strong style={{ color: token.colorSuccess }}>{metrics.violations.resolved}</Text>
                      </Text>
                    </Space>
                  </Card>
                </Col>

                {/* Appeal Metrics */}
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    hoverable
                    style={{ 
                      height: '100%',
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadiusLG
                    }}
                    onClick={() => navigate('/lgu-manager/appeals')}
                  >
                    <Statistic
                      title={
                        <Space>
                          <AuditOutlined style={{ color: token.colorInfo }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Total Appeals
                          </Text>
                        </Space>
                      }
                      value={metrics.appeals.total}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorInfo }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Pending: <Text strong>{metrics.appeals.pending}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        SLA Compliance: <Text strong style={{ color: token.colorSuccess }}>{metrics.appeals.slaCompliance}%</Text>
                      </Text>
                    </Space>
                  </Card>
                </Col>

                {/* Cessation Metrics */}
                <Col xs={24} sm={12} md={6}>
                  <Card 
                    hoverable
                    style={{ 
                      height: '100%',
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadiusLG
                    }}
                    onClick={() => navigate('/lgu-manager/cessation')}
                  >
                    <Statistic
                      title={
                        <Space>
                          <StopOutlined style={{ color: token.colorError }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Cessation Orders
                          </Text>
                        </Space>
                      }
                      value={metrics.cessations.total}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorError }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Active: <Text strong>{metrics.cessations.active}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Compliance: <Text strong style={{ color: token.colorSuccess }}>{metrics.cessations.compliance}%</Text>
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Quick Actions & Overview Cards */}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Card 
                  title={
                    <Space>
                      <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>Quick Actions & Overview</Title>
                    </Space>
                  }
                  style={{ 
                    marginBottom: 24,
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorSuccess}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorSuccess}30`
                  }}
                >
                  <Row gutter={[16, 16]}>
                    {quickActions.map((action, index) => (
                      <Col xs={24} sm={12} key={index}>
                        <Card
                          hoverable
                          style={{
                            height: '100%',
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: token.borderRadiusLG,
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(action.path)}
                        >
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Space>
                                <div style={{ 
                                  fontSize: 32, 
                                  color: action.color,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  {action.icon}
                                </div>
                                <Text strong style={{ fontSize: 16 }}>
                                  {action.title}
                                </Text>
                              </Space>
                              <ArrowRightOutlined style={{ color: token.colorTextSecondary }} />
                            </Space>
                            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {action.label}
                              </Text>
                              <Badge 
                                count={action.count} 
                                style={{ backgroundColor: action.color }}
                                overflowCount={99}
                              />
                            </Space>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* Inspection & Compliance Summary */}
                <Card 
                  title={
                    <Space>
                      <SafetyCertificateOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>Inspection & Compliance Summary</Title>
                    </Space>
                  }
                  style={{ 
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorPrimary}30`
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title={
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Scheduled Inspections
                          </Text>
                        }
                        value={metrics.inspections.scheduled}
                        prefix={<ClockCircleOutlined style={{ color: token.colorPrimary }} />}
                        valueStyle={{ fontSize: 20, fontWeight: 600 }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title={
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Completed Inspections
                          </Text>
                        }
                        value={metrics.inspections.completed}
                        prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                        valueStyle={{ fontSize: 20, fontWeight: 600, color: token.colorSuccess }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title={
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Compliance Rate
                          </Text>
                        }
                        value={metrics.inspections.compliance}
                        suffix="%"
                        prefix={<SafetyCertificateOutlined style={{ color: token.colorSuccess }} />}
                        valueStyle={{ fontSize: 20, fontWeight: 600, color: token.colorSuccess }}
                      />
                    </Col>
                  </Row>
                  {metrics.inspections.missed > 0 && (
                    <Alert
                      message={
                        <Space>
                          <WarningOutlined />
                          <Text strong>{metrics.inspections.missed} Missed Inspections</Text>
                        </Space>
                      }
                      description="Some scheduled inspections were not completed on time"
                      type="warning"
                      style={{ marginTop: 16 }}
                      action={
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => navigate('/lgu-manager/violations-inspections')}
                        >
                          Review
                        </Button>
                      }
                    />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                {/* System Health & Status */}
                <Card 
                  title={
                    <Space>
                      <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>System Health</Title>
                    </Space>
                  }
                  style={{ 
                    marginBottom: 24,
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorSuccess}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorSuccess}30`
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Overall SLA Compliance</Text>
                        <Tag color={overallSla >= 85 ? 'success' : overallSla >= 70 ? 'warning' : 'error'}>{overallSla}%</Tag>
                      </Space>
                      <div style={{ 
                        height: 8, 
                        background: token.colorBgContainer, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${Math.min(overallSla, 100)}%`, 
                          background: overallSla >= 85 ? token.colorSuccess : overallSla >= 70 ? token.colorWarning : token.colorError,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Appeal Processing</Text>
                        <Tag color={metrics.appeals.slaCompliance >= 85 ? 'success' : 'warning'}>
                          {metrics.appeals.slaCompliance}%
                        </Tag>
                      </Space>
                      <div style={{ 
                        height: 8, 
                        background: token.colorBgContainer, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${Math.min(metrics.appeals.slaCompliance, 100)}%`, 
                          background: metrics.appeals.slaCompliance >= 85 ? token.colorSuccess : token.colorWarning,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Inspection Compliance</Text>
                        <Tag color={metrics.inspections.compliance >= 85 ? 'success' : 'warning'}>{metrics.inspections.compliance}%</Tag>
                      </Space>
                      <div style={{ 
                        height: 8, 
                        background: token.colorBgContainer, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${Math.min(metrics.inspections.compliance, 100)}%`, 
                          background: metrics.inspections.compliance >= 85 ? token.colorSuccess : token.colorWarning,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  </Space>
                </Card>

                {/* Reports & Analytics Quick Access */}
                <Card 
                  title={
                    <Space>
                      <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>Reports & Analytics</Title>
                    </Space>
                  }
                  style={{ 
                    marginBottom: 24,
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorPrimary}30`
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<BarChartOutlined />}
                      onClick={() => navigate('/lgu-manager/reports')}
                    >
                      View Reports & Analytics
                    </Button>
                    <Paragraph type="secondary" style={{ fontSize: 12, margin: 0, textAlign: 'center' }}>
                      Access comprehensive reports, analytics, and data visualizations
                    </Paragraph>
                  </Space>
                </Card>

                {/* Department Summary */}
                <Card 
                  title={
                    <Space>
                      <TeamOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>Department Summary</Title>
                    </Space>
                  }
                  style={{ 
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorPrimary}30`
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={[16, 16]}>
                      <Col xs={24}>
                        <Statistic
                          title={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Active Officers
                            </Text>
                          }
                          value={metrics.department.activeOfficers}
                          suffix={metrics.department.totalOfficers ? `/ ${metrics.department.totalOfficers}` : undefined}
                          prefix={<UserOutlined style={{ color: token.colorPrimary }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 600 }}
                        />
                      </Col>
                      <Col xs={24}>
                        <Statistic
                          title={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Total Workload
                            </Text>
                          }
                          value={metrics.department.totalWorkload}
                          prefix={<FileTextOutlined style={{ color: token.colorInfo }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 600 }}
                        />
                      </Col>
                      <Col xs={24}>
                        <Statistic
                          title={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Avg Workload per Officer
                            </Text>
                          }
                          value={metrics.department.avgWorkloadPerOfficer}
                          suffix="cases"
                          prefix={<TeamOutlined style={{ color: token.colorWarning }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 600 }}
                        />
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity & Upcoming Deadlines */}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <HistoryOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>Recent Activity</Title>
                    </Space>
                  }
                  style={{ 
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorPrimary}30`
                  }}
                  extra={
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate('/lgu-manager/reports')}
                    >
                      View All
                    </Button>
                  }
                >
                  {recentActivity.length > 0 ? (
                    <Timeline
                      items={recentActivity.map((activity) => {
                        const iconMap = {
                          permit: <FileTextOutlined style={{ color: token.colorPrimary }} />,
                          violation: <SolutionOutlined style={{ color: token.colorWarning }} />,
                          appeal: <AuditOutlined style={{ color: token.colorInfo }} />,
                          inspection: <SafetyCertificateOutlined style={{ color: token.colorSuccess }} />,
                          cessation: <StopOutlined style={{ color: token.colorError }} />,
                        }
                        const colorMap = {
                          pending: 'blue',
                          active: 'orange',
                          under_review: 'purple',
                          completed: 'green',
                        }
                        const ts = activity.timestamp || activity.createdAt
                        const timeLabel = ts ? dayjs(ts).fromNow() : ''
                        return {
                          dot: iconMap[activity.type],
                          color: colorMap[activity.status] || 'default',
                          children: (
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Text strong style={{ fontSize: 13 }}>{activity.action}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{timeLabel}</Text>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>{activity.details}</Text>
                              {activity.link && (
                                <Button 
                                  type="link" 
                                  size="small" 
                                  icon={<ArrowRightOutlined />}
                                  onClick={() => navigate(activity.link)}
                                  style={{ padding: 0, height: 'auto' }}
                                >
                                  View Details
                                </Button>
                              )}
                            </Space>
                          ),
                        }
                      })}
                    />
                  ) : (
                    <Empty description="No recent activity" />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <Space>
                      <CalendarOutlined style={{ color: token.colorWarning, fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>Upcoming Deadlines</Title>
                    </Space>
                  }
                  style={{ 
                    boxShadow: token.boxShadowSecondary
                  }}
                  headStyle={{
                    background: `linear-gradient(135deg, ${token.colorWarning}10 0%, transparent 100%)`,
                    borderBottom: `2px solid ${token.colorWarning}30`
                  }}
                  extra={
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate('/lgu-manager/reports')}
                    >
                      View All
                    </Button>
                  }
                >
                  {upcomingDeadlines.length > 0 ? (
                    <List
                      dataSource={upcomingDeadlines}
                      renderItem={(deadline) => {
                        const priorityColor = {
                          high: token.colorError,
                          medium: token.colorWarning,
                          low: token.colorInfo,
                        }
                        const iconMap = {
                          appeal: <AuditOutlined />,
                          inspection: <SafetyCertificateOutlined />,
                          permit: <FileTextOutlined />,
                        }
                        const dueLabel = deadline.dueDate
                          ? (typeof deadline.dueDate === 'string' ? deadline.dueDate : dayjs(deadline.dueDate).format('MMM D, h:mm A'))
                          : ''
                        return (
                          <List.Item
                            style={{ 
                              borderLeft: `3px solid ${priorityColor[deadline.priority] || token.colorBorderSecondary}`,
                              paddingLeft: 16,
                              marginBottom: 12,
                              borderRadius: 4
                            }}
                          >
                            <List.Item.Meta
                              avatar={iconMap[deadline.type]}
                              title={
                                <Space align="center">
                                  <Text strong style={{ fontSize: 13 }}>{deadline.title}</Text>
                                  <Tag color={deadline.priority === 'high' ? 'error' : deadline.priority === 'medium' ? 'warning' : 'default'}>
                                    {deadline.priority}
                                  </Tag>
                                </Space>
                              }
                              description={
                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{deadline.description}</Text>
                                  <Space align="center">
                                    <ClockCircleOutlined style={{ fontSize: 11, color: token.colorTextSecondary }} />
                                    <Text type="secondary" style={{ fontSize: 11 }}>{dueLabel}</Text>
                                  </Space>
                                  {deadline.link && (
                                    <Button 
                                      type="link" 
                                      size="small" 
                                      icon={<ArrowRightOutlined />}
                                      onClick={() => navigate(deadline.link)}
                                      style={{ padding: 0, height: 'auto', marginTop: 4 }}
                                    >
                                      View Details
                                    </Button>
                                  )}
                                </Space>
                              }
                            />
                          </List.Item>
                        )
                      }}
                    />
                  ) : (
                    <Empty description="No upcoming deadlines" />
                  )}
                </Card>
              </Col>
            </Row>

            {/* Performance Trends */}
            <Card 
              title={
                <Space>
                  <RiseOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                  <Title level={4} style={{ margin: 0 }}>Performance Trends (Month-over-Month)</Title>
                </Space>
              }
              style={{ 
                marginTop: 24,
                boxShadow: token.boxShadowSecondary
              }}
              headStyle={{
                background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                borderBottom: `2px solid ${token.colorPrimary}30`
              }}
            >
              <Row gutter={[16, 16]}>
                {[
                  { key: 'permits', label: 'Permits Trend', positiveIsGood: true },
                  { key: 'violations', label: 'Violations Trend', positiveIsGood: false },
                  { key: 'appeals', label: 'Appeals Trend', positiveIsGood: false },
                  { key: 'cessations', label: 'Cessations Trend', positiveIsGood: false },
                ].map(({ key, label, positiveIsGood }) => {
                  const trend = metrics.trends[key]
                  const isGood = positiveIsGood ? trend.change > 0 : trend.change < 0
                  return (
                    <Col xs={24} sm={12} md={6} key={key}>
                      <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                        <Statistic
                          title={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {label}
                            </Text>
                          }
                          value={trend.current}
                          suffix={trend.change !== 0 ? (
                            <Space>
                              {trend.previous > 0 && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  ({trend.previous})
                                </Text>
                              )}
                              <Tag color={isGood ? 'success' : trend.change === 0 ? 'default' : 'default'}>
                                {trend.change > 0 ? <RiseOutlined /> : <FallOutlined />}
                                {Math.abs(trend.change)}%
                              </Tag>
                            </Space>
                          ) : null}
                          valueStyle={{ fontSize: 18, fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            </Card>
          </>
        )}
      </div>
    </LGUManagerLayout>
  )
}
