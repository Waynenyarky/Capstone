/**
 * View Page: ReportsAnalyticsPage
 * Reports / Analytics page for LGU Manager
 * Secure, read-only intelligence module
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
  Divider,
  Table,
  Tag,
  Tooltip,
  Badge
} from 'antd'
import { 
  BarChartOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import { useReports, useAnalytics } from '../../presentation/hooks'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

export default function ReportsAnalyticsPage() {
  const { token } = theme.useToken()
  const { loading: reportsLoading, reports, generateReport } = useReports()
  const { loading: analyticsLoading, analytics, loadAnalytics } = useAnalytics()
  
  const [timeRange, setTimeRange] = useState('month')
  const [department, setDepartment] = useState('all')
  const [exportFormat, setExportFormat] = useState('pdf')

  // Mock data - replace with actual data from hooks
  const kpiData = {
    totalPermits: 1247,
    approvalRate: 78.5,
    avgProcessingTime: 5.2,
    activeViolations: 43,
    inspectionsCompleted: 892,
    appealsPending: 12
  }

  const permitColumns = [
    { title: 'Period', dataIndex: 'period', key: 'period', sorter: true },
    { title: 'Submitted', dataIndex: 'submitted', key: 'submitted', sorter: true },
    { title: 'Approved', dataIndex: 'approved', key: 'approved', sorter: true },
    { title: 'Rejected', dataIndex: 'rejected', key: 'rejected', sorter: true },
    { title: 'Avg Processing Time (days)', dataIndex: 'avgTime', key: 'avgTime', sorter: true },
  ]

  const violationColumns = [
    { title: 'Barangay/Zone', dataIndex: 'zone', key: 'zone', sorter: true },
    { title: 'Total Violations', dataIndex: 'total', key: 'total', sorter: true },
    { title: 'Repeat Offenders', dataIndex: 'repeat', key: 'repeat', sorter: true },
    { title: 'Cessation Orders', dataIndex: 'cessation', key: 'cessation', sorter: true },
  ]

  const appealsColumns = [
    { title: 'Period', dataIndex: 'period', key: 'period', sorter: true },
    { title: 'Filed', dataIndex: 'filed', key: 'filed', sorter: true },
    { title: 'Resolved', dataIndex: 'resolved', key: 'resolved', sorter: true },
    { title: 'Avg Resolution Time (days)', dataIndex: 'avgTime', key: 'avgTime', sorter: true },
    { title: 'Approval Rate (%)', dataIndex: 'approvalRate', key: 'approvalRate', sorter: true },
  ]

  const handleExport = async () => {
    try {
      await generateReport({
        type: 'full',
        period: timeRange,
        filters: { department },
        format: exportFormat
      })
    } catch (err) {
      console.error('Failed to export report:', err)
    }
  }

  return (
    <LGUManagerLayout pageTitle="Reports / Analytics">
      <div style={{ paddingBottom: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* 1. Page Header & Controls */}
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
                  <BarChartOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
                  <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
                    Reports & Analytics
                  </Title>
                </Space>
                <Space>
                  <Tag color="blue" icon={<SafetyCertificateOutlined />}>
                    LGU Manager
                  </Tag>
                  <Tag color="default">Read-Only Access</Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} lg={16}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      Time Range
                    </Text>
                    <Select
                      value={timeRange}
                      onChange={setTimeRange}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="today">Today</Option>
                      <Option value="month">This Month</Option>
                      <Option value="quarter">This Quarter</Option>
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
                      Department
                    </Text>
                    <Select
                      value={department}
                      onChange={setDepartment}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Departments</Option>
                      <Option value="permits">Permits</Option>
                      <Option value="inspections">Inspections</Option>
                      <Option value="enforcement">Enforcement</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      <DownloadOutlined style={{ marginRight: 4 }} />
                      Export Report
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
                        loading={reportsLoading}
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

        {/* 2. Executive Summary (KPI Overview) */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Executive Summary</Title>
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
            High-level overview of system health and key performance indicators
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
                      Total Permit Applications
                    </Text>
                  }
                  value={kpiData.totalPermits}
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
                      Approval Rate
                    </Text>
                  }
                  value={kpiData.approvalRate}
                  suffix="%"
                  prefix={<RiseOutlined style={{ color: '#3f8600' }} />}
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
                      Avg Processing Time
                    </Text>
                  }
                  value={kpiData.avgProcessingTime}
                  suffix="days"
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
                      Active Violations
                    </Text>
                  }
                  value={kpiData.activeViolations}
                  prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
                  valueStyle={{ 
                    color: '#cf1322',
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
                      Inspections Completed
                    </Text>
                  }
                  value={kpiData.inspectionsCompleted}
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
                      Appeals Pending
                    </Text>
                  }
                  value={kpiData.appealsPending}
                  prefix={<ExclamationCircleOutlined style={{ color: token.colorWarning }} />}
                  valueStyle={{ 
                    color: token.colorWarning,
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 3. Permit Analytics Section */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Permit Analytics</Title>
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
              message="Key Metrics"
              description="Permit submissions over time, approval vs rejection ratio, average processing time by department, frequency of correction requests."
              type="info"
              icon={<FileTextOutlined />}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              <strong>Purpose:</strong> Identifies processing delays, bottlenecks, and policy inefficiencies.
            </Text>
            <Table
              columns={permitColumns}
              dataSource={[]}
              loading={analyticsLoading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} records` }}
              locale={{ emptyText: 'No permit data available for the selected period' }}
              style={{ marginTop: 16 }}
            />
          </Space>
        </Card>

        {/* 4. Violation & Inspection Analytics */}
        <Card 
          title={
            <Space>
              <WarningOutlined style={{ color: '#cf1322', fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Violation & Inspection Analytics</Title>
            </Space>
          }
          style={{ 
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          headStyle={{
            background: `linear-gradient(135deg, #cf132210 0%, transparent 100%)`,
            borderBottom: `2px solid #cf132230`
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Visualizations"
              description="Violations per barangay/zone, inspection outcomes (Passed/Failed/Conditional), repeat offender count, cessation orders issued over time."
              type="warning"
              icon={<WarningOutlined />}
              style={{ marginBottom: 8 }}
            />
            <Alert
              message="Security & Privacy"
              description="Business identities are anonymized or grouped for privacy protection. No personal information is displayed."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={violationColumns}
              dataSource={[]}
              loading={analyticsLoading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} records` }}
              locale={{ emptyText: 'No violation data available for the selected period' }}
            />
          </Space>
        </Card>

        {/* 5. Appeals & Resolution Analytics */}
        <Card 
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: token.colorWarning, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Appeals & Resolution Analytics</Title>
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
              message="Key Metrics"
              description="Appeals filed vs resolved, average appeal resolution time, approval vs denial ratio, backlog trend."
              type="info"
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              <strong>Purpose:</strong> Measures fairness and accountability, highlights systemic approval issues, supports legal and governance review.
            </Text>
            <Table
              columns={appealsColumns}
              dataSource={[]}
              loading={analyticsLoading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} records` }}
              locale={{ emptyText: 'No appeals data available for the selected period' }}
            />
          </Space>
        </Card>

        {/* 6. Officer / Department Performance Metrics */}
        <Card 
          title={
            <Space>
              <TeamOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Department Performance Metrics</Title>
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
              message="Privacy & Anonymization Policy"
              description="No individual officer names are displayed. All metrics are aggregated at department-level or role-level only. Data is strictly anonymized to prevent bias or harassment."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Avg Handling Time
                      </Text>
                    }
                    value="4.2"
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
                    value="92.5"
                    suffix="%"
                    valueStyle={{ color: '#3f8600', fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Decision Consistency
                      </Text>
                    }
                    value="88.3"
                    suffix="%"
                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Workload Distribution
                      </Text>
                    }
                    value="Balanced"
                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 7. Anomaly & Risk Indicators */}
        <Card 
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: token.colorError, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Anomaly & Risk Indicators</Title>
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
              message="Automated Risk Detection"
              description="This high-value feature flags unusual patterns for management review. These are metrics and indicators, not accusations. All flagged items require human review and context."
              type="warning"
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              <strong>Flagged Items for Review:</strong>
            </Text>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Badge status="warning" text={
                <Text>Unusually high approval rates detected in Department A (requires review)</Text>
              } />
              <Badge status="warning" text={
                <Text>Delays beyond SLA thresholds detected in 3 cases</Text>
              } />
              <Badge status="warning" text={
                <Text>Irregular activity pattern identified in Zone 5</Text>
              } />
            </Space>
          </Space>
        </Card>

        {/* 8. Detailed Tables (Read-Only) */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Detailed Aggregated Data Tables</Title>
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
              message="Read-Only Data Tables"
              description="These tables display aggregated counts, trends per period, and department summaries. All data is read-only with no editable fields, personal identifiers, or raw document data."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Card size="small" style={{ background: token.colorBgContainer }}>
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 13 }}>Table Features:</Text>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Sortable columns for easy data analysis</li>
                  <li>Filterable data using controls in the header</li>
                  <li>Pagination for large datasets</li>
                  <li>Export functionality for offline analysis</li>
                </ul>
              </Space>
            </Card>
          </Space>
        </Card>

        {/* 9. Report Export & Audit Controls */}
        <Card 
          title={
            <Space>
              <DownloadOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Report Export & Audit Controls</Title>
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
                    <Text strong style={{ fontSize: 14 }}>Export Options:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li><Text strong>PDF Format:</Text> For council meetings and audit presentations</li>
                      <li><Text strong>CSV Format:</Text> For offline analysis and data processing</li>
                    </ul>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 14 }}>Mandatory Audit Logging:</Text>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Manager ID and role</li>
                      <li>Report type and format</li>
                      <li>Export date and time</li>
                      <li>Time range covered</li>
                    </ul>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Alert
              message="Audit Trail & Accountability"
              description="Every export action is automatically logged with full details. This ensures accountability, prevents misuse, and supports compliance with audit requirements."
              type="info"
              icon={<SafetyCertificateOutlined />}
            />
          </Space>
        </Card>

        {/* 10. Footer / Compliance Notice */}
        <Card 
          style={{ 
            background: `linear-gradient(135deg, ${token.colorInfoBg} 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Alert
            message={
              <Text strong style={{ fontSize: 15 }}>
                Compliance & Data Privacy Notice
              </Text>
            }
            description={
              <Text style={{ fontSize: 13 }}>
                All data presented in this module is aggregated, anonymized where applicable, and provided for decision-support purposes only. 
                This module does not allow modification of operational records. Access to this module is logged and monitored for security and compliance purposes.
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
