/**
 * View Page: AppealsOverviewPage
 * Appeals Overview page for LGU Manager
 * Read-only oversight module for appeal supervision
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
  AuditOutlined, 
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
  CloseCircleOutlined,
  CheckOutlined,
  StopOutlined
} from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

export default function AppealsOverviewPage() {
  const { token } = theme.useToken()
  
  const [timeRange, setTimeRange] = useState('month')
  const [appealStatus, setAppealStatus] = useState('all')
  const [appealType, setAppealType] = useState('all')
  const [barangay, setBarangay] = useState('all')
  const [assignedReviewer, setAssignedReviewer] = useState('all')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [selectedRow, setSelectedRow] = useState(null)

  // Mock data - replace with actual data from hooks
  const kpiData = {
    totalAppeals: 128,
    pendingAppeals: 45,
    underReview: 32,
    approvedAppeals: 38,
    rejectedAppeals: 13,
    overdueAppeals: 8
  }

  const appealsColumns = [
    { 
      title: 'Appeal ID', 
      dataIndex: 'id', 
      key: 'id',
      sorter: true,
      render: (text) => <Text code>{text}</Text>
    },
    { 
      title: 'Appeal Type', 
      dataIndex: 'type', 
      key: 'type',
      sorter: true,
      render: (type) => {
        const colorMap = {
          'permit': 'blue',
          'violation': 'red',
          'cessation': 'orange'
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      }
    },
    { 
      title: 'Business Identifier', 
      dataIndex: 'businessId', 
      key: 'businessId',
      sorter: true,
      render: (id) => <Text type="secondary">***{id?.slice(-4)}</Text>
    },
    { 
      title: 'Submission Date', 
      dataIndex: 'submissionDate', 
      key: 'submissionDate',
      sorter: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    { 
      title: 'Current Status', 
      dataIndex: 'status', 
      key: 'status',
      sorter: true,
      render: (status) => {
        const colorMap = {
          'pending': 'orange',
          'under_review': 'blue',
          'approved': 'green',
          'rejected': 'red',
          'escalated': 'purple'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    { 
      title: 'Assigned Reviewer', 
      dataIndex: 'reviewer', 
      key: 'reviewer',
      sorter: true
    },
    { 
      title: 'Processing Duration', 
      dataIndex: 'duration', 
      key: 'duration',
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
    console.log('Exporting appeals summary...')
  }

  return (
    <LGUManagerLayout pageTitle="Appeals - Overview">
      <div style={{ paddingBottom: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* 1. Page Header & Oversight Controls */}
        <Card 
          style={{ 
            marginBottom: 24,
            background: `linear-gradient(135deg, ${token.colorInfo}15 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={4}>
                <Space align="center">
                  <AuditOutlined style={{ fontSize: 28, color: token.colorInfo }} />
                  <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
                    Appeals – Overview
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
                      <Option value="day">Daily</Option>
                      <Option value="month">Monthly</Option>
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
                      Appeal Status
                    </Text>
                    <Select
                      value={appealStatus}
                      onChange={setAppealStatus}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Status</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="under_review">Under Review</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="rejected">Rejected</Option>
                      <Option value="escalated">Escalated / Delayed</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      Appeal Type
                    </Text>
                    <Select
                      value={appealType}
                      onChange={setAppealType}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Types</Option>
                      <Option value="permit">Permit</Option>
                      <Option value="violation">Violation</Option>
                      <Option value="cessation">Cessation</Option>
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

        {/* 2. Executive Appeals Summary (KPI Tiles) */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Executive Appeals Summary</Title>
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
            Instant visibility into appeal volume and system health
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
                      Total Appeals Filed
                    </Text>
                  }
                  value={kpiData.totalAppeals}
                  prefix={<FileTextOutlined style={{ color: token.colorInfo }} />}
                  valueStyle={{ 
                    color: token.colorInfo,
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
                      Pending Appeals
                    </Text>
                  }
                  value={kpiData.pendingAppeals}
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
                      Under Review
                    </Text>
                  }
                  value={kpiData.underReview}
                  prefix={<AuditOutlined style={{ color: token.colorPrimary }} />}
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
                      Approved Appeals
                    </Text>
                  }
                  value={kpiData.approvedAppeals}
                  prefix={<CheckOutlined style={{ color: '#3f8600' }} />}
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
                      Rejected Appeals
                    </Text>
                  }
                  value={kpiData.rejectedAppeals}
                  prefix={<CloseCircleOutlined style={{ color: token.colorError }} />}
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
                  border: `1px solid #cf1322`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Overdue Appeals
                    </Text>
                  }
                  value={kpiData.overdueAppeals}
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

        {/* 3. Appeals Volume & Trend Analysis */}
        <Card 
          title={
            <Space>
              <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Appeals Volume & Trend Analysis</Title>
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
              description="Are appeals increasing? Is the backlog improving or worsening? Are approval rates consistent over time?"
              type="info"
              icon={<BarChartOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Line Chart: Appeals Filed Over Time</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">Chart visualization would appear here</Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Bar Chart: Approval vs Rejection Rates</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">Chart visualization would appear here</Text>
                  </div>
                </Card>
              </Col>
            </Row>
            <Card size="small" style={{ background: token.colorBgContainer }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Trend Chart: Appeal Backlog Growth or Reduction</Text>
              <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                <Text type="secondary">Chart visualization would appear here</Text>
              </div>
            </Card>
          </Space>
        </Card>

        {/* 4. Status-Based Appeal Breakdown */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Status-Based Appeal Breakdown</Title>
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
              description="No approve, reject, or edit controls appear in this overview module. All appeal decisions must be performed through authorized operational modules."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Tabs defaultActiveKey="pending">
              <TabPane 
                tab={
                  <Badge count={kpiData.pendingAppeals} size="small">
                    <span>Pending</span>
                  </Badge>
                } 
                key="pending"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.pendingAppeals} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Time in Status" value="8.5" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="35.2" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.underReview} size="small">
                    <span>Under Review</span>
                  </Badge>
                } 
                key="under_review"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.underReview} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Time in Status" value="12.3" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="25.0" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.approvedAppeals} size="small">
                    <span>Approved</span>
                  </Badge>
                } 
                key="approved"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.approvedAppeals} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Time in Status" value="15.8" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="29.7" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.rejectedAppeals} size="small">
                    <span>Rejected</span>
                  </Badge>
                } 
                key="rejected"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.rejectedAppeals} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Time in Status" value="18.2" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="10.2" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Escalated / Delayed" key="escalated">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value="6" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Time in Status" value="32.5" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="4.7" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Space>
        </Card>

        {/* 5. SLA & Processing Performance Panel */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: token.colorWarning, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>SLA & Processing Performance</Title>
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
              message="Accountability & Service-Level Enforcement"
              description="Visual indicators: Green = within SLA, Yellow = approaching SLA, Red = SLA breach. Supports accountability and service-level enforcement."
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
                        Avg Appeal Resolution Time
                      </Text>
                    }
                    value="15.8"
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
                        SLA Compliance Rate
                      </Text>
                    }
                    value="87.5"
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
                        Overdue Appeals
                      </Text>
                    }
                    value={kpiData.overdueAppeals}
                    valueStyle={{ color: '#cf1322', fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Avg Review Time (All Types)
                      </Text>
                    }
                    value="13.2"
                    suffix="days"
                    valueStyle={{ color: token.colorWarning, fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 6. Risk & Pattern Detection Indicators */}
        <Card 
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: token.colorError, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Risk & Pattern Detection Indicators</Title>
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
              message="AI-Assisted Indicators (Advisory Only)"
              description="Important: AI outputs are shown as advisory indicators, not decisions. All decisions require human review and due process."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Repeat Appeals from Same Business (Masked)" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>Business Group A (Anonymized)</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>3 appeals | 2 permit, 1 violation</Text>
                    </div>
                    <div>
                      <Text strong>Business Group B (Anonymized)</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>2 appeals | 1 violation, 1 cessation</Text>
                    </div>
                    <div>
                      <Text strong>Business Group C (Anonymized)</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>2 appeals | 2 permit</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Appeal Frequency by Category" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>Permit Appeals</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>68 appeals | 53.1% of total</Text>
                    </div>
                    <div>
                      <Text strong>Violation Appeals</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>42 appeals | 32.8% of total</Text>
                    </div>
                    <div>
                      <Text strong>Cessation Appeals</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>18 appeals | 14.1% of total</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Appeals Linked to High-Risk Violations or Cessations" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>High-Risk Violation Appeals</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>12 appeals linked to critical violations</Text>
                    </div>
                    <div>
                      <Text strong>Cessation Appeals</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>8 appeals linked to cessation orders</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="AI-Assisted Indicators (Advisory)" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Badge status="warning" text={
                        <Text>Document Completeness Flags: 5 appeals with incomplete documentation</Text>
                      } />
                    </div>
                    <div>
                      <Badge status="warning" text={
                        <Text>Consistency Warnings: 3 appeals with pattern anomalies</Text>
                      } />
                    </div>
                    <div>
                      <Badge status="default" text={
                        <Text>Anomaly Detection: 2 appeals flagged for review</Text>
                      } />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 7. Reviewer / Officer Performance (Aggregated) */}
        <Card 
          title={
            <Space>
              <TeamOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Reviewer / Officer Performance</Title>
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
              description="Restrictions: No reassignment, no override of decisions, aggregated statistics only. Purpose: Monitors performance without interfering with due process."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Appeals Handled Per Reviewer:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Average: 18 appeals | Range: 8-28 appeals
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Average Decision Time:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Per reviewer: 12-18 days | Department average: 15.8 days
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>SLA Compliance Per Reviewer:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Average: 87.5% | Range: 75%-95% compliance
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 8. Appeals Overview Table (Read-Only) */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Appeals Overview Table</Title>
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
              description="Table features: Sort, filter, pagination. Explicitly excluded: Document modification, decision actions, workflow changes. All appeal decisions must be performed through authorized operational modules."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={appealsColumns}
              dataSource={[]}
              loading={false}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                showTotal: (total) => `Total ${total} records` 
              }}
              locale={{ emptyText: 'No appeals available for the selected filters' }}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedRow ? [selectedRow] : [],
                onSelect: (record) => setSelectedRow(record.id)
              }}
            />
          </Space>
        </Card>

        {/* 9. Appeal Drill-Down Summary (Read-Only) */}
        {selectedRow && (
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                <Title level={4} style={{ margin: 0 }}>Appeal Summary View</Title>
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
                description="No approve/reject buttons, no document uploads or edits available. This preserves legal defensibility and audit integrity. All viewable information is read-only."
                type="warning"
                icon={<SafetyCertificateOutlined />}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Appeal Timeline (Submission → Review → Decision)">
                    <Timeline>
                      <Timeline.Item color="blue">
                        <Text strong>Appeal Submitted</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-15 10:30 AM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="orange">
                        <Text strong>Under Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-18 09:00 AM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="purple">
                        <Text strong>Reviewer Assigned</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-20 02:15 PM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="green">
                        <Text strong>Decision Pending</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Current status
                        </Text>
                      </Timeline.Item>
                    </Timeline>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Linked Permit, Violation, or Cessation Reference">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Appeal Type:</Text> <Tag color="blue">Permit</Tag>
                      </div>
                      <div>
                        <Text strong>Linked Reference ID:</Text> <Text code>PER-2024-001234</Text>
                      </div>
                      <div>
                        <Text strong>Original Decision Date:</Text> 2024-01-10
                      </div>
                      <div>
                        <Text strong>Appeal Filed:</Text> 2024-01-15 (5 days after decision)
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Reviewer Actions and Timestamps">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Reviewer A - Initial Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-18 09:00 AM - 11:30 AM
                        </Text>
                      </div>
                      <div>
                        <Text strong>Reviewer B - Assigned for Detailed Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-20 02:15 PM - Ongoing
                        </Text>
                      </div>
                      <div>
                        <Text strong>Review Status:</Text> <Tag color="blue">Under Review</Tag>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="AI Validation Risk Flags (Advisory)">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Badge status="success" text={
                          <Text>Document Completeness: Complete</Text>
                        } />
                      </div>
                      <div>
                        <Badge status="warning" text={
                          <Text>Consistency Check: Minor anomalies detected</Text>
                        } />
                      </div>
                      <div>
                        <Badge status="default" text={
                          <Text>Pattern Analysis: Within normal parameters</Text>
                        } />
                      </div>
                      <Alert
                        message="Advisory Only"
                        description="AI outputs are advisory indicators, not decisions. All decisions require human review."
                        type="info"
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Card size="small" title="Final Decision Summary (If Completed)">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Decision information will appear here once the appeal review is completed. 
                    This section remains empty for appeals that are still pending or under review.
                  </Text>
                </Space>
              </Card>
            </Space>
          </Card>
        )}

        {/* 10. Alerts & Oversight Flags */}
        <Card 
          title={
            <Space>
              <WarningOutlined style={{ color: token.colorError, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Alerts & Oversight Flags</Title>
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
              message="Automated Oversight Indicators"
              description="Displayed as oversight alerts, not enforcement actions. All alerts require human review and context."
              type="warning"
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Badge status="error" text={
                <Text strong>Appeals exceeding SLA: {kpiData.overdueAppeals} cases beyond deadline</Text>
              } />
              <Badge status="warning" text={
                <Text>Repeated appeals from same business (masked): 3 businesses with 2+ appeals</Text>
              } />
              <Badge status="warning" text={
                <Text>Review bottlenecks: 2 reviewers with 10+ pending appeals</Text>
              } />
              <Badge status="warning" text={
                <Text>Unusual approval/rejection patterns detected in Permit appeals category</Text>
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
                      <li><Text strong>CSV (Aggregated, Non-PII):</Text> For data analysis</li>
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
              description="All export actions are logged with full details to support audits, legal reviews, and governance reporting."
              type="info"
              icon={<SafetyCertificateOutlined />}
            />
          </Space>
        </Card>

        {/* 12. Footer & Legal Disclaimer */}
        <Card 
          style={{ 
            background: `linear-gradient(135deg, ${token.colorInfoBg} 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Alert
            message={
              <Text strong style={{ fontSize: 15 }}>
                Legal & Governance Disclaimer
              </Text>
            }
            description={
              <Text style={{ fontSize: 13 }}>
                This module provides read-only oversight of appeal activities. All appeal decisions and document handling must be performed through authorized operational modules. 
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
