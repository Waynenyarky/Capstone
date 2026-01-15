/**
 * View Page: LGUOfficerDashboard
 * Main dashboard page for LGU Officer
 * Orchestrates presentation components and hooks
 */
import React from 'react'
import { Row, Col, Card, Typography, Spin, theme, Space, Statistic } from 'antd'
import { 
  SafetyCertificateOutlined, 
  WarningOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import LGUOfficerLayout from '../components/LGUOfficerLayout'
import { useLGUOfficerDashboard } from '../../presentation/hooks/useLGUOfficerDashboard'
import { InspectionsTable } from '../../presentation/components/InspectionsTable'
import { ViolationsPanel } from '../../presentation/components/ViolationsPanel'
import { PermitApplicationsList } from '../../presentation/components/PermitApplicationsList'

const { Title, Paragraph } = Typography

export default function LGUOfficerDashboard() {
  const { token } = theme.useToken()
  const { loading, dashboardData } = useLGUOfficerDashboard()

  return (
    <LGUOfficerLayout pageTitle="LGU Officer Dashboard">
      <div style={{ paddingBottom: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: token.colorPrimary }}>
            LGU Officer Dashboard
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 16, margin: '8px 0 0' }}>
            Manage inspections, violations, and permit applications
          </Paragraph>
        </div>

        {loading && !dashboardData ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Scheduled Inspections"
                    value={dashboardData?.scheduledInspections?.length || 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: token.colorPrimary }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Active Violations"
                    value={dashboardData?.activeViolations?.length || 0}
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Pending Applications"
                    value={dashboardData?.pendingApplications?.length || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <SafetyCertificateOutlined />
                      <span>Scheduled Inspections</span>
                    </Space>
                  }
                >
                  <InspectionsTable
                    inspections={dashboardData?.scheduledInspections || []}
                    loading={loading}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <ViolationsPanel
                  violations={dashboardData?.activeViolations || []}
                  loading={loading}
                />
              </Col>
              <Col xs={24}>
                <PermitApplicationsList
                  applications={dashboardData?.pendingApplications || []}
                  loading={loading}
                />
              </Col>
            </Row>
          </>
        )}
      </div>
    </LGUOfficerLayout>
  )
}
