/**
 * View Page: CessationOverviewPage
 * Cessation Orders Overview page for LGU Manager
 * Read-only oversight module for cessation order supervision
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
  StopOutlined, 
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

export default function CessationOverviewPage() {
  const { token } = theme.useToken()
  
  const [timeRange, setTimeRange] = useState('month')
  const [cessationStatus, setCessationStatus] = useState('all')
  const [barangay, setBarangay] = useState('all')
  const [violationCategory, setViolationCategory] = useState('all')
  const [issuingOfficer, setIssuingOfficer] = useState('all')
  const [cessationType, setCessationType] = useState('all')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [selectedRow, setSelectedRow] = useState(null)

  // Mock data - replace with actual data from hooks
  const kpiData = {
    activeCessations: 87,
    temporary: 52,
    permanent: 35,
    underAppeal: 12,
    overdueUnresolved: 8,
    liftedResolved: 234
  }

  const cessationColumns = [
    { 
      title: 'Cessation ID', 
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
      title: 'Cessation Type', 
      dataIndex: 'type', 
      key: 'type',
      sorter: true,
      render: (type) => (
        <Tag color={type === 'Temporary' ? 'orange' : 'red'}>{type}</Tag>
      )
    },
    { 
      title: 'Issuance Date', 
      dataIndex: 'issuanceDate', 
      key: 'issuanceDate',
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
          'active': 'red',
          'lifted': 'green',
          'under_appeal': 'orange',
          'expired': 'default',
          'escalated': 'purple'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    { 
      title: 'Duration (days)', 
      dataIndex: 'duration', 
      key: 'duration',
      sorter: true,
      render: (days) => `${days} days`
    },
    { 
      title: 'Issuing Officer', 
      dataIndex: 'officer', 
      key: 'officer',
      sorter: true
    },
    { 
      title: 'SLA / Compliance Status', 
      dataIndex: 'complianceStatus', 
      key: 'complianceStatus',
      sorter: true,
      render: (status) => {
        const colorMap = {
          'within': 'green',
          'nearing': 'yellow',
          'overdue': 'red'
        }
        return <Badge status={colorMap[status] || 'default'} text={status} />
      }
    },
  ]

  const handleExport = async () => {
    // Export functionality
    console.log('Exporting cessation orders summary...')
  }

  return (
    <LGUManagerLayout pageTitle="Cessation Orders - Overview">
      <div style={{ paddingBottom: 24, maxWidth: 1400, margin: '0 auto' }}>
        {/* 1. Page Header & Oversight Controls */}
        <Card 
          style={{ 
            marginBottom: 24,
            background: `linear-gradient(135deg, ${token.colorError}15 0%, ${token.colorBgContainer} 100%)`,
            border: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={4}>
                <Space align="center">
                  <StopOutlined style={{ fontSize: 28, color: token.colorError }} />
                  <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
                    Cessation Orders – Overview
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
                      <Option value="week">This Week</Option>
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
                      Cessation Status
                    </Text>
                    <Select
                      value={cessationStatus}
                      onChange={setCessationStatus}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Status</Option>
                      <Option value="active">Active</Option>
                      <Option value="lifted">Lifted</Option>
                      <Option value="under_appeal">Under Appeal</Option>
                      <Option value="expired">Expired</Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      Cessation Type
                    </Text>
                    <Select
                      value={cessationType}
                      onChange={setCessationType}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      <Option value="all">All Types</Option>
                      <Option value="temporary">Temporary</Option>
                      <Option value="permanent">Permanent</Option>
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

        {/* 2. Executive Cessation Summary (KPI Tiles) */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Executive Cessation Summary</Title>
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
            Instant awareness of enforcement impact and risk
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
                      Active Cessation Orders
                    </Text>
                  }
                  value={kpiData.activeCessations}
                  prefix={<StopOutlined style={{ color: token.colorError }} />}
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
                      Temporary
                    </Text>
                  }
                  value={kpiData.temporary}
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
                      Permanent
                    </Text>
                  }
                  value={kpiData.permanent}
                  prefix={<StopOutlined style={{ color: token.colorError }} />}
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
                      Under Appeal
                    </Text>
                  }
                  value={kpiData.underAppeal}
                  prefix={<AuditOutlined style={{ color: token.colorWarning }} />}
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
                  border: `1px solid #cf1322`,
                  borderRadius: 8
                }}
              >
                <Statistic
                  title={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Overdue / Unresolved
                    </Text>
                  }
                  value={kpiData.overdueUnresolved}
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
                      Lifted (Resolved)
                    </Text>
                  }
                  value={kpiData.liftedResolved}
                  prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
                  valueStyle={{ 
                    color: '#3f8600',
                    fontSize: 24,
                    fontWeight: 600
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 3. Cessation Volume & Trend Analysis */}
        <Card 
          title={
            <Space>
              <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Cessation Volume & Trend Analysis</Title>
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
              message="Trend Analysis Questions"
              description="Visualizations answer: Are cessations increasing? Are specific violations driving enforcement? Is resolution keeping pace with issuance?"
              type="info"
              icon={<BarChartOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Line Chart: Cessations Issued Over Time</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">Chart visualization would appear here</Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" style={{ textAlign: 'center', background: token.colorBgContainer }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Bar Chart: Cessations by Violation Category</Text>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">Chart visualization would appear here</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 4. Status-Based Cessation Breakdown */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Status-Based Cessation Breakdown</Title>
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
              message="Read-Only Status Summary"
              description="Important Rule: No enforcement actions or modifications are available in this overview module."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Tabs defaultActiveKey="active">
              <TabPane 
                tab={
                  <Badge count={kpiData.activeCessations} size="small">
                    <span>Active</span>
                  </Badge>
                } 
                key="active"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Number of Cases" value={kpiData.activeCessations} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Duration" value="45.2" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="27.1" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.liftedResolved} size="small">
                    <span>Lifted</span>
                  </Badge>
                } 
                key="lifted"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Number of Cases" value={kpiData.liftedResolved} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Duration" value="38.5" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="72.9" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.underAppeal} size="small">
                    <span>Under Appeal</span>
                  </Badge>
                } 
                key="appeal"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Number of Cases" value={kpiData.underAppeal} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Duration" value="62.3" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="3.7" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
              <TabPane 
                tab={
                  <Badge count={kpiData.overdueUnresolved} size="small">
                    <span>Overdue / Escalated</span>
                  </Badge>
                } 
                key="overdue"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic title="Number of Cases" value={kpiData.overdueUnresolved} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Average Duration" value="78.5" suffix="days" />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic title="Percentage of Total" value="2.5" suffix="%" />
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Space>
        </Card>

        {/* 5. Compliance & Duration Monitoring Panel */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: token.colorWarning, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Compliance & Duration Monitoring</Title>
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
              message="Legal Defensibility & Timely Follow-Up"
              description="Visual indicators: Green = within compliance period, Yellow = nearing deadline, Red = overdue or escalated. Supports legal defensibility and timely follow-up."
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
                        Average Cessation Duration
                      </Text>
                    }
                    value="42.8"
                    suffix="days"
                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid #cf1322` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Overdue Beyond Deadline
                      </Text>
                    }
                    value={kpiData.overdueUnresolved}
                    valueStyle={{ color: '#cf1322', fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Repeat Cessation Count
                      </Text>
                    }
                    value="15"
                    suffix="cases"
                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Compliance Resolution Rate
                      </Text>
                    }
                    value="91.2"
                    suffix="%"
                    valueStyle={{ color: '#3f8600', fontSize: 20, fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 6. Violation & Legal Basis Insights */}
        <Card 
          title={
            <Space>
              <AuditOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Violation & Legal Basis Insights</Title>
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
              message="Policy & Legal Grounding"
              description="Ensures cessations are grounded in policy and law, not discretion. Business names masked where required. No raw legal documents shown."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Top Violation Categories" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>Health & Safety Violations</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>32 cases (37%)</Text>
                    </div>
                    <div>
                      <Text strong>Building Code Violations</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>28 cases (32%)</Text>
                    </div>
                    <div>
                      <Text strong>Environmental Violations</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>18 cases (21%)</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Legal Basis References (Aggregated)" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div>
                      <Text strong>Local Ordinance 2023-15</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>45 references</Text>
                    </div>
                    <div>
                      <Text strong>Building Code Section 8.2</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>32 references</Text>
                    </div>
                    <div>
                      <Text strong>Health Code Article 12</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>28 references</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Card size="small" title="Repeat Violation Patterns" style={{ background: token.colorBgContainer }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Analysis shows 15 businesses (anonymized) have received multiple cessation orders. 
                Pattern analysis available for review without exposing business identities.
              </Text>
            </Card>
          </Space>
        </Card>

        {/* 7. Officer Issuance Patterns (Aggregated) */}
        <Card 
          title={
            <Space>
              <TeamOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Officer Issuance Patterns</Title>
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
              description="Restrictions: No reassignment, no action controls, aggregated only. Purpose: Detects irregular patterns without enabling interference."
              type="warning"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Cessations Issued Per Officer:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Average: 8 cessations | Range: 2-15 cessations
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Average Resolution Time:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Per officer: 35-52 days | Department average: 42.8 days
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: token.colorBgContainer }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13 }}>Distribution Across Departments:</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Enforcement: 45 | Inspections: 28 | Legal: 14
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 8. Cessation Overview Table (Read-Only) */}
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>Cessation Overview Table</Title>
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
              description="Table functions: Sort, filter, paginate. Explicitly excluded: Edit, Lift, Escalate buttons. All enforcement actions must be performed through authorized operational modules."
              type="info"
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={cessationColumns}
              dataSource={[]}
              loading={false}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                showTotal: (total) => `Total ${total} records` 
              }}
              locale={{ emptyText: 'No cessation orders available for the selected filters' }}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedRow ? [selectedRow] : [],
                onSelect: (record) => setSelectedRow(record.id)
              }}
            />
          </Space>
        </Card>

        {/* 9. Cessation Drill-Down (Summary View Only) */}
        {selectedRow && (
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                <Title level={4} style={{ margin: 0 }}>Cessation Order Summary View</Title>
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
                description="No enforcement or modification actions available. This maintains chain-of-custody integrity. All viewable information is read-only."
                type="warning"
                icon={<SafetyCertificateOutlined />}
              />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Linked Violation History">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Violation #V-2024-001</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Health & Safety | Issued: 2024-01-10
                        </Text>
                      </div>
                      <div>
                        <Text strong>Violation #V-2024-002</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Building Code | Issued: 2024-01-12
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Inspection Timeline">
                    <Timeline>
                      <Timeline.Item color="blue">
                        <Text strong>Initial Inspection</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-08 09:00 AM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="orange">
                        <Text strong>Follow-up Inspection</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-12 02:30 PM
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="red">
                        <Text strong>Cessation Issued</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-15 11:00 AM
                        </Text>
                      </Timeline.Item>
                    </Timeline>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="Officer Actions & Timestamps">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Officer A - Issued Cessation</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-15 11:00 AM
                        </Text>
                      </div>
                      <div>
                        <Text strong>Officer B - Reviewed Appeal</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          2024-01-20 03:45 PM
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="Appeal Status and Outcome">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div>
                        <Text strong>Status:</Text> <Tag color="orange">Under Review</Tag>
                      </div>
                      <div>
                        <Text strong>Appeal Filed:</Text> 2024-01-18
                      </div>
                      <div>
                        <Text strong>Expected Resolution:</Text> 2024-02-15
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Card size="small" title="Compliance Notes (Read-Only)">
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Business has been notified and given 30 days to comply. Follow-up inspection scheduled for 2024-02-15. 
                  All compliance actions are tracked and logged in the operational system.
                </Text>
              </Card>
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
                <Text strong>Overdue cessations: {kpiData.overdueUnresolved} cases beyond deadline</Text>
              } />
              <Badge status="warning" text={
                <Text>Repeated cessations detected for same business (anonymized): 3 cases</Text>
              } />
              <Badge status="warning" text={
                <Text>High-risk violation clusters identified in Zone 2 and Zone 5</Text>
              } />
              <Badge status="warning" text={
                <Text>Appeals exceeding resolution time: 2 cases</Text>
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
                      <li><Text strong>PDF (Summary Reports):</Text> For legal review and presentations</li>
                      <li><Text strong>CSV (Aggregated Analytics):</Text> For data analysis</li>
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
              message="Audit Support"
              description="Supports audits, legal review, and transparency. All export actions are logged with full details to ensure accountability."
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
                This module provides read-only oversight of cessation orders. All issuance, modification, and lifting actions must be performed through authorized enforcement modules. 
                Access to this module is logged and monitored for security, compliance, and legal defensibility purposes.
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
