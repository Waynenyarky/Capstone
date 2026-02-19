import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Grid, Tabs, Typography, Alert } from 'antd'
import { SafetyCertificateOutlined, ReloadOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import ExportLogsModal from '../components/ExportLogsModal'
import { fetchTamperStats } from '@/features/admin/services/tamperService'
import AuditTamperDesktopView from './auditTamper/AuditTamperDesktopView'
import { AUDIT_TAMPER_NAV_ITEMS } from './auditTamper/AuditTamperDesktopView'
import AuditTamperOverviewTab from './auditTamper/AuditTamperOverviewTab'
import AuditTamperIncidentsTab from './auditTamper/AuditTamperIncidentsTab'
import SecurityHistoryTab from './auditTamper/SecurityHistoryTab'
import AuditTamperInfoModal from './auditTamper/AuditTamperInfoModal'

const { Text } = Typography

const TAB_ITEMS = AUDIT_TAMPER_NAV_ITEMS.map(({ key, label }) => ({ key, label }))

export default function AdminAuditTamper() {
  const [searchParams] = useSearchParams()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [tabKey, setTabKey] = useState('overview')
  const [infoOpen, setInfoOpen] = useState(false)
  const [exportLogsOpen, setExportLogsOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'incidents' || tab === 'history') setTabKey(tab)
  }, [searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const statsRes = await fetchTamperStats()
      if (statsRes?.stats) setStats(statsRes.stats)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err?.message || 'Failed to load tamper data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action: evAction, tab } = event?.detail || {}
      if (evAction === 'setTab' && (tab === 'overview' || tab === 'incidents' || tab === 'history')) {
        setTabKey(tab)
      } else if (evAction === 'refresh') {
        load()
      } else if (evAction === 'openExportLogs') {
        setExportLogsOpen(true)
      }
    }
    window.addEventListener('devtools:audittamper', handler)
    return () => window.removeEventListener('devtools:audittamper', handler)
  }, [load])

  const handleGoToIncidents = useCallback(() => setTabKey('incidents'), [])

  const tabChildren = {
    overview: <AuditTamperOverviewTab stats={stats} onGoToIncidents={handleGoToIncidents} />,
    incidents: (
      <AuditTamperIncidentsTab
        onRefresh={load}
        initialIncidentId={searchParams.get('incidentId') || null}
      />
    ),
    history: <SecurityHistoryTab />,
  }

  const mainHeaderActions = (
    <>
      {lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
      <Button icon={<ReloadOutlined />} onClick={load} loading={loading} aria-label="Refresh" />
      <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="About" />
    </>
  )

  const openCount = stats?.open ?? 0
  const showAlert = openCount > 0

  if (loading && !stats) {
    return (
      <AdminLayout
        pageTitle="Security"
        pageIcon={<SafetyCertificateOutlined />}
        headerActions={mainHeaderActions}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <span style={{ fontSize: 14, color: '#999' }}>Loading…</span>
        </div>
      </AdminLayout>
    )
  }

  const content = (
    <>
      {showAlert && (
        <Alert
          type="warning"
          message={`${openCount} open tamper incident(s) require attention.`}
          description="Switch to the Incidents tab to acknowledge, contain, or resolve them."
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={handleGoToIncidents}>
              Go to Incidents
            </Button>
          }
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          action={<Button onClick={load}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      {isMobile ? (
        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={TAB_ITEMS.map(({ key, label }) => ({ key, label, children: tabChildren[key] }))}
        />
      ) : (
        <AuditTamperDesktopView
          tabKey={tabKey}
          setTabKey={setTabKey}
          tabChildren={tabChildren}
          headerActions={
            tabKey === 'history' ? (
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => setExportLogsOpen(true)}>
                Export
              </Button>
            ) : null
          }
        />
      )}
      <AuditTamperInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <ExportLogsModal
        open={exportLogsOpen}
        onClose={() => setExportLogsOpen(false)}
        exportType="security"
      />
    </>
  )

  return (
    <AdminLayout
      pageTitle="Security"
      pageIcon={<SafetyCertificateOutlined />}
      headerActions={mainHeaderActions}
    >
      <div
        style={
          isMobile
            ? { overflow: 'auto' }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {content}
      </div>
    </AdminLayout>
  )
}
