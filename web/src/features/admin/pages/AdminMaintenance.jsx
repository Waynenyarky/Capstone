import { useEffect, useState, useCallback } from 'react'
import { Form, Modal, Button, Grid, Typography } from 'antd'
import { ToolOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import {
  requestMaintenance,
  getMaintenanceCurrent,
  getMaintenanceApprovals,
  approveMaintenance,
  getMaintenancePublicStatus,
} from '../services'
import { useNotifier } from '@/shared/notifications.js'
import RequestMaintenanceModal from './maintenance/RequestMaintenanceModal'
import MaintenanceDesktopView from './maintenance/MaintenanceDesktopView'
import MaintenanceMobileView from './maintenance/MaintenanceMobileView'
import MaintenanceInfoModal from './maintenance/MaintenanceInfoModal'

const { Text } = Typography

export default function AdminMaintenance() {
  const [form] = Form.useForm()
  const [current, setCurrent] = useState(null)
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [tabKey, setTabKey] = useState('status')
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

  const handleSubmit = useCallback(
    async (values) => {
      try {
        await requestMaintenance({
          action: values.action,
          message: values.message,
          expectedResumeAt: values.expectedResumeAt ? values.expectedResumeAt.toISOString() : null,
        })
        success('Maintenance request submitted for approval')
        form.resetFields()
        setRequestModalOpen(false)
        await load()
      } catch (err) {
        console.error('Maintenance request failed', err)
        error(err, 'Failed to submit request')
      } finally {
        setSubmitting(false)
      }
    },
    [form, success, error, load]
  )

  const handleConfirmSubmit = useCallback(async () => {
    setSubmitting(true)
    try {
      const values = await form.validateFields()
      const isDisable = values.action === 'disable'
      if (isDisable) {
        Modal.confirm({
          title: 'Cancel Maintenance?',
          content: 'Are you sure you want to Cancel the Maintenance?',
          okText: 'Yes, cancel',
          cancelText: 'No',
          onOk: () => handleSubmit(values),
          onCancel: () => setSubmitting(false),
        })
        return
      }
      await handleSubmit(values)
    } catch {
      setSubmitting(false)
    }
  }, [form, handleSubmit])

  const handleApprove = useCallback(
    async (approvalId, approved) => {
      try {
        await approveMaintenance(approvalId, approved, '')
        success(approved ? 'Approved maintenance change' : 'Rejected maintenance change')
        await load()
      } catch (err) {
        console.error('Approve maintenance failed', err)
        error(err, 'Failed to process approval')
      }
    },
    [success, error, load]
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
      pageTitle="Maintenance Control"
      pageIcon={<ToolOutlined />}
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
      />

      <MaintenanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </AdminLayout>
  )
}
