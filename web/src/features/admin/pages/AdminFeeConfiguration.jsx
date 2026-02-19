import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Spin, Alert, Grid, Tabs, Typography, Modal, Space, Divider, Collapse } from 'antd'
import { DollarOutlined, PlusOutlined, ReloadOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import ExportLogsModal from '../components/ExportLogsModal'
import AdminLayout from '../components/AdminLayout.jsx'
import { get, post, put, del } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { useAdminStepUp } from '../hooks/useAdminStepUp'
import FeeConfigurationDesktopView from './feeConfiguration/FeeConfigurationDesktopView'
import FeeConfigOverview from './feeConfiguration/FeeConfigOverview'
import FeeByLobTab from './feeConfiguration/FeeByLobTab'
import FeeConfigDetailPanel from './feeConfiguration/FeeConfigDetailPanel'
import PenaltyConfigForm from './feeConfiguration/PenaltyConfigForm'
import FeeConfigLogsTab from './feeConfiguration/FeeConfigLogsTab'
import SpecialFeesTab from './feeConfiguration/SpecialFeesTab'

const { Text } = Typography

const TAB_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'fee-by-lob', label: 'Fee by Line of Business' },
  { key: 'special-fees', label: 'Special fees' },
  { key: 'penalty', label: 'Penalty & Surcharge' },
  { key: 'logs', label: 'History' },
]

