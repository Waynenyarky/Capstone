import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Spin, Alert, Grid, Tabs, Typography, Modal } from 'antd'
import { DollarOutlined, PlusOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout.jsx'
import { get, post, put, del } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import FeeConfigurationDesktopView from './feeConfiguration/FeeConfigurationDesktopView'
import FeeConfigOverview from './feeConfiguration/FeeConfigOverview'
import FeeByLobTab from './feeConfiguration/FeeByLobTab'
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
  }, [searchParams])
  const [loading, setLoading] = useState(true)
  const [configs, setConfigs] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedFeeConfigId, setSelectedFeeConfigId] = useState(null)
  const { success, error: notifyError } = useNotifier()

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

  const handleSave = useCallback(
    async (id, payload) => {
      try {
        setSaving(true)
        if (id) {
          await put(`/api/business/admin/fee-configuration/${id}`, payload)
        } else {
          const res = await post('/api/business/admin/fee-configuration', payload)
          if (res?.data?._id) setSelectedFeeConfigId(res.data._id)
        }
        success('Fee configuration saved')
        await fetchConfigs()
        if (id) setSelectedFeeConfigId(id)
      } catch (err) {
        notifyError(err, 'Failed to save fee configuration')
      } finally {
        setSaving(false)
      }
    },
    [success, notifyError, fetchConfigs]
  )

  const handleDelete = useCallback(
    async (id) => {
      try {
        await del(`/api/business/admin/fee-configuration/${id}`)
        success('Fee configuration deleted')
        setSelectedFeeConfigId(null)
        await fetchConfigs()
      } catch (err) {
        notifyError(err, 'Failed to delete')
      }
    },
    [success, notifyError, fetchConfigs]
  )

  const handleAddLob = useCallback(() => {
    setSelectedFeeConfigId('new')
  }, [])

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
    logs: <FeeConfigLogsTab />,
  }

  const desktopHeaderActions =
    tabKey === 'fee-by-lob' ? (
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLob}>
        Add Line of Business
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
          <Spin tip="Loading fee configurations..." />
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
      <FeeConfigInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </AdminLayout>
  )
}

function FeeConfigInfoModal({ open, onClose }) {
  return (
    <Modal
      title="Fee Configuration"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={560}
    >
      <p>
        This page configures all fees used when computing business permit and renewal fees. Values align with the General Trias Citizen&apos;s Charter (OCBPLO 2025) where applicable.
      </p>

      <p><strong>Overview</strong> — Summary of fee configurations by line of business (LOB) and quick stats.</p>

      <p>
        <strong>Fee by Line of Business</strong> — Add, edit, or remove LOBs. For each LOB you set the Mayor&apos;s Permit fee, business tax category, and tax brackets (rate, tiered, or fixed amount). Optional Environmental Protection Fee can be set per LOB. These values are used when calculating application and renewal fees.
      </p>

      <p>
        <strong>Special fees</strong> — Sanitary Inspection Fee (by floor area in sq.m.) and Fire Safety Inspection Fee (percentage of BPLO fees with a minimum). Edit the area brackets and house-for-rent fee for sanitary, and the rate and minimum for fire safety. Changes apply immediately to new fee calculations.
      </p>

      <p>
        <strong>Penalty &amp; Surcharge</strong> — Configure late renewal penalty: surcharge percentage, monthly interest rate, and penalty start day (e.g. January 20). You can reset to charter defaults.
      </p>

      <p>
        <strong>History</strong> — View the audit trail of changes to fee configuration (who changed what and when).
      </p>

      <p>
        <a href="https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf" target="_blank" rel="noopener noreferrer">
          General Trias Citizen&apos;s Charter (OCBPLO 2025)
        </a>
      </p>
    </Modal>
  )
}
