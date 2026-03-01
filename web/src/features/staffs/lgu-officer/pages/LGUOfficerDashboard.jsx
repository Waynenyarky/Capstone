import React, { useState, useEffect } from 'react'
import { Card, Typography, Space, Statistic, Skeleton, Grid, theme, Result } from 'antd'
import { Link } from 'react-router-dom'
import { DashboardOutlined, FileTextOutlined, UserOutlined, ClockCircleOutlined, SmileOutlined } from '@ant-design/icons'
import { StaffLayout } from '../../components'
import { get } from '@/lib/http.js'

const { Title, Text } = Typography

export default function LGUOfficerDashboard() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/api/lgu-officer/permit-applications?status=submitted,under_review&limit=1')
      .then(res => {
        const total = res?.data?.pagination?.total ?? res?.pagination?.total ?? res?.total ?? 0
        setStats({ pendingReview: total })
      })
      .catch(() => setStats({ pendingReview: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <StaffLayout pageTitle="Dashboard" pageIcon={<DashboardOutlined />}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: screens.md ? 'repeat(3, 1fr)' : '1fr', gap: 16, maxWidth: 800 }}>
          <Link to="/staff/applications" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : stats?.pendingReview === 0 ? (
                <Result icon={<SmileOutlined />} title="All caught up!" subTitle="No pending applications to review." style={{ padding: '12px 0' }} />
              ) : (
                <>
                  <Statistic
                    title="Pending Applications"
                    value={stats?.pendingReview ?? 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: token.colorWarning }}
                  />
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                    Applications waiting for your review
                  </Text>
                </>
              )}
            </Card>
          </Link>

          <Link to="/staff/applications" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Space>
                  <FileTextOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                  <Title level={5} style={{ margin: 0 }}>Review Applications</Title>
                </Space>
                <Text type="secondary">Review and process permit applications</Text>
              </Space>
            </Card>
          </Link>

          <Link to="/settings-profile" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Space>
                  <UserOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                  <Title level={5} style={{ margin: 0 }}>Profile & Settings</Title>
                </Space>
                <Text type="secondary">Manage your account settings</Text>
              </Space>
            </Card>
          </Link>
        </div>
      </div>
    </StaffLayout>
  )
}
