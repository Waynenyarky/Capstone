import React, { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Typography, Space, Tag, List, message, theme, Button } from 'antd'
import { Link } from 'react-router-dom'
import {
  DashboardOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  FileTextOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import DashboardInfoModal from './DashboardInfoModal'
import dayjs from 'dayjs'
import AdminLayout from '../components/AdminLayout'
import { TamperIncidentsPanel } from '@/features/admin'
import { getApprovals } from '@/features/admin/services/approvalService'
import { fetchTamperStats } from '@/features/admin/services/tamperService'
import { getFormGroupStats } from '@/features/admin/services/formDefinitionService'
import { getMaintenanceCurrent } from '@/features/admin/services/maintenanceService'
import { get } from '@/lib/http.js'

const { Text } = Typography

const STAT_CARD_COLORS = {
  pending: '#1890ff',
  tamper: '#52c41a',
  tamperAlert: '#ff4d4f',
  forms: '#722ed1',
}

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
  const [lastUpdated, setLastUpdated] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

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
      setLastUpdated(new Date())
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
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => {
    loadKpis()
  }, [loadKpis])

  useEffect(() => {
    loadRecentActivity()
  }, [loadRecentActivity])

  useEffect(() => {
    const onRefresh = () => {
      loadKpis()
      loadRecentActivity()
      setLastUpdated(new Date())
    }
    window.addEventListener('admin-dashboard-refresh', onRefresh)
    return () => window.removeEventListener('admin-dashboard-refresh', onRefresh)
  }, [loadKpis, loadRecentActivity])

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadKpis(), loadRecentActivity()])
    setLastUpdated(new Date())
  }, [loadKpis, loadRecentActivity])

  const formCount = formStats?.activated != null ? Number(formStats.activated) + Number(formStats.deactivated || 0) + Number(formStats.retired || 0) : null
  const hasMaintenance = maintenanceStatus?.active === true || maintenanceStatus?.status === 'active'
  const { token } = theme.useToken()

  const statCards = [
    {
      key: 'pending',
      label: 'Pending requests',
      value: pendingRequests,
      icon: CheckCircleOutlined,
      to: '/admin/requests',
      linkable: true,
    },
    {
      key: 'tamper',
      label: 'Open tamper incidents',
      value: openTamper,
      icon: SafetyCertificateOutlined,
      to: '/admin/security',
      colorKey: openTamper > 0 ? 'tamperAlert' : 'tamper',
      linkable: true,
    },
    {
      key: 'forms',
      label: 'Form groups',
      value: formCount != null ? formCount : '—',
      icon: FileTextOutlined,
      to: '/admin/form-definitions',
      linkable: formCount != null,
    },
  ]

  const mainHeaderActions = (
    <>
      {lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
      <Button
        icon={<ReloadOutlined />}
        onClick={handleRefresh}
        loading={kpiLoading || recentActivityLoading}
        aria-label="Refresh"
      />
      <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="About" />
    </>
  )

  return (
    <AdminLayout
      pageTitle="Admin Dashboard"
      pageIcon={<DashboardOutlined />}
      headerActions={mainHeaderActions}
    >
      <div style={{ padding: 16 }}>
        <Row gutter={[16, 16]}>
          {/* KPI cards - same style as user management Overview tab */}
          {statCards.map(({ key, label, value, icon: Icon, to, colorKey, linkable }) => (
            <Col xs={24} sm={12} md={8} key={key}>
              <Card size="small" loading={kpiLoading} style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: token.borderRadius,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: STAT_CARD_COLORS[colorKey || key] || token.colorPrimary,
                        color: '#fff',
                      }}
                    >
                      <Icon style={{ fontSize: 18 }} />
                    </span>
                    {to && linkable ? (
                      <Link to={to}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
                      </Link>
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}

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
      <DashboardInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </AdminLayout>
  )
}
