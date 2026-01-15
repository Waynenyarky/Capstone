/**
 * View Page: ViolationsInspectionsOverviewPage
 * Violations & Inspections Overview page for LGU Manager
 * Read-only oversight module for enforcement supervision
 */
import React, { useState } from 'react'
import { 
  Card, 
  Typography, 
  theme, 
  Space, 
  Alert, 
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Badge,
  Tabs,
  Timeline
} from 'antd'
import { 
  SolutionOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  FileTextOutlined,
  AuditOutlined
} from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

export default function ViolationsInspectionsOverviewPage() {
  const { token } = theme.useToken()
  
  const [timeRange, setTimeRange] = useState('month')
  const [violationStatus, setViolationStatus] = useState('all')
  const [inspectionStatus, setInspectionStatus] = useState('all')
  const [barangay, setBarangay] = useState('all')
  const [violationCategory, setViolationCategory] = useState('all')
  const [assignedOfficer, setAssignedOfficer] = useState('all')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [selectedRow, setSelectedRow] = useState(null)

  // Mock data - replace with actual data from hooks
  const kpiData = {
    totalViolations: 342,
    pendingViolations: 87,
    resolvedViolations: 255,
    scheduledInspections: 156,
    completedInspections: 142,
    overdueFollowups: 14
  }

  const violationsColumns = [
    { 
      title: 'Violation ID', 
      dataIndex: 'id', 
      key: 'id',
      sorter: true,
      render: (text) => <Text code>{text}</Text>
    },
    { 
      title: 'Business Identifier', 
      dataIndex: 'businessId', 
      key: 'businessId',
      sorter: true,
      render: (id) => <Text type="secondary">***{id?.slice(-4)}</Text>
    },
    { 
      title: 'Violation Category', 
      dataIndex: 'category', 
      key: 'category',
      sorter: true,
      render: (category) => {
        const colorMap = {
          'health_safety': 'red',
          'building_code': 'orange',
          'environmental': 'green',
          'zoning': 'blue'
        }
        return <Tag color={colorMap[category] || 'default'}>{category}</Tag>
      }
    },
    { 
      title: 'Inspection Date', 
      dataIndex: 'inspectionDate', 
      key: 'inspectionDate',
      sorter: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    { 
      title: 'Issuing Officer', 
      dataIndex: 'officer', 
      key: 'officer',
      sorter: true
    },
    { 
      title: 'Current Status', 
      dataIndex: 'status', 
      key: 'status',
      sorter: true,
      render: (status) => {
        const colorMap = {
          'pending': 'orange',
          'resolved': 'green',
          'under_appeal': 'yellow',
          'overdue': 'red'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    { 
      title: 'Resolution Time', 
      dataIndex: 'resolutionTime', 
      key: 'resolutionTime',
      sorter: true,
      render: (days) => days ? `${days} days` : 'N/A'
    },
    { 
      title: 'SLA Indicator', 
      dataIndex: 'slaStatus', 
      key: 'slaStatus',
      sorter: true,
      render: (status) => {
        const colorMap = {
          'within': 'green',
          'approaching': 'yellow',
          'breach': 'red'
        }
        return <Badge status={colorMap[status] || 'default'} text={status} />
      }
    },
  ]

  const handleExport = async () => {
    // Export functionality
    console.log('Exporting violations/inspections summary...')
  }

  return (
    <LGUManagerLayout pageTitle="Violations & Inspections - Overview">
      <div style={{ paddingBottom: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* 1. Page Header & Oversight Controls */}
        <Card 
          style={{ 
            marginBottom: 24,
            background: `linear-gradient(135deg, ${token.colorWarning}15 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={4}>
                <Space align="center">
                  <SolutionOutlined style={{ fontSize: 28, color: token.colorWarning }} />
                  <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
                    Violations & Inspections – Overview
                  </Title>
                </Space>
                <Space>
                  <Tag color="blue" icon={<SafetyCertificateOutlined />}>
                    LGU Manager
                  </Tag>
                  <Tag color="default">Read-Only</Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} lg={16}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      Date Range
                    </Text>
                    <Select
                      value={timeRange}
                      onChange={setTimeRange}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="day">Today</Option>
                      <Option value="week">This Week</Option>
                      <Option value="month">This Month</Option>
                      <Option value="custom">Custom Range</Option>
                    </Select>
                  </Space>
                </Col>
                {timeRange === 'custom' && (
                  <Col xs={24} sm={12} md={6}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                        Select Dates
                      </Text>
                      <RangePicker style={{ width: '100%' }} size="large" />
                    </Space>
                  </Col>
                )}
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      <FilterOutlined style={{ marginRight: 4 }} />
                      Violation Status
                    </Text>
                    <Select
                      value={violationStatus}
                      onChange={setViolationStatus}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Status</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="resolved">Resolved</Option>
                      <Option value="under_appeal">Under Appeal</Option>
                      <Option value="overdue">Overdue</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      Inspection Status
                    </Text>
                    <Select
                      value={inspectionStatus}
                      onChange={setInspectionStatus}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Status</Option>
                      <Option value="scheduled">Scheduled</Option>
                      <Option value="completed">Completed</Option>
                      <Option value="missed">Missed / Delayed</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      <DownloadOutlined style={{ marginRight: 4 }} />
                      Export Summary
                    </Text>
                    <Space style={{ width: '100%' }}>
                      <Select
                        value={exportFormat}
                        onChange={setExportFormat}
                        style={{ flex: 1 }}
                        size="large"
                      >
                        <Option value="pdf">PDF</Option>
                        <Option value="csv">CSV</Option>
                      </Select>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        size="large"
                      >
                        Export
                      </Button>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* 2. Executive Enforcement Summary (KPI Tiles) */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Executive Enforcement Summary</Title>
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
          <Paragraph type="secondary" style={{ marginBottom: 24, fontSize: 14 }}>
            Instant awareness of enforcement health and workload
          </Paragraph>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Total Violations Issued
                    </Text>
                  }
                  value={kpiData.totalViolations}
                  prefix={<WarningOutlined style={{ color: token.colorError }} />}
                  valueStyle={{ 
                    color: token.colorError,
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Pending Violations
                    </Text>
                  }
                  value={kpiData.pendingViolations}
                  prefix={<ClockCircleOutlined style={{ color: token.colorWarning }} />}
                  valueStyle={{ 
                    color: token.colorWarning,
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Resolved Violations
                    </Text>
                  }
                  value={kpiData.resolvedViolations}
                  prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
                  valueStyle={{ 
                    color: '#3f8600',
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Scheduled Inspections
                    </Text>
                  }
                  value={kpiData.scheduledInspections}
                  prefix={<CalendarOutlined style={{ color: token.colorPrimary }} />}
                  valueStyle={{ 
                    color: token.colorPrimary,
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Completed Inspections
                    </Text>
                  }
                  value={kpiData.completedInspections}
                  prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
                  valueStyle={{ 
                    color: '#3f8600',
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  border: `1px solid #cf1322`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Overdue Follow-ups
                    </Text>
                  }
                  value={kpiData.overdueFollowups}
                  prefix={<ExclamationCircleOutlined style={{ color: '#cf1322' }} />}
                  valueStyle={{ 
                    color: '#cf1322',
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 3. Violations & Inspections Trend Analysis */}
        <Card 
          title={
            <Space>
              <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Violations & Inspections Trend Analysis</Title>
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
            <Alert
              message="Key Questions Answered"
              description="Are violations increasing or decreasing? Are inspections keeping pace with schedules? Are specific violation types recurring?"
              type="info"
              icon={<BarChartOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Line Chart: Violations Issued Over Time</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">Chart visualization would appear here</Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Bar Chart: Inspections Completed vs Scheduled</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">Chart visualization would appear here</Text>
                  </div>
                </Card>
              </Col>
            </Row>
            <Card size="small" style={{ background: token.colorBgContainer }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Category Distribution: Violation Types</Text>
              <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                <Text type="secondary">Chart visualization would appear here</Text>
              </div>
            </Card>
          </Space>
        </Card>

        {/* 4. Status-Based Breakdown Panels */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Status-Based Breakdown</Title>
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
            <Alert
              message="Governance Rule"
              description="No issuing, editing, or resolution actions are available in this overview module."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Tabs defaultActiveKey="violations">
              <TabPane tab="Violation Status" key="violations">
                <Tabs defaultActiveKey="pending" size="small">
                  <TabPane 
                    tab={
                      <Badge count={kpiData.pendingViolations} size="small">
                        <span>Pending</span>
                      </Badge>
                    } 
                    key="pending"
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value={kpiData.pendingViolations} />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="5.2" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="25.4" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane 
                    tab={
                      <Badge count={kpiData.resolvedViolations} size="small">
                        <span>Resolved</span>
                      </Badge>
                    } 
                    key="resolved"
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value={kpiData.resolvedViolations} />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="12.5" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="74.6" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tab="Under Appeal" key="appeal">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value="18" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="28.3" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="5.3" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tab="Overdue / Non-Compliant" key="overdue">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value="12" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="45.8" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="3.5" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                </Tabs>
              </TabPane>
              <TabPane tab="Inspection Status" key="inspections">
                <Tabs defaultActiveKey="scheduled" size="small">
                  <TabPane 
                    tab={
                      <Badge count={kpiData.scheduledInspections} size="small">
                        <span>Scheduled</span>
                      </Badge>
                    } 
                    key="scheduled"
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value={kpiData.scheduledInspections} />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="2.1" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="52.0" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane 
                    tab={
                      <Badge count={kpiData.completedInspections} size="small">
                        <span>Completed</span>
                      </Badge>
                    } 
                    key="completed"
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value={kpiData.completedInspections} />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="1.8" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="47.3" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                  <TabPane tab="Missed / Delayed" key="missed">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <Statistic title="Count" value="14" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Average Time in Status" value="5.5" suffix="days" />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Percentage of Total" value="4.7" suffix="%" />
                      </Col>
                    </Row>
                  </TabPane>
                </Tabs>
              </TabPane>
            </Tabs>
          </Space>
        </Card>

        {/* 5. Compliance & SLA Monitoring Panel */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: token.colorWarning, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Compliance & SLA Monitoring</Title>
            </Space>
          }
          style={{ 
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          headStyle={{
            background: `linear-gradient(135deg, ${token.colorWarning}10 0%, transparent 100%)`,
            borderBottom: `2px solid ${token.colorWarning}30`
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Enforcement Accountability & Service Standards"
              description="Visual indicators: Green = within SLA, Yellow = approaching deadline, Red = SLA breach. Supports enforcement accountability and service standards."
              type="info"
              icon={<ClockCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Avg Violation Resolution Time
                      </Text>
                    }
                    value="12.5"
                    suffix="days"
                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Inspection SLA Compliance Rate
                      </Text>
                    }
                    value="91.0"
                    suffix="%"
                    valueStyle={{ color: '#3f8600', fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid #cf1322` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Overdue Inspections
                      </Text>
                    }
                    value={kpiData.overdueFollowups}
                    valueStyle={{ color: '#cf1322', fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Delayed Follow-ups
                      </Text>
                    }
                    value="8"
                    suffix="cases"
                    valueStyle={{ color: token.colorWarning, fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 6. Risk & Repeat Offender Indicators */}
        <Card 
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: token.colorError, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Risk & Repeat Offender Indicators</Title>
            </Space>
          }
          style={{ 
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          headStyle={{
            background: `linear-gradient(135deg, ${token.colorError}10 0%, transparent 100%)`,
            borderBottom: `2px solid ${token.colorError}30`
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Preventive Action & Policy Review"
              description="Safeguards: No individual business targeting. Grouped or masked identifiers. Supports preventive action and policy review."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Businesses with Repeated Violations (Anonymized)" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>Business Group A (Anonymized)</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>5 violations | 3 inspections</Text>
                    </div>
                    <div>
                      <Text strong>Business Group B (Anonymized)</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>4 violations | 2 inspections</Text>
                    </div>
                    <div>
                      <Text strong>Business Group C (Anonymized)</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>3 violations | 2 inspections</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="High-Risk Locations or Categories" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>Zone 5 - Health & Safety</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>18 violations | High risk</Text>
                    </div>
                    <div>
                      <Text strong>Zone 2 - Building Code</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>15 violations | Medium risk</Text>
                    </div>
                    <div>
                      <Text strong>Zone 8 - Environmental</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>12 violations | Medium risk</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Card size="small" title="Frequency of Repeat Inspections" style={{ background: token.colorBgContainer }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Analysis shows 23 businesses (anonymized) have required multiple inspections. 
                Average repeat inspection frequency: 2.3 inspections per business. Pattern analysis available for policy review.
              </Text>
            </Card>
          </Space>
        </Card>

        {/* 7. Officer Activity & Performance (Aggregated) */}
        <Card 
          title={
            <Space>
              <TeamOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Officer Activity & Performance</Title>
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
            <Alert
              message="Aggregated View Only"
              description="Restrictions: No reassignment, no enforcement overrides, aggregated only. Purpose: Identifies performance trends without operational interference."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Inspections Conducted Per Officer:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Average: 12 inspections | Range: 5-18 inspections
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Average Resolution Time:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Per officer: 10-15 days | Department average: 12.5 days
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Inspection Workload Distribution:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Enforcement: 45 | Inspections: 38 | Legal: 23
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 8. Violations / Inspections Overview Table (Read-Only) */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Violations / Inspections Overview Table</Title>
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
            <Alert
              message="Read-Only Table"
              description="Table features: Sort, filter, pagination. Explicitly excluded: Edit, Issue, Resolve, Upload actions. All enforcement actions must be performed through authorized operational modules."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={violationsColumns}
              dataSource={[]}
              loading={false}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                showTotal: (total) => `Total ${total} records` 
              }}
              locale={{ emptyText: 'No violations/inspections available for the selected filters' }}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedRow ? [selectedRow] : [],
                onSelect: (record) => setSelectedRow(record.id)
              }}
            />
          </Space>
        </Card>

        {/* 9. Drill-Down Summary View (Read-Only) */}
        {selectedRow && (
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                <Title level={4} style={{ margin: 0 }}>Violation / Inspection Summary View</Title>
              </Space>
            }
            style={{ 
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            extra={
              <Button onClick={() => setSelectedRow(null)}>Close</Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Alert
                message="Governance Rule"
                description="No modification, no decision controls available. This maintains chain-of-custody integrity. All viewable information is read-only."
                type="warning"
                icon={<SafetyCertificateOutlined />}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Violation / Inspection Timeline">
                    <Timeline>
                      <Timeline.Item color="blue">
                        <Text strong>Inspection Scheduled</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-10 09:00 AM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="green">
                        <Text strong>Inspection Completed</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-10 11:30 AM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="red">
                        <Text strong>Violation Issued</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-11 02:15 PM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="orange">
                        <Text strong>Under Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-15 10:00 AM
                        </Text>
                      </Timeline.Item>
                    </Timeline>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Officer Handling History">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Officer A - Conducted Inspection</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-10 09:00 AM - 11:30 AM
                        </Text>
                      </div>
                      <div>
                        <Text strong>Officer B - Issued Violation</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-11 02:15 PM
                        </Text>
                      </div>
                      <div>
                        <Text strong>Officer C - Reviewing Case</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-15 10:00 AM - Ongoing
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Status Changes">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Inspection Scheduled → Completed</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Changed by: Officer A | 2024-01-10
                        </Text>
                      </div>
                      <div>
                        <Text strong>Completed → Violation Issued</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Changed by: Officer B | 2024-01-11
                        </Text>
                      </div>
                      <div>
                        <Text strong>Violation Issued → Under Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Changed by: Officer C | 2024-01-15
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Appeal or Correction Activity">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Appeal Status:</Text> <Tag color="orange">Under Review</Tag>
                      </div>
                      <div>
                        <Text strong>Appeal Filed:</Text> 2024-01-18
                      </div>
                      <div>
                        <Text strong>Correction Requests:</Text> 2 requests
                      </div>
                      <div>
                        <Text strong>Last Correction:</Text> 2024-01-20
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          </Card>
        )}

        {/* 10. Alerts & Oversight Indicators */}
        <Card 
          title={
            <Space>
              <WarningOutlined style={{ color: token.colorError, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Alerts & Oversight Indicators</Title>
            </Space>
          }
          style={{ 
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: `1px solid ${token.colorError}30`
          }}
          headStyle={{
            background: `linear-gradient(135deg, ${token.colorError}10 0%, transparent 100%)`,
            borderBottom: `2px solid ${token.colorError}30`
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Automated Risk Flags"
              description="Displayed as risk indicators, not enforcement actions. All alerts require human review and context."
              type="warning"
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Badge status="error" text={
                <Text strong>Overdue inspections: {kpiData.overdueFollowups} cases beyond deadline</Text>
              } />
              <Badge status="warning" text={
                <Text>Repeated violations detected (anonymized): 5 businesses with 3+ violations</Text>
              } />
              <Badge status="warning" text={
                <Text>Delayed follow-ups: 8 cases requiring attention</Text>
              } />
              <Badge status="warning" text={
                <Text>Unusual enforcement patterns detected in Zone 5</Text>
              } />
            </Space>
          </Space>
        </Card>

        {/* 11. Export & Audit Controls */}
        <Card 
          title={
            <Space>
              <DownloadOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Export & Audit Controls</Title>
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
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 14 }}>Allowed Exports:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li><Text strong>PDF Summaries:</Text> For reports and presentations</li>
                      <li><Text strong>CSV (Aggregated Data Only):</Text> For data analysis</li>
                    </ul>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 14 }}>Mandatory Logging:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Manager ID</li>
                      <li>Timestamp</li>
                      <li>Report scope</li>
                    </ul>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Alert
              message="Audit Readiness & Accountability"
              description="All export actions are logged with full details to ensure audit readiness and accountability."
              type="info"
              icon={<SafetyCertificateOutlined />}
            />
          </Space>
        </Card>

        {/* 12. Footer & Legal Notice */}
        <Card 
          style={{ 
            background: `linear-gradient(135deg, ${token.colorInfoBg} 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Alert
            message={
              <Text strong style={{ fontSize: 15 }}>
                Legal & Governance Notice
              </Text>
            }
            description={
              <Text style={{ fontSize: 13 }}>
                This module provides read-only oversight of violations and inspections. All enforcement actions must be performed through authorized operational modules. 
                Access to this module is logged and monitored for security, compliance, and audit purposes.
              </Text>
            }
            type="info"
            icon={<SafetyCertificateOutlined style={{ fontSize: 18 }} />}
            showIcon
            style={{ 
              background: 'transparent',
              border: 'none'
            }}
          />
        </Card>
      </div>
    </LGUManagerLayout>
  )
}
