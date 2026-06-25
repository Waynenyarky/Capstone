import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Typography, Space, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardOutlined, ToolOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons'
import DashboardInfoModal from './DashboardInfoModal'
import AdminLayout from '../components/AdminLayout'
import { getMaintenanceCurrent } from '@/features/admin/services/maintenanceService'
import { getFees, getFeeGroups, getPenaltyRules } from '@/features/admin/services/feeService'
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
  const [feeStats, setFeeStats] = useState({ fees: 0, feeGroups: 0, penaltyRules: 0 })
  const [feeTrends, setFeeTrends] = useState({ fees: null, feeGroups: null, penaltyRules: null })

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

      // Load fee stats
      const [fees, feeGroups, penaltyRules] = await Promise.all([
        getFees({ _t: Date.now() }).catch(err => {
          console.error('Failed to load fees:', err)
          return []
        }),
        getFeeGroups({ _t: Date.now() }).catch(err => {
          console.error('Failed to load fee groups:', err)
          return []
        }),
        getPenaltyRules({ _t: Date.now() }).catch(err => {
          console.error('Failed to load penalty rules:', err)
          return []
        }),
      ])
      setFeeStats({
        fees: fees.length,
        feeGroups: feeGroups.length,
        penaltyRules: penaltyRules.length,
      })

      // Calculate trends (items created in last 30 days)
      const daysSince = 30
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - daysSince)

      const newTrends = { fees: null, feeGroups: null, penaltyRules: null }

      const recentlyCreatedFees = fees.filter(f => f.createdAt && new Date(f.createdAt) >= daysAgo)
      if (recentlyCreatedFees.length > 0) {
        newTrends.fees = `+${recentlyCreatedFees.length}`
      }

      const recentlyCreatedFeeGroups = feeGroups.filter(fg => fg.createdAt && new Date(fg.createdAt) >= daysAgo)
      if (recentlyCreatedFeeGroups.length > 0) {
        newTrends.feeGroups = `+${recentlyCreatedFeeGroups.length}`
      }

      const recentlyCreatedPenaltyRules = penaltyRules.filter(pr => pr.createdAt && new Date(pr.createdAt) >= daysAgo)
      if (recentlyCreatedPenaltyRules.length > 0) {
        newTrends.penaltyRules = `+${recentlyCreatedPenaltyRules.length}`
      }

      setFeeTrends(newTrends)

      // Calculate total recent changes
      const totalRecentChanges = recentlyCreatedFees.length + recentlyCreatedFeeGroups.length + recentlyCreatedPenaltyRules.length
      setFeeStats(prev => ({ ...prev, recentChanges: totalRecentChanges }))
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
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
                { label: 'Fee Groups', value: `${feeStats.feeGroups}`, trend: feeTrends.feeGroups },
                { label: 'Penalty Rules', value: `${feeStats.penaltyRules}`, trend: feeTrends.penaltyRules },
                { label: 'Recent Changes', value: `${feeStats.recentChanges || 0}`, trend: feeStats.recentChanges > 0 ? `+${feeStats.recentChanges}` : null },
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
