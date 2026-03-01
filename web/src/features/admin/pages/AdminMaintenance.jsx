import { useEffect, useState, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { App, Button, Grid, Typography } from 'antd'
import { SettingOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import {
  requestMaintenance,
  getMaintenanceCurrent,
  getMaintenanceApprovals,
  approveMaintenance,
  getMaintenancePublicStatus,
} from '../services'
import { useNotifier } from '@/shared/notifications.js'
import { useAdminStepUp } from '../hooks/useAdminStepUp'
import RequestMaintenanceModal, { getMaintenanceMessage, MESSAGE_PRESET_OTHER } from './maintenance/RequestMaintenanceModal'
import MaintenanceDesktopView from './maintenance/MaintenanceDesktopView'
import MaintenanceMobileView from './maintenance/MaintenanceMobileView'
import MaintenanceInfoModal from './maintenance/MaintenanceInfoModal'

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
  const [infoOpen, setInfoOpen] = useState(false)
  const [tabKey, setTabKey] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(null)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { success, error } = useNotifier()

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
      if (evAction === 'setTab' && (tab === 'overview' || tab === 'status' || tab === 'history')) {
        setTabKey(tab)
      } else if (evAction === 'openRequestModal') {
        setRequestModalOpen(true)
        if (prefill === 'enable') {
          setTimeout(() => {
            form.setFieldsValue({
              action: 'enable',
              whenToStart: 'now',
              messagePreset: 'scheduled',
              message: undefined,
            })
          }, 100)
        } else if (prefill === 'invalid') {
          setTimeout(() => {
            form.setFieldsValue({
              action: 'enable',
              whenToStart: undefined,
              messagePreset: MESSAGE_PRESET_OTHER,
              message: '',
            })
          }, 100)
        }
      } else if (evAction === 'selectFirstPending') {
        setTabKey('status')
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
        const payload = {
          action: values.action,
          message: getMaintenanceMessage(values) || '',
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
      const isDisable = values.action === 'disable'
      if (isDisable) {
        modal.confirm({
          title: 'Cancel Maintenance?',
          content: 'Are you sure you want to Cancel the Maintenance?',
          okText: 'Yes, cancel maintenance',
          cancelText: 'No, keep maintenance',
          onOk: () => handleSubmit(values),
          onCancel: () => setSubmitting(false),
        })
        return
      }
      await handleSubmit(values)
    } catch {
      setSubmitting(false)
    }
  }, [form, handleSubmit, modal])

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

  return (
    <AdminLayout
      pageTitle="Maintenance"
      pageIcon={<SettingOutlined />}
      headerActions={headerActions}
    >
      <div
        style={
          isMobile
            ? { overflow: 'auto', flex: 1 }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {isMobile ? (
          <MaintenanceMobileView
            tabKey={tabKey}
            setTabKey={setTabKey}
            current={current}
            loading={loading}
            approvals={approvals}
            onApprove={handleApprove}
            onRefresh={load}
            onOpenRequestModal={() => setRequestModalOpen(true)}
          />
        ) : (
          <MaintenanceDesktopView
            tabKey={tabKey}
            setTabKey={setTabKey}
            current={current}
            loading={loading}
            approvals={approvals}
            onApprove={handleApprove}
            onRefresh={load}
            onOpenRequestModal={() => setRequestModalOpen(true)}
            headerActions={headerActions}
          />
        )}
      </div>

      <RequestMaintenanceModal
        open={requestModalOpen}
        onCancel={() => setRequestModalOpen(false)}
        form={form}
        onSubmit={handleConfirmSubmit}
        submitting={submitting}
        maintenanceActive={current?.isActive === true}
      />

      <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      {stepUpModal}
    </AdminLayout>
  )
}
