/**
 * View Page: LGUManagerDashboard
 * Main dashboard page for LGU Manager
 * Provides comprehensive overview of all key metrics and activities
 */
import React from 'react'
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
  BellOutlined,
  CalendarOutlined,
  TeamOutlined,
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { useLGUManagerDashboard } from '../../presentation/hooks/useLGUManagerDashboard'

const { Title, Paragraph, Text } = Typography

export default function LGUManagerDashboard() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { loading, dashboardData } = useLGUManagerDashboard()

  // Mock data - replace with actual data from hooks/API
  const dashboardMetrics = {
    permits: {
      total: 1247,
      pending: 89,
      approved: 1089,
      rejected: 69,
      overdue: 12,
      trend: '+5.2%'
    },
    violations: {
      total: 342,
      pending: 87,
      resolved: 255,
      overdue: 14,
      trend: '-2.1%'
    },
    inspections: {
      scheduled: 156,
      completed: 142,
      missed: 14,
      compliance: 91.0
    },
    appeals: {
      total: 128,
      pending: 45,
      underReview: 32,
      approved: 38,
      rejected: 13,
      overdue: 8,
      slaCompliance: 87.5
    },
    cessations: {
      total: 67,
      active: 23,
      resolved: 44,
      pending: 8,
      compliance: 85.2
    },
    alerts: {
      critical: 3,
      warnings: 12,
      info: 5
    },
    trends: {
      permits: { current: 1247, previous: 1185, change: 5.2 },
      violations: { current: 342, previous: 349, change: -2.1 },
      appeals: { current: 128, previous: 142, change: -9.9 },
      cessations: { current: 67, previous: 71, change: -5.6 }
    },
    department: {
      totalOfficers: 24,
      activeOfficers: 22,
      totalWorkload: 1893,
      avgWorkloadPerOfficer: 78.9
    }
  }

  // Recent Activity Data
  const recentActivity = [
    {
      id: 1,
      type: 'permit',
      action: 'New permit application submitted',
      details: 'PER-2024-001234 - Business Registration',
      timestamp: '2 hours ago',
      status: 'pending',
      link: '/lgu-manager/permit-applications'
    },
    {
      id: 2,
      type: 'violation',
      action: 'Violation issued',
      details: 'VIOL-2024-000567 - Health & Safety',
      timestamp: '4 hours ago',
      status: 'active',
      link: '/lgu-manager/violations-inspections'
    },
    {
      id: 3,
      type: 'appeal',
      action: 'Appeal filed',
      details: 'APPEAL-2024-000123 - Permit rejection',
      timestamp: '6 hours ago',
      status: 'under_review',
      link: '/lgu-manager/appeals'
    },
    {
      id: 4,
      type: 'inspection',
      action: 'Inspection completed',
      details: 'INSP-2024-000890 - Building Code Compliance',
      timestamp: '8 hours ago',
      status: 'completed',
      link: '/lgu-manager/violations-inspections'
    },
    {
      id: 5,
      type: 'cessation',
      action: 'Cessation order issued',
      details: 'CESS-2024-000456 - Environmental violation',
      timestamp: '12 hours ago',
      status: 'active',
      link: '/lgu-manager/cessation'
    }
  ]

  // Upcoming Deadlines
  const upcomingDeadlines = [
    {
      id: 1,
      type: 'appeal',
      title: 'Appeal Review Due',
      description: 'APPEAL-2024-000098 - Decision deadline',
      dueDate: 'Today, 5:00 PM',
      priority: 'high',
      link: '/lgu-manager/appeals'
    },
    {
      id: 2,
      type: 'inspection',
      title: 'Scheduled Inspection',
      description: 'INSP-2024-000901 - Fire Safety',
      dueDate: 'Tomorrow, 9:00 AM',
      priority: 'medium',
      link: '/lgu-manager/violations-inspections'
    },
    {
      id: 3,
      type: 'permit',
      title: 'Permit Review Due',
      description: 'PER-2024-001189 - Business Registration',
      dueDate: 'Tomorrow, 2:00 PM',
      priority: 'medium',
      link: '/lgu-manager/permit-applications'
    },
    {
      id: 4,
      type: 'appeal',
      title: 'Appeal Review Due',
      description: 'APPEAL-2024-000105 - Violation appeal',
      dueDate: '2 days, 10:00 AM',
      priority: 'high',
      link: '/lgu-manager/appeals'
    }
  ]

  const quickActions = [
    {
      title: 'Permit Applications',
      icon: <FileTextOutlined />,
      path: '/lgu-manager/permit-applications',
      color: token.colorPrimary,
      count: dashboardMetrics.permits.pending,
      label: 'Pending Review'
    },
    {
      title: 'Violations / Inspections',
      icon: <SolutionOutlined />,
      path: '/lgu-manager/violations-inspections',
      color: token.colorWarning,
      count: dashboardMetrics.violations.pending,
      label: 'Pending Actions'
    },
    {
      title: 'Appeals',
      icon: <AuditOutlined />,
      path: '/lgu-manager/appeals',
      color: token.colorInfo,
      count: dashboardMetrics.appeals.pending,
      label: 'Pending Review'
    },
    {
      title: 'Cessation Orders',
      icon: <StopOutlined />,
      path: '/lgu-manager/cessation',
      color: token.colorError,
      count: dashboardMetrics.cessations.active,
      label: 'Active Orders'
    }
  ]

  const criticalAlerts = [
    {
      type: 'error',
      message: '8 Appeals Exceeding SLA',
      description: 'Immediate review required for overdue appeals',
      action: '/lgu-manager/appeals'
    },
    {
      type: 'warning',
      message: '14 Overdue Inspections',
      description: 'Follow-up inspections are past due',
      action: '/lgu-manager/violations-inspections'
    },
    {
      type: 'warning',
      message: '12 Permit Applications Overdue',
      description: 'Permit applications require immediate attention',
      action: '/lgu-manager/permit-applications'
    }
  ]

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
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                      borderRadius: 8
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
                      value={dashboardMetrics.permits.total}
                      suffix={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <RiseOutlined style={{ color: '#3f8600', marginRight: 4 }} />
                          {dashboardMetrics.permits.trend}
                        </Text>
                      }
                      valueStyle={{ fontSize: 24, fontWeight: 600 }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Pending: <Text strong>{dashboardMetrics.permits.pending}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Approved: <Text strong style={{ color: '#3f8600' }}>{dashboardMetrics.permits.approved}</Text>
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
                      borderRadius: 8
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
                      value={dashboardMetrics.violations.total}
                      suffix={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <FallOutlined style={{ color: '#cf1322', marginRight: 4 }} />
                          {dashboardMetrics.violations.trend}
                        </Text>
                      }
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorWarning }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Pending: <Text strong>{dashboardMetrics.violations.pending}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Resolved: <Text strong style={{ color: '#3f8600' }}>{dashboardMetrics.violations.resolved}</Text>
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
                      borderRadius: 8
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
                      value={dashboardMetrics.appeals.total}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorInfo }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Pending: <Text strong>{dashboardMetrics.appeals.pending}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        SLA Compliance: <Text strong style={{ color: '#3f8600' }}>{dashboardMetrics.appeals.slaCompliance}%</Text>
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
                      borderRadius: 8
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
                      value={dashboardMetrics.cessations.total}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: token.colorError }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Active: <Text strong>{dashboardMetrics.cessations.active}</Text>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Compliance: <Text strong style={{ color: '#3f8600' }}>{dashboardMetrics.cessations.compliance}%</Text>
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                            borderRadius: 8,
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                        value={dashboardMetrics.inspections.scheduled}
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
                        value={dashboardMetrics.inspections.completed}
                        prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
                        valueStyle={{ fontSize: 20, fontWeight: 600, color: '#3f8600' }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title={
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Compliance Rate
                          </Text>
                        }
                        value={dashboardMetrics.inspections.compliance}
                        suffix="%"
                        prefix={<SafetyCertificateOutlined style={{ color: '#3f8600' }} />}
                        valueStyle={{ fontSize: 20, fontWeight: 600, color: '#3f8600' }}
                      />
                    </Col>
                  </Row>
                  {dashboardMetrics.inspections.missed > 0 && (
                    <Alert
                      message={
                        <Space>
                          <WarningOutlined />
                          <Text strong>{dashboardMetrics.inspections.missed} Missed Inspections</Text>
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                        <Tag color="success">89.2%</Tag>
                      </Space>
                      <div style={{ 
                        height: 8, 
                        background: token.colorBgContainer, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: '89.2%', 
                          background: '#3f8600',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Appeal Processing</Text>
                        <Tag color={dashboardMetrics.appeals.slaCompliance >= 85 ? 'success' : 'warning'}>
                          {dashboardMetrics.appeals.slaCompliance}%
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
                          width: `${dashboardMetrics.appeals.slaCompliance}%`, 
                          background: dashboardMetrics.appeals.slaCompliance >= 85 ? '#3f8600' : token.colorWarning,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>Inspection Compliance</Text>
                        <Tag color="success">{dashboardMetrics.inspections.compliance}%</Tag>
                      </Space>
                      <div style={{ 
                        height: 8, 
                        background: token.colorBgContainer, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${dashboardMetrics.inspections.compliance}%`, 
                          background: '#3f8600',
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                          value={dashboardMetrics.department.activeOfficers}
                          suffix={`/ ${dashboardMetrics.department.totalOfficers}`}
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
                          value={dashboardMetrics.department.totalWorkload}
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
                          value={dashboardMetrics.department.avgWorkloadPerOfficer}
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                          inspection: <SafetyCertificateOutlined style={{ color: '#3f8600' }} />,
                          cessation: <StopOutlined style={{ color: token.colorError }} />
                        }
                        const colorMap = {
                          pending: 'blue',
                          active: 'orange',
                          under_review: 'purple',
                          completed: 'green'
                        }
                        return {
                          dot: iconMap[activity.type],
                          color: colorMap[activity.status] || 'default',
                          children: (
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Text strong style={{ fontSize: 13 }}>{activity.action}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{activity.timestamp}</Text>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>{activity.details}</Text>
                              <Button 
                                type="link" 
                                size="small" 
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate(activity.link)}
                                style={{ padding: 0, height: 'auto' }}
                              >
                                View Details
                              </Button>
                            </Space>
                          )
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
                          low: token.colorInfo
                        }
                        const iconMap = {
                          appeal: <AuditOutlined />,
                          inspection: <SafetyCertificateOutlined />,
                          permit: <FileTextOutlined />
                        }
                        return (
                          <List.Item
                            style={{ 
                              borderLeft: `3px solid ${priorityColor[deadline.priority]}`,
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
                                    <Text type="secondary" style={{ fontSize: 11 }}>{deadline.dueDate}</Text>
                                  </Space>
                                  <Button 
                                    type="link" 
                                    size="small" 
                                    icon={<ArrowRightOutlined />}
                                    onClick={() => navigate(deadline.link)}
                                    style={{ padding: 0, height: 'auto', marginTop: 4 }}
                                  >
                                    View Details
                                  </Button>
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              headStyle={{
                background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, transparent 100%)`,
                borderBottom: `2px solid ${token.colorPrimary}30`
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                    <Statistic
                      title={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Permits Trend
                        </Text>
                      }
                      value={dashboardMetrics.trends.permits.current}
                      suffix={
                        <Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({dashboardMetrics.trends.permits.previous})
                          </Text>
                          <Tag color={dashboardMetrics.trends.permits.change > 0 ? 'success' : 'default'}>
                            {dashboardMetrics.trends.permits.change > 0 ? <RiseOutlined /> : <FallOutlined />}
                            {Math.abs(dashboardMetrics.trends.permits.change)}%
                          </Tag>
                        </Space>
                      }
                      valueStyle={{ fontSize: 18, fontWeight: 600 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                    <Statistic
                      title={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Violations Trend
                        </Text>
                      }
                      value={dashboardMetrics.trends.violations.current}
                      suffix={
                        <Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({dashboardMetrics.trends.violations.previous})
                          </Text>
                          <Tag color={dashboardMetrics.trends.violations.change < 0 ? 'success' : 'default'}>
                            {dashboardMetrics.trends.violations.change < 0 ? <FallOutlined /> : <RiseOutlined />}
                            {Math.abs(dashboardMetrics.trends.violations.change)}%
                          </Tag>
                        </Space>
                      }
                      valueStyle={{ fontSize: 18, fontWeight: 600 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                    <Statistic
                      title={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Appeals Trend
                        </Text>
                      }
                      value={dashboardMetrics.trends.appeals.current}
                      suffix={
                        <Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({dashboardMetrics.trends.appeals.previous})
                          </Text>
                          <Tag color={dashboardMetrics.trends.appeals.change < 0 ? 'success' : 'default'}>
                            {dashboardMetrics.trends.appeals.change < 0 ? <FallOutlined /> : <RiseOutlined />}
                            {Math.abs(dashboardMetrics.trends.appeals.change)}%
                          </Tag>
                        </Space>
                      }
                      valueStyle={{ fontSize: 18, fontWeight: 600 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                    <Statistic
                      title={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Cessations Trend
                        </Text>
                      }
                      value={dashboardMetrics.trends.cessations.current}
                      suffix={
                        <Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({dashboardMetrics.trends.cessations.previous})
                          </Text>
                          <Tag color={dashboardMetrics.trends.cessations.change < 0 ? 'success' : 'default'}>
                            {dashboardMetrics.trends.cessations.change < 0 ? <FallOutlined /> : <RiseOutlined />}
                            {Math.abs(dashboardMetrics.trends.cessations.change)}%
                          </Tag>
                        </Space>
                      }
                      valueStyle={{ fontSize: 18, fontWeight: 600 }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </div>
    </LGUManagerLayout>
  )
}
