import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Typography, Space, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardOutlined, ToolOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons'
import DashboardInfoModal from './DashboardInfoModal'
import AdminLayout from '../components/AdminLayout'
import { getMaintenanceCurrent } from '@/features/admin/services/maintenanceService'
import DetailCard from '@/shared/components/DetailCard.jsx'
import { useDashboardCmsCards } from './dashboard/hooks/useDashboardCmsCards.js'

const { Text } = Typography

const CARD_COL_PROPS = { xs: 24, md: 12, lg: 8 }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [kpiLoading, setKpiLoading] = useState(true)
  const [maintenanceStatus, setMaintenanceStatus] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const {
    publicAnnouncements,
    staffAnnouncements,
    cmsTotal,
    trends,
    loading: cmsLoading,
    loadCmsCards,
    refresh: refreshCmsCards,
  } = useDashboardCmsCards()

  const loadKpis = useCallback(async () => {
    setKpiLoading(true)
    try {
      const maintenanceRes = await getMaintenanceCurrent()
      if (maintenanceRes) {
        setMaintenanceStatus(maintenanceRes ?? null)
      }
    } catch {
      message.error('Failed to load dashboard stats')
    } finally {
      setKpiLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => {
    loadKpis()
    loadCmsCards()
  }, [loadKpis, loadCmsCards])

  const onRefresh = useCallback(() => {
    loadKpis()
    refreshCmsCards()
    setLastUpdated(new Date())
  }, [loadKpis, refreshCmsCards])

  useEffect(() => {
    window.addEventListener('admin-dashboard-refresh', onRefresh)
    return () => window.removeEventListener('admin-dashboard-refresh', onRefresh)
  }, [onRefresh])

  const hasMaintenance = maintenanceStatus?.active === true || maintenanceStatus?.status === 'active'

  return (
    <AdminLayout
      pageTitle="Admin Dashboard"
      pageIcon={<DashboardOutlined />}
      onRefresh={onRefresh}
      lastUpdated={lastUpdated}
      loading={kpiLoading || cmsLoading}
      infoSlotId="admin-dashboard-info"
      infoModalTitle="About Admin Dashboard"
    >
      <div style={{ padding: 16 }}>
        <Row gutter={[16, 16]}>

          {/* Optional maintenance status */}
          {hasMaintenance && (
            <Col xs={24}>
              <Card size="small" style={{ borderColor: '#faad14', background: '#fffbe6' }}>
                <Space>
                  <ToolOutlined style={{ color: '#faad14' }} />
                  <Text strong>Maintenance mode is active.</Text>
                  <Link to="/admin/site-settings">View site settings</Link>
                </Space>
              </Card>
            </Col>
          )}

          {/* CMS Content Card */}
          <Col {...CARD_COL_PROPS}>
            <DetailCard
              icon={FileTextOutlined}
              title="Content Management"
              details={[
                { label: 'Public Announcements', value: `${publicAnnouncements.length}`, trend: trends?.public },
                { label: 'Staff Announcements', value: `${staffAnnouncements.length}`, trend: trends?.staff },
                { label: 'Recent Changes', value: `${cmsTotal}`, trend: trends?.cms },
              ]}
              onClick={() => navigate('/admin/content-management')}
            />
          </Col>

          {/* Fees Management Card */}
          <Col {...CARD_COL_PROPS}>
            <DetailCard
              icon={DollarOutlined}
              title="Fees Management"
              details={[
                { label: 'Total Fees', value: '12' },
                { label: 'Fee Groups', value: '5' },
                { label: 'Penalty Rules', value: '3' },
              ]}
              onClick={() => navigate('/admin/fees')}
            />
          </Col>
        </Row>
      </div>
      <DashboardInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </AdminLayout>
  )
}