export default function AdminFeeConfiguration() {
  const [searchParams] = useSearchParams()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [tabKey, setTabKey] = useState('overview')
  const [infoOpen, setInfoOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'penalty') setTabKey('penalty')
    else if (tab === 'logs') setTabKey('logs')
  }, [searchParams])
  const [loading, setLoading] = useState(true)
  const [configs, setConfigs] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedFeeConfigId, setSelectedFeeConfigId] = useState(null)
  const [exportLogsOpen, setExportLogsOpen] = useState(false)
  const [addLobModalOpen, setAddLobModalOpen] = useState(false)
  const { success, error: notifyError } = useNotifier()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await get('/api/business/admin/fee-configuration')
      setConfigs(res?.data || [])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err?.message || 'Failed to load fee configurations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action: evAction, tab } = event?.detail || {}
      if (evAction === 'setTab' && tab) {
        setTabKey(tab)
      } else if (evAction === 'selectFirst') {
        const first = configs[0]
        if (first) setSelectedFeeConfigId(first._id || first.id)
      } else if (evAction === 'openAddLob') {
        setAddLobModalOpen(true)
      } else if (evAction === 'refresh') {
        fetchConfigs()
      } else if (evAction === 'openExportLogs') {
        setExportLogsOpen(true)
      } else if (evAction === 'openPenaltyInvalid') {
        setTabKey('penalty')
      }
    }
    window.addEventListener('devtools:feeconfig', handler)
    return () => window.removeEventListener('devtools:feeconfig', handler)
  }, [configs, fetchConfigs])

  const handleSave = useCallback(
    async (id, payload) => {
      try {
        setSaving(true)
        await runWithStepUp(async (stepUpToken) => {
          const headers = { 'X-Step-Up-Token': stepUpToken }
          if (id) {
            await put(`/api/business/admin/fee-configuration/${id}`, payload, { headers })
          } else {
            const res = await post('/api/business/admin/fee-configuration', payload, { headers })
            if (res?.data?._id) setSelectedFeeConfigId(res.data._id)
          }
          success('Fee configuration saved')
          await fetchConfigs()
          if (id) setSelectedFeeConfigId(id)
        })
      } catch (err) {
        if (err?.message !== 'Step-up cancelled') notifyError(err, 'Failed to save fee configuration')
      } finally {
        setSaving(false)
      }
    },
    [success, notifyError, fetchConfigs, runWithStepUp]
  )

  const handleDelete = useCallback(
    async (id) => {
      try {
        await runWithStepUp(async (stepUpToken) => {
          await del(`/api/business/admin/fee-configuration/${id}`, { headers: { 'X-Step-Up-Token': stepUpToken } })
          success('Fee configuration deleted')
          setSelectedFeeConfigId(null)
          await fetchConfigs()
        })
      } catch (err) {
        if (err?.message !== 'Step-up cancelled') notifyError(err, 'Failed to delete')
      }
    },
    [success, notifyError, fetchConfigs, runWithStepUp]
  )

  const handleAddLob = useCallback(() => {
    setAddLobModalOpen(true)
  }, [])

  const handleSaveFromAddModal = useCallback(
    async (id, payload) => {
      try {
        await handleSave(id, payload)
        setAddLobModalOpen(false)
      } catch (_) { /* handleSave shows error */ }
    },
    [handleSave]
  )

  const selectedConfig =
    selectedFeeConfigId === 'new'
      ? { _id: null }
      : configs.find((c) => (c._id || c.id) === selectedFeeConfigId) || null

  const tabChildren = {
    overview: <FeeConfigOverview configs={configs} />,
    'fee-by-lob': (
      <FeeByLobTab
        configs={configs}
        loading={loading}
        onRefresh={fetchConfigs}
        onAdd={handleAddLob}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={saving}
        selectedConfigId={selectedFeeConfigId}
        setSelectedConfigId={setSelectedFeeConfigId}
      />
    ),
    'special-fees': <SpecialFeesTab />,
    penalty: <PenaltyConfigForm />,
    logs: <FeeConfigLogsTab initialLogId={searchParams.get('logId') || null} />,
  }

  const desktopHeaderActions =
    tabKey === 'fee-by-lob' ? (
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLob}>
        Add Line of Business
      </Button>
    ) : tabKey === 'logs' ? (
      <Button type="primary" icon={<DownloadOutlined />} onClick={() => setExportLogsOpen(true)}>
        Export
      </Button>
    ) : null

  const mainHeaderActions = (
    <>
      {lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
      <Button icon={<ReloadOutlined />} onClick={fetchConfigs} loading={loading} aria-label="Refresh" />
      <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="About" />
    </>
  )

  if (loading && !configs.length) {
    return (
      <AdminLayout pageTitle="Fee Configuration" pageIcon={<DollarOutlined />} headerActions={mainHeaderActions}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin tip="Loading fee configurations...">
            <div style={{ minHeight: 48 }} />
          </Spin>
        </div>
      </AdminLayout>
    )
  }

  if (isMobile) {
    return (
      <AdminLayout pageTitle="Fee Configuration" pageIcon={<DollarOutlined />} headerActions={mainHeaderActions}>
        {error ? (
          <Alert type="error" message={error} action={<Button onClick={fetchConfigs}>Retry</Button>} />
        ) : (
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={TAB_ITEMS.map(({ key, label }) => ({ key, label, children: tabChildren[key] }))}
          />
        )}
        <FeeConfigInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="Fee Configuration" pageIcon={<DollarOutlined />} headerActions={mainHeaderActions}>
      {error && (
        <Alert
          type="error"
          message={error}
          action={<Button onClick={fetchConfigs}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <FeeConfigurationDesktopView
        tabKey={tabKey}
        setTabKey={setTabKey}
        tabChildren={tabChildren}
        headerActions={desktopHeaderActions}
      />
      <ExportLogsModal
        open={exportLogsOpen}
        onClose={() => setExportLogsOpen(false)}
        exportType="fee"
        title="Fee configuration logs"
      />
      <Modal
        title="Add Line of Business"
        open={addLobModalOpen}
        onCancel={() => setAddLobModalOpen(false)}
        footer={null}
        width={520}
        destroyOnHidden
      >
        <FeeConfigDetailPanel
          config={{ _id: null }}
          configs={configs}
          saving={saving}
          onSave={handleSaveFromAddModal}
          onCancel={() => setAddLobModalOpen(false)}
        />
      </Modal>
      <FeeConfigInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      {stepUpModal}
    </AdminLayout>
  )
}

const FEE_CONFIG_FAQ = [
  {
    key: '1',
    label: 'When do fee changes take effect?',
    children: 'Changes apply to new fee calculations only. Existing applications or transactions that were already computed keep their original amounts. Save your changes and new permits/renewals will use the updated values.',
  },
  {
    key: '2',
    label: 'What is the difference between rate, tiered, and fixed tax?',
    children: 'Rate uses a percentage of the tax base. Tiered uses brackets (e.g. up to X amount at one rate, above at another). Fixed applies a set amount regardless of base. Choose per LOB based on the charter and business type.',
  },
  {
    key: '3',
    label: 'Can I add a new line of business (LOB)?',
    children: 'Yes. In Fee by Line of Business, use Add to create a new LOB. Set Mayor\'s Permit fee, business tax category, tax brackets, and optional Environmental Protection Fee. The LOB will then be available for form and fee computation.',
  },
  {
    key: '4',
    label: 'How is the penalty start day used?',
    children: 'Late renewal penalty typically starts after a set date (e.g. January 20). The system uses this date plus the surcharge and interest settings to compute penalties for renewals submitted after the deadline.',
  },
  {
    key: '5',
    label: 'Where can I see who changed fee config?',
    children: 'Use the History tab. It shows the audit trail of all fee configuration changes—who made the change and when—for compliance and troubleshooting.',
  },
]

function FeeConfigInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Fee Configuration"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text>
          This page configures all fees used when computing business permit and renewal fees. Values align with the General Trias Citizen&apos;s Charter (OCBPLO 2025) where applicable.
        </Text>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>What you can do</Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li><Text><strong>Overview</strong> — Summary of fee configurations by line of business (LOB) and quick stats.</Text></li>
            <li><Text><strong>Fee by Line of Business</strong> — Add, edit, or remove LOBs. For each LOB set the Mayor&apos;s Permit fee, business tax category, and tax brackets (rate, tiered, or fixed). Optional Environmental Protection Fee can be set per LOB. These values are used when calculating application and renewal fees.</Text></li>
            <li><Text><strong>Special fees</strong> — Sanitary Inspection Fee (by floor area in sq.m.) and Fire Safety Inspection Fee (percentage of BPLO fees with a minimum). Edit area brackets and house-for-rent fee for sanitary, and rate and minimum for fire safety. Changes apply to new fee calculations.</Text></li>
            <li><Text><strong>Penalty &amp; Surcharge</strong> — Configure late renewal penalty: surcharge percentage, monthly interest rate, and penalty start day (e.g. January 20). You can reset to charter defaults.</Text></li>
            <li><Text><strong>History</strong> — View the audit trail of changes to fee configuration (who changed what and when).</Text></li>
          </ul>
        </div>

        <div>
          <Text strong>Frequently asked questions</Text>
          <Collapse
            size="small"
            items={FEE_CONFIG_FAQ}
            style={{ marginTop: 8 }}
            bordered={false}
          />
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          <a href="https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf" target="_blank" rel="noopener noreferrer">
            General Trias Citizen&apos;s Charter (OCBPLO 2025)
          </a>
        </Text>
      </Space>
    </Modal>
  )
}
