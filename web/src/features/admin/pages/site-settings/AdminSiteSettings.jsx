import { Grid, Typography, Card, Row, Col, Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import AdminLayout from '../../components/AdminLayout'
import useSiteSettings from './hooks/useSiteSettings'
import { SITE_SETTINGS_MENU_ITEMS } from './constants/siteSettings.constants.js'
import SiteSettingsOverviewTab from './components/SiteSettingsOverviewTab'
import AdminAnnouncements from '../AdminAnnouncements'
import MaintenanceDesktopView from '../maintenance/MaintenanceDesktopView'
import MaintenanceMobileView from '../maintenance/MaintenanceMobileView'
import { PermitFormsDesktopView, PermitFormsMobileView } from '../permit-forms'
import { useMaintenance } from '../maintenance/hooks'
import { getServicesHealth, getAllAuditLogsAdmin } from '../../services'
import { useState, useEffect } from 'react'

const { Text } = Typography

export default function AdminSiteSettings() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { current, approvals, openRequestModalOrBlock } = useMaintenance()
  const [services, setServices] = useState([])
  const [dependencies, setDependencies] = useState(null)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [recentLogs, setRecentLogs] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getServicesHealth()
      .then((res) => {
        if (!cancelled) {
          setServices(res?.services || [])
          setDependencies(res?.dependencies ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServices([])
          setDependencies(null)
        }
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getAllAuditLogsAdmin({ limit: 10, eventType: 'maintenance_mode' })
      .then((res) => {
        if (!cancelled) setRecentLogs(res?.logs || [])
      })
      .catch(() => {
        if (!cancelled) setRecentLogs([])
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const {
    tabKey,
    showMenu,
    handleMenuSelect,
    handleBackToMenu,
  } = useSiteSettings()

  const IconMenu = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 24
    }}>
      <Row gutter={[24, 24]} style={{ width: '100%', maxWidth: 800 }}>
        {SITE_SETTINGS_MENU_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Col xs={24} sm={12} md={8} key={item.key}>
              <Card
                hoverable
                onClick={() => handleMenuSelect(item.key)}
                style={{
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  marginBottom: 16
                }}>
                  <Icon style={{ fontSize: 32 }} />
                </div>
                <Text strong>{item.label}</Text>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )

  return (
    <AdminLayout
      pageTitle="Site Settings"
      pageIcon={<SettingOutlined />}
    >
      <div
        style={
          isMobile
            ? { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {showMenu ? (
          <IconMenu />
        ) : tabKey === 'permit-forms' ? (
          isMobile
            ? <PermitFormsMobileView onBackToMenu={handleBackToMenu} />
            : <PermitFormsDesktopView onBackToMenu={handleBackToMenu} />
        ) : tabKey === 'overview' ? (
          <SiteSettingsOverviewTab
            current={current}
            approvals={approvals}
            services={services}
            dependencies={dependencies}
            servicesLoading={servicesLoading}
            recentLogs={recentLogs}
            recentLoading={recentLoading}
            setTabKey={() => {}}
            onOpenRequestModal={openRequestModalOrBlock}
          />
        ) : tabKey === 'announcements' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Button onClick={handleBackToMenu} type="text">← Back</Button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AdminAnnouncements embedded />
            </div>
          </div>
        ) : isMobile ? (
          <MaintenanceMobileView onBackToMenu={handleBackToMenu} />
        ) : (
          <MaintenanceDesktopView onBackToMenu={handleBackToMenu} />
        )}
      </div>
    </AdminLayout>
  )
}
