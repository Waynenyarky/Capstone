/**
 * View Page: PermitApplicationsOverviewPage
 * Permit Applications Overview page for LGU Manager
 * Read-only oversight module for permit processing supervision
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
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
  Timeline,
  Empty,
  Spin
} from 'antd'
import { 
  FileTextOutlined, 
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
  FallOutlined
} from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { get } from '@/lib/http.js'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

export default function PermitApplicationsOverviewPage() {
  const { token } = theme.useToken()
  
  const [timeRange, setTimeRange] = useState('month')
  const [permitType, setPermitType] = useState('all')
  const [barangay, setBarangay] = useState('all')
  const [status, setStatus] = useState('all')
  const [assignedOfficer, setAssignedOfficer] = useState('all')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [selectedRow, setSelectedRow] = useState(null)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await get('/api/lgu-manager/overview/permits')
      setData(res?.data || res || {})
    } catch (err) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const kpiData = useMemo(() => ({
    totalApplications: data?.totalApplications ?? 0,
    pendingReview: data?.pendingReview ?? 0,
    forCorrection: data?.forCorrection ?? 0,
    approved: data?.approved ?? 0,
    rejected: data?.rejected ?? 0,
    slaBreaches: data?.slaBreaches ?? 0
  }), [data])

  const tableData = useMemo(() => data?.items || data?.list || [], [data])

  const slaData = useMemo(() => ({
    avgProcessingTime: data?.avgProcessingTime ?? '—',
    slaComplianceRate: data?.slaComplianceRate ?? '—',
    avgCorrectionCycleTime: data?.avgCorrectionCycleTime ?? '—'
  }), [data])

  const statusBreakdown = useMemo(() => data?.statusBreakdown || {}, [data])

  const permitColumns = [
    { 
      title: 'Application ID', 
      dataIndex: 'id', 
      key: 'id',
      sorter: true,
      render: (text) => <Text code>{text}</Text>
    },
    { 
      title: 'Permit Type', 
      dataIndex: 'type', 
      key: 'type',
      sorter: true,
      render: (type) => (
        <Tag color={type === 'New' ? 'blue' : 'green'}>{type}</Tag>
      )
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
          'for_correction': 'yellow',
          'approved': 'green',
          'rejected': 'red',
          'closed': 'default'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    { 
      title: 'Assigned Officer', 
      dataIndex: 'officer', 
      key: 'officer',
      sorter: true
    },
    { 
      title: 'Processing Duration', 
      dataIndex: 'duration', 
      key: 'duration',
      sorter: true,
      render: (days) => `${days} days`
    },
    { 
      title: 'SLA Status', 
      dataIndex: 'slaStatus', 
      key: 'slaStatus',
      sorter: true,
      render: (slaStatus) => {
        const colorMap = {
          'within': 'green',
          'approaching': 'yellow',
          'breach': 'red'
        }
        return <Badge status={colorMap[slaStatus] || 'default'} text={slaStatus} />
      }
    },
  ]

  const handleExport = useCallback(() => {
    const headers = ['Application ID', 'Permit Type', 'Submission Date', 'Status', 'Officer', 'Duration', 'SLA Status']
    const rows = (tableData || []).map(item => [
      item.id, item.type, item.submissionDate, item.status, item.officer, item.duration, item.slaStatus
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `permit-applications-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [tableData])

  if (error) {
    return (
      <LGUManagerLayout pageTitle="Permit Applications - Overview">
        <Alert message="Error" description={error} type="error" showIcon action={<Button onClick={fetchData}>Retry</Button>} />
      </LGUManagerLayout>
    )
  }

  return (
    <LGUManagerLayout pageTitle="Permit Applications - Overview">
      <Spin spinning={loading} size="large">
      <div style={{ paddingBottom: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* 1. Page Header & Global Controls */}
        <Card 
          style={{ 
            marginBottom: 24,
            background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={4}>
                <Space align="center">
                  <FileTextOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
                  <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
                    Permit Applications – Overview
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
                      <Option value="today">Today</Option>
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
                      Permit Type
                    </Text>
                    <Select
                      value={permitType}
                      onChange={setPermitType}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Types</Option>
                      <Option value="new">New</Option>
                      <Option value="renewal">Renewal</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      Status
                    </Text>
                    <Select
                      value={status}
                      onChange={setStatus}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Status</Option>
                      <Option value="pending">Pending Review</Option>
                      <Option value="for_correction">For Correction</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="rejected">Rejected</Option>
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

        {/* 2. Executive Permit Summary (KPI Tiles) */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Executive Permit Summary</Title>
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
          <Paragraph type="secondary" style={{ marginBottom: 24, fontSize: 14 }}>
            Instant situational awareness for permit processing status
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
                      Total Applications
                    </Text>
                  }
                  value={kpiData.totalApplications}
                  prefix={<FileTextOutlined style={{ color: token.colorPrimary }} />}
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
                      Pending Review
                    </Text>
                  }
                  value={kpiData.pendingReview}
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
                      For Correction
                    </Text>
                  }
                  value={kpiData.forCorrection}
                  prefix={<ExclamationCircleOutlined style={{ color: token.colorWarning }} />}
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
                      Approved
                    </Text>
                  }
                  value={kpiData.approved}
                  prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                  valueStyle={{ 
                    color: token.colorSuccess,
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
                      Rejected
                    </Text>
                  }
                  value={kpiData.rejected}
                  prefix={<FallOutlined style={{ color: token.colorError }} />}
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
                  borderRadius: 8,
                  borderColor: token.colorError
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      SLA Breaches
                    </Text>
                  }
                  value={kpiData.slaBreaches}
                  prefix={<WarningOutlined style={{ color: token.colorError }} />}
                  valueStyle={{ 
                    color: token.colorError,
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 3. Permit Volume & Trend Section */}
        <Card 
          title={
            <Space>
              <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Permit Volume & Trends</Title>
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
            <Alert
              message="Trend Analysis"
              description="Visualizations show applications over time, new vs renewal permits, and status distribution to answer: Are applications increasing? Is backlog growing? Are approvals keeping pace with submissions?"
              type="info"
              icon={<BarChartOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Line Chart: Applications Over Time</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No chart data available" />
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Bar Chart: New vs Renewal Permits</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No chart data available" />
                  </div>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 4. Status-Based Permit Breakdown */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Status-Based Permit Breakdown</Title>
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
            <Alert
              message="Read-Only Status Summary"
              description="Structured summary by status. No action buttons (approve, reject, edit) are available in this overview module."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Tabs defaultActiveKey="pending">
              <TabPane 
                tab={
                  <Badge count={kpiData.pendingReview} size="small">
                    <span>Pending Review</span>
                  </Badge>
                } 
                key="pending"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.pendingReview} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Days in Status" value={statusBreakdown?.pending?.avgDays ?? '—'} suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value={statusBreakdown?.pending?.percentage ?? '—'} suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.forCorrection} size="small">
                    <span>For Correction</span>
                  </Badge>
                } 
                key="correction"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.forCorrection} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Days in Status" value={statusBreakdown?.forCorrection?.avgDays ?? '—'} suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value={statusBreakdown?.forCorrection?.percentage ?? '—'} suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.approved} size="small">
                    <span>Approved</span>
                  </Badge>
                } 
                key="approved"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.approved} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Days in Status" value={statusBreakdown?.approved?.avgDays ?? '—'} suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value={statusBreakdown?.approved?.percentage ?? '—'} suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.rejected} size="small">
                    <span>Rejected</span>
                  </Badge>
                } 
                key="rejected"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Count" value={kpiData.rejected} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Days in Status" value={statusBreakdown?.rejected?.avgDays ?? '—'} suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value={statusBreakdown?.rejected?.percentage ?? '—'} suffix="%" />
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
            boxShadow: token.boxShadowSecondary
          }}
          headStyle={{
            background: `linear-gradient(135deg, ${token.colorWarning}10 0%, transparent 100%)`,
            borderBottom: `2px solid ${token.colorWarning}30`
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Service Level Agreement Monitoring"
              description="Supports enforcement of service standards and policy compliance. Visual indicators: Green = within SLA, Yellow = approaching SLA, Red = breach."
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
                        Average Processing Time
                      </Text>
                    }
                    value={slaData.avgProcessingTime}
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
                    value={slaData.slaComplianceRate}
                    suffix="%"
                    valueStyle={{ color: token.colorSuccess, fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorError}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Overdue Permits
                      </Text>
                    }
                    value={kpiData.slaBreaches}
                    valueStyle={{ color: token.colorError, fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Avg Correction Cycle Time
                      </Text>
                    }
                    value={slaData.avgCorrectionCycleTime}
                    suffix="days"
                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 6. Officer Workload & Distribution (Aggregated) */}
        <Card 
          title={
            <Space>
              <TeamOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Officer Workload & Distribution</Title>
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
            <Alert
              message="Aggregated View Only"
              description="No individual permit decisions shown. No direct reassignment allowed. View-only workload distribution to identify overload, imbalance, or potential risk patterns."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Permits Assigned Per Officer:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {data?.officerWorkload?.avgPerOfficer || 'No data available'}
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Average Handling Time:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {data?.officerWorkload?.avgHandlingTime || 'No data available'}
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Backlog Per Department:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {data?.officerWorkload?.backlogPerDepartment || 'No data available'}
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 7. Permit Overview Table (Read-Only) */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Permit Overview Table</Title>
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
            <Alert
              message="Read-Only Table"
              description="Table supports sort, filter, and paginate. Explicitly excluded: Document download (unless summary), edit or decision controls."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={permitColumns}
              dataSource={tableData}
              loading={loading}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                showTotal: (total) => `Total ${total} records` 
              }}
              locale={{ emptyText: 'No permit applications available for the selected filters' }}
              scroll={{ x: 'max-content' }}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedRow ? [selectedRow] : [],
                onSelect: (record) => setSelectedRow(record.id)
              }}
            />
          </Space>
        </Card>

        {/* 8. Permit Drill-Down (Summary View Only) */}
        {selectedRow && (
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                <Title level={4} style={{ margin: 0 }}>Application Summary View</Title>
              </Space>
            }
            style={{ 
              marginBottom: 24,
              boxShadow: token.boxShadowSecondary
            }}
            extra={
              <Button onClick={() => setSelectedRow(null)}>Close</Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Alert
                message="Summary View Only"
                description="No document editing, decision override, or notes modification. This preserves chain-of-custody and accountability."
                type="warning"
                icon={<SafetyCertificateOutlined />}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Application Timeline">
                    <Timeline>
                      <Timeline.Item color="green">
                        <Text strong>Submitted</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-15 10:30 AM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="blue">
                        <Text strong>Under Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-16 02:15 PM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="orange">
                        <Text strong>For Correction</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-18 09:00 AM
                        </Text>
                      </Timeline.Item>
                    </Timeline>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Status Change History">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Submitted → Under Review</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Changed by: Officer A | 2024-01-16
                        </Text>
                      </div>
                      <div>
                        <Text strong>Under Review → For Correction</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Changed by: Officer B | 2024-01-18
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Card size="small" title="Officer Handling History">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div>
                    <Text strong>Officer A</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Assigned: 2024-01-16 | Duration: 2 days
                    </Text>
                  </div>
                  <div>
                    <Text strong>Officer B</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Assigned: 2024-01-18 | Duration: Ongoing
                    </Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </Card>
        )}

        {/* 9. Alerts & Oversight Indicators */}
        <Card 
          title={
            <Space>
              <WarningOutlined style={{ color: token.colorError, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Alerts & Oversight Indicators</Title>
            </Space>
          }
          style={{ 
            marginBottom: 24,
            boxShadow: token.boxShadowSecondary,
            border: `1px solid ${token.colorError}30`
          }}
          headStyle={{
            background: `linear-gradient(135deg, ${token.colorError}10 0%, transparent 100%)`,
            borderBottom: `2px solid ${token.colorError}30`
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="High-Value Oversight Feature"
              description="Flags and warning indicators displayed as metrics, not accusations. All alerts require human review and context."
              type="warning"
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Badge status="error" text={
                <Text strong>Permits overdue beyond SLA: {kpiData.slaBreaches} cases</Text>
              } />
              <Badge status="warning" text={
                <Text>High correction frequency detected in Department A</Text>
              } />
              <Badge status="warning" text={
                <Text>Unusual approval/rejection ratio in Zone 3</Text>
              } />
              <Badge status="warning" text={
                <Text>Backlog growth alert: 15% increase this month</Text>
              } />
            </Space>
          </Space>
        </Card>

        {/* 10. Export & Audit Controls */}
        <Card 
          title={
            <Space>
              <DownloadOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Export & Audit Controls</Title>
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
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 14 }}>Allowed Exports:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li><Text strong>Summary-level PDF:</Text> For reports and presentations</li>
                      <li><Text strong>Aggregated CSV:</Text> For data analysis</li>
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
                      <li>Date/time</li>
                      <li>Data scope</li>
                    </ul>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Alert
              message="Audit Traceability"
              description="Prevents misuse and ensures audit traceability. All export actions are logged with full details."
              type="info"
              icon={<SafetyCertificateOutlined />}
            />
          </Space>
        </Card>

        {/* 11. Footer & Governance Notice */}
        <Card 
          style={{ 
            background: `linear-gradient(135deg, ${token.colorInfoBg} 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Alert
            message={
              <Text strong style={{ fontSize: 15 }}>
                Governance & Access Notice
              </Text>
            }
            description={
              <Text style={{ fontSize: 13 }}>
                This module provides read-only oversight of permit applications. All decisions and document changes must be performed through authorized operational modules. 
                Access to this module is logged and monitored for security and compliance purposes.
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
      </Spin>
    </LGUManagerLayout>
  )
}
