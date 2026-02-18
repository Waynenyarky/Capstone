import React, { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Typography, Spin, Space, Tag, List, message } from 'antd'
import { Link } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FormOutlined,
  DollarOutlined,
  AccountBookOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  ToolOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AdminLayout from '../components/AdminLayout'
import { TamperIncidentsPanel } from '@/features/admin'
import { getApprovals } from '@/features/admin/services/approvalService'
import { fetchTamperStats } from '@/features/admin/services/tamperService'
import { getFormGroupStats } from '@/features/admin/services/formDefinitionService'
import { getMaintenanceCurrent } from '@/features/admin/services/maintenanceService'
import { get } from '@/lib/http.js'

const { Text } = Typography

const SHORTCUTS = [
  { key: 'users', label: 'User Management', to: '/admin/users', icon: <TeamOutlined /> },
  { key: 'requests', label: 'Requests', to: '/admin/requests', icon: <CheckCircleOutlined /> },
  { key: 'form-definitions', label: 'Form Definitions', to: '/admin/form-definitions', icon: <FormOutlined /> },
  { key: 'fee-configuration', label: 'Fee Configuration', to: '/admin/fee-configuration', icon: <DollarOutlined /> },
  { key: 'finance', label: 'Finance', to: '/admin/finance', icon: <AccountBookOutlined /> },
  { key: 'audit-tamper', label: 'Audit Tamper', to: '/admin/audit-tamper', icon: <SafetyCertificateOutlined /> },
  { key: 'activity', label: 'Admin Activity', to: '/admin/activity', icon: <HistoryOutlined /> },
  { key: 'maintenance', label: 'Maintenance', to: '/admin/maintenance', icon: <ToolOutlined /> },
]

const ACTION_COLORS = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  approve: 'cyan',
  reject: 'orange',
  login: 'purple',
  profile_update: 'blue',
  admin_approval: 'cyan',
  other: 'default',
}

export default function AdminDashboard() {
  const [kpiLoading, setKpiLoading] = useState(true)
  const [recentActivityLoading, setRecentActivityLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [openTamper, setOpenTamper] = useState(0)
  const [formStats, setFormStats] = useState(null)
  const [maintenanceStatus, setMaintenanceStatus] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])

  const loadKpis = useCallback(async () => {
    setKpiLoading(true)
    try {
      const [approvalsRes, tamperRes, formsRes, maintenanceRes] = await Promise.allSettled([
        getApprovals({ status: 'pending' }),
        fetchTamperStats(),
        getFormGroupStats(),
        getMaintenanceCurrent(),
      ])
      if (approvalsRes.status === 'fulfilled') {
        const list = approvalsRes.value?.approvals ?? []
        setPendingRequests(Array.isArray(list) ? list.length : 0)
      }
      if (tamperRes.status === 'fulfilled') {
        const stats = tamperRes.value?.stats ?? tamperRes.value
        const open = (stats?.open ?? 0) + (stats?.acknowledged ?? 0)
        setOpenTamper(typeof open === 'number' ? open : (stats?.open ?? 0))
      }
      if (formsRes.status === 'fulfilled') {
        setFormStats(formsRes.value ?? null)
      }
      if (maintenanceRes.status === 'fulfilled') {
        setMaintenanceStatus(maintenanceRes.value ?? null)
      }
    } catch {
      message.error('Failed to load dashboard stats')
    } finally {
      setKpiLoading(false)
    }
  }, [])

  const loadRecentActivity = useCallback(async () => {
    setRecentActivityLoading(true)
    try {
      const res = await get('/api/admin/monitoring/audit-logs?page=1&limit=10')
      const logs = res?.data?.logs ?? res?.data ?? []
      setRecentLogs(Array.isArray(logs) ? logs : [])
    } catch {
      setRecentLogs([])
    } finally {
      setRecentActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKpis()
  }, [loadKpis])

  useEffect(() => {
    loadRecentActivity()
  }, [loadRecentActivity])

  const formCount = formStats?.activated != null ? Number(formStats.activated) + Number(formStats.deactivated || 0) + Number(formStats.retired || 0) : null
  const hasMaintenance = maintenanceStatus?.active === true || maintenanceStatus?.status === 'active'

  return (
    <AdminLayout pageTitle="Admin Dashboard" pageIcon={<DashboardOutlined />}>
      <div style={{ padding: 16 }}>
        <Row gutter={[16, 16]}>
          {/* KPI cards */}
          <Col xs={24} sm={12} lg={8}>
            <Card size="small" loading={kpiLoading}>
              <Space align="center">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div>
                  <Text type="secondary">Pending requests</Text>
                  <div>
                    <Link to="/admin/requests">
                      <Text strong style={{ fontSize: 20 }}>{pendingRequests}</Text>
                    </Link>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card size="small" loading={kpiLoading}>
              <Space align="center">
                <SafetyCertificateOutlined style={{ fontSize: 24, color: openTamper > 0 ? '#ff4d4f' : '#52c41a' }} />
                <div>
                  <Text type="secondary">Open tamper incidents</Text>
                  <div>
                    <Link to="/admin/audit-tamper">
                      <Text strong style={{ fontSize: 20 }}>{openTamper}</Text>
                    </Link>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card size="small" loading={kpiLoading}>
              <Space align="center">
                <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div>
                  <Text type="secondary">Form groups</Text>
                  <div>
                    {formCount != null ? (
                      <Link to="/admin/form-definitions">
                        <Text strong style={{ fontSize: 20 }}>{formCount}</Text>
                      </Link>
                    ) : (
                      <Text strong style={{ fontSize: 20 }}>—</Text>
                    )}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Shortcuts */}
          <Col xs={24}>
            <Card size="small" title="Quick links">
              <Row gutter={[12, 12]}>
                {SHORTCUTS.map(({ key, label, to, icon }) => (
                  <Col xs={12} sm={8} md={6} key={key}>
                    <Link to={to} style={{ display: 'block' }}>
                      <Card size="small" hoverable style={{ textAlign: 'center' }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <span style={{ fontSize: 20 }}>{icon}</span>
                          <Text ellipsis style={{ fontSize: 13 }}>{label}</Text>
                          <ArrowRightOutlined style={{ fontSize: 12, color: '#999' }} />
                        </Space>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* Optional maintenance status */}
          {hasMaintenance && (
            <Col xs={24}>
              <Card size="small" style={{ borderColor: '#faad14', background: '#fffbe6' }}>
                <Space>
                  <ToolOutlined style={{ color: '#faad14' }} />
                  <Text strong>Maintenance mode is active.</Text>
                  <Link to="/admin/maintenance">View maintenance</Link>
                </Space>
              </Card>
            </Col>
          )}

          {/* Recent admin activity */}
          <Col xs={24} md={12}>
            <Card
              size="small"
              title="Recent admin activity"
              extra={<Link to="/admin/activity">View all</Link>}
              loading={recentActivityLoading}
            >
              {!recentActivityLoading && recentLogs.length === 0 ? (
                <Text type="secondary">No recent activity.</Text>
              ) : (
                <List
                  size="small"
                  dataSource={recentLogs}
                  renderItem={(log) => (
                    <List.Item>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={ACTION_COLORS[log.action?.toLowerCase()] || 'default'}>
                            {log.action || '—'}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {log.userEmail || log.userId || '—'}
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

          {/* Tamper / security summary */}
          <Col xs={24} md={12}>
            <TamperIncidentsPanel />
          </Col>
        </Row>
      </div>
    </AdminLayout>
  )
}
