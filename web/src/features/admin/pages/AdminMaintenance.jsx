import { useEffect, useState, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { App, Button, Grid, Typography, Card, Row, Col } from 'antd'
import { SettingOutlined, ReloadOutlined, InfoCircleOutlined, DashboardOutlined, NotificationOutlined, ToolOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import AdminAnnouncements from './AdminAnnouncements'
import {
  requestMaintenance,
  getMaintenanceCurrent,
  getMaintenanceApprovals,
  approveMaintenance,
  undoVote,
  cancelApprovedMaintenance,
  getMaintenancePublicStatus,
} from '../services'
import { useNotifier } from '@/shared/notifications.js'
import { useAdminStepUp } from '../hooks/useAdminStepUp'
import RequestMaintenanceModal from './maintenance/components/RequestMaintenanceModal'
import { REASON_PRESET_OTHER, REASON_PRESET_OPTIONS } from './maintenance/constants/maintenance.constants.js'
import MaintenanceDesktopView from './maintenance/MaintenanceDesktopView'
import MaintenanceMobileView from './maintenance/MaintenanceMobileView'
import MaintenanceInfoModal from './maintenance/components/MaintenanceInfoModal'

const MENU_ITEMS = [
  { key: 'overview', label: 'Overview', icon: DashboardOutlined },
  { key: 'announcements', label: 'Announcements', icon: NotificationOutlined },
  { key: 'requests', label: 'Maintenance', icon: ToolOutlined },
]

const { Text } = Typography

export default function AdminMaintenance() {
  const { modal } = App.useApp()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()
  const [form] = Form.useForm()
  const [current, setCurrent] = useState(null)
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestModalOptions, setRequestModalOptions] = useState({})
  const [infoOpen, setInfoOpen] = useState(false)
  const [tabKey, setTabKey] = useState('overview')
  const [showMenu, setShowMenu] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { success, error } = useNotifier()
  const normalizedTabKey = tabKey === 'history' ? 'requests' : tabKey

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, approvalsRes] = await Promise.all([
        getMaintenanceCurrent(),
        getMaintenanceApprovals(),
      ])
      let maintenance = statusRes?.maintenance || null
      if (!maintenance) {
        const publicStatus = await getMaintenancePublicStatus()
        if (publicStatus?.active) {
          maintenance = {
            isActive: true,
            message: publicStatus.message || '',
            expectedResumeAt: publicStatus.expectedResumeAt || null,
            activatedAt: publicStatus.activatedAt || null,
          }
        }
      }
      setCurrent(maintenance)
      setApprovals(
        (approvalsRes?.approvals || []).filter((a) => a.requestType === 'maintenance_mode')
      )
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Load maintenance data failed', err)
      error(err, 'Failed to load maintenance data')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => {
    load()
    const intervalId = window.setInterval(load, 30000)
    return () => {
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [load])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action: evAction, tab, prefill } = event?.detail || {}
      if (evAction === 'setTab' && (tab === 'overview' || tab === 'announcements' || tab === 'requests' || tab === 'history')) {
        setTabKey(tab === 'history' ? 'requests' : tab)
      } else if (evAction === 'openRequestModal') {
        setRequestModalOpen(true)
        if (prefill === 'enable') {
          setTimeout(() => {
            form.setFieldsValue({
              action: 'enable',
              whenToStart: 'now',
              reasonPreset: 'scheduled',
              reason: undefined,
              message: undefined,
            })
          }, 100)
        } else if (prefill === 'invalid') {
          setTimeout(() => {
            form.setFieldsValue({
              action: 'enable',
              whenToStart: undefined,
              reasonPreset: REASON_PRESET_OTHER,
              reason: '',
              message: '',
            })
          }, 100)
        }
      } else if (evAction === 'selectFirstPending') {
        setTabKey('requests')
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('devtools:maintenance-select-first'))
        }, 100)
      }
    }
    window.addEventListener('devtools:maintenance', handler)
    return () => window.removeEventListener('devtools:maintenance', handler)
  }, [form])

  const handleSubmit = useCallback(
    async (values) => {
      try {
        let reason = ''
        if (values.reasonPreset === REASON_PRESET_OTHER) {
          reason = values.reason || ''
        } else if (values.reasonPreset) {
          const preset = REASON_PRESET_OPTIONS.find((o) => o.value === values.reasonPreset)
          reason = preset?.label || ''
        }
        const payload = {
          action: values.action,
          reason,
          message: values.message || '',
        }
        if (values.expectedResumeAt && typeof values.expectedResumeAt.toISOString === 'function') {
          payload.expectedResumeAt = values.expectedResumeAt.toISOString()
        }
        if (values.whenToStart === 'scheduled' && values.scheduledStartAt && typeof values.scheduledStartAt.toISOString === 'function') {
          payload.scheduledStartAt = values.scheduledStartAt.toISOString()
        }
        await runWithStepUp(async (stepUpToken) => {
          await requestMaintenance(payload, { stepUpToken })
        })
        success('Maintenance request submitted for approval')
        form.resetFields()
        setRequestModalOpen(false)
        await load()
      } catch (err) {
        if (err?.message !== 'Step-up cancelled') {
          console.error('Maintenance request failed', err)
          error(err, 'Failed to submit request')
        }
      } finally {
        setSubmitting(false)
      }
    },
    [form, success, error, load, runWithStepUp]
  )

  const handleConfirmSubmit = useCallback(async () => {
    setSubmitting(true)
    try {
      const values = await form.validateFields()
      await handleSubmit(values)
    } catch {
      setSubmitting(false)
    }
  }, [form, handleSubmit])

  const handleApprove = useCallback(
    async (approvalId, approved, comment = '') => {
      try {
        await runWithStepUp(async (stepUpToken) => {
          await approveMaintenance(approvalId, approved, comment, { stepUpToken })
        })
        success(approved ? 'Approved maintenance change' : 'Rejected maintenance change')
        await load()
      } catch (err) {
        if (err?.message !== 'Step-up cancelled') {
          console.error('Approve maintenance failed', err)
          error(err, 'Failed to process approval')
        }
      }
    },
    [success, error, load, runWithStepUp]
  )

  const handleCancelApproved = useCallback(
    async (approvalId) => {
      try {
        await runWithStepUp(async (stepUpToken) => {
          await cancelApprovedMaintenance(approvalId, { stepUpToken })
        })
        success('Cancellation request submitted for approval')
        await load()
      } catch (err) {
        if (err?.message !== 'Step-up cancelled') {
          console.error('Cancel approved maintenance failed', err)
          error(err, 'Failed to request cancellation')
        }
      }
    },
    [success, error, load, runWithStepUp]
  )

  const headerActions = (
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

  const handleMenuSelect = (key) => {
    setTabKey(key)
    setShowMenu(false)
  }

  const handleBackToMenu = () => {
    setShowMenu(true)
  }

  const IconMenu = () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      padding: 24 
    }}>
      <Text strong style={{ fontSize: 20, marginBottom: 24 }}>Site Settings</Text>
      <Row gutter={[24, 24]} style={{ width: '100%', maxWidth: 800 }}>
        {MENU_ITEMS.map((item) => {
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
      headerActions={headerActions}
    >
      <div
        style={
          isMobile
            ? { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {isMobile ? (
          showMenu ? (
            <IconMenu />
          ) : (
            <MaintenanceMobileView
              tabKey={normalizedTabKey}
              setTabKey={setTabKey}
              current={current}
              loading={loading}
              approvals={approvals}
              onApprove={handleApprove}
              onUndoVote={undoVote}
              onCancelApproved={handleCancelApproved}
              onRefresh={load}
              onOpenRequestModal={(options) => {
                setRequestModalOptions(options || {})
                setRequestModalOpen(true)
              }}
              announcementsTab={<AdminAnnouncements embedded />}
              onBackToMenu={handleBackToMenu}
              infoOpen={infoOpen}
              setInfoOpen={setInfoOpen}
            />
          )
        ) : (
          showMenu ? (
            <IconMenu />
          ) : (
            <MaintenanceDesktopView
              tabKey={normalizedTabKey}
              setTabKey={setTabKey}
              current={current}
              loading={loading}
              approvals={approvals}
              onApprove={handleApprove}
              onUndoVote={undoVote}
              onCancelApproved={handleCancelApproved}
              onRefresh={load}
              onOpenRequestModal={(options) => {
                setRequestModalOptions(options || {})
                setRequestModalOpen(true)
              }}
              headerActions={headerActions}
              announcementsTab={<AdminAnnouncements embedded />}
              onBackToMenu={handleBackToMenu}
              infoOpen={infoOpen}
              setInfoOpen={setInfoOpen}
            />
          )
        )}
      </div>

      <RequestMaintenanceModal
        open={requestModalOpen}
        onCancel={() => setRequestModalOpen(false)}
        form={form}
        forceScheduleMode={requestModalOptions.forceScheduleMode}
        onSubmit={handleConfirmSubmit}
        submitting={submitting}
        maintenanceActive={current?.isActive === true}
        isMobile={isMobile}
      />

      <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      {stepUpModal}
    </AdminLayout>
  )
}
