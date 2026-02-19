import React, { useState, useEffect, useCallback } from 'react'
import { Button, Spin, Alert, Grid, Typography, theme } from 'antd'
import { get, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'
import { SPECIAL_FEE_SECTIONS } from './specialFeesConstants'
import {
  SanitaryPanel,
  FireSafetyPanel,
  BusinessPlatePanel,
  EnvironmentalPanel,
  WeightsAndMeasuresPanel,
  CommunityTaxPanel,
  BarangayClearancePanel,
  SpecialPermitPanel,
  CertificationPanel,
} from './SpecialFeePanels'

const { Title, Text } = Typography
const SIDEBAR_WIDTH = 240

function DetailHeader({ icon: Icon, title }) {
  const { token } = theme.useToken()
  return (
    <div
      style={{
        padding: '16px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: token.borderRadius,
          background: token.colorFillAlter,
          color: token.colorPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon style={{ fontSize: 16 }} /> : null}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
          {title}
        </Title>
      </div>
    </div>
  )
}

/** Merge partial into config; for nested objects, merge one level deep. */
function mergeConfig(prev, partial) {
  if (!partial || typeof partial !== 'object') return prev
  const next = { ...prev }
  for (const key of Object.keys(partial)) {
    const val = partial[key]
    if (val != null && typeof val === 'object' && !Array.isArray(val) && prev[key] != null && typeof prev[key] === 'object' && !Array.isArray(prev[key])) {
      next[key] = { ...prev[key], ...val }
    } else {
      next[key] = val
    }
  }
  return next
}

export default function SpecialFeesTab() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selectedKey, setSelectedKey] = useState('sanitary')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState(null)
  const [lobConfigs, setLobConfigs] = useState([])
  const { success, error: notifyError } = useNotifier()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [regRes, lobRes] = await Promise.all([
        get('/api/business/admin/regulatory-fee-config'),
        get('/api/business/admin/fee-configuration'),
      ])
      const data = regRes?.data
      if (data) setConfig(data)
      const lob = lobRes?.data
      if (Array.isArray(lob)) setLobConfigs(lob)
    } catch (err) {
      setError(err?.message || 'Failed to load special fees configuration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const onUpdate = useCallback((partial) => {
    setConfig((prev) => mergeConfig(prev || {}, partial))
  }, [])

  const handleSave = useCallback(async () => {
    if (!config) return
    try {
      setSaving(true)
      await runWithStepUp(async (stepUpToken) => {
        await put('/api/business/admin/regulatory-fee-config', {
          sanitaryBrackets: config.sanitaryBrackets,
          sanitaryHouseForRentFee: config.sanitaryHouseForRentFee,
          fireSafetyRate: config.fireSafetyRate,
          fireSafetyMin: config.fireSafetyMin,
          businessPlate: config.businessPlate,
          weightsAndMeasures: config.weightsAndMeasures,
          communityTax: config.communityTax,
          specialPermit: config.specialPermit,
          certificationOfBusinessRecord: config.certificationOfBusinessRecord,
          certifiedTrueCopyPerDocument: config.certifiedTrueCopyPerDocument,
        }, { headers: { 'X-Step-Up-Token': stepUpToken } })
        success('Special fees saved')
        await fetchConfig()
      })
    } catch (err) {
      if (err?.message !== 'Step-up cancelled') notifyError(err, 'Failed to save special fees')
    } finally {
      setSaving(false)
    }
  }, [config, success, notifyError, fetchConfig, runWithStepUp])

  const renderSectionItem = (item, isSelected) => (
    <div
      key={item.key}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedKey(item.key)}
      onKeyDown={(e) => e.key === 'Enter' && setSelectedKey(item.key)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = token.colorFillTertiary
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {item.icon && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
            flexShrink: 0,
          }}
        >
          <item.icon style={{ fontSize: 16 }} />
        </span>
      )}
      <Text strong={isSelected} type={isSelected ? undefined : 'secondary'} style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>
        {item.label}
      </Text>
    </div>
  )

  const showSaveButton =
    selectedKey !== 'environmental' && selectedKey !== 'barangayClearance'

  const renderDetail = () => {
    const section = SPECIAL_FEE_SECTIONS.find((s) => s.key === selectedKey)
    if (!section) return null
    const Icon = section.icon
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DetailHeader icon={Icon} title={section.label} />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
          {selectedKey === 'sanitary' && <SanitaryPanel config={config} onUpdate={onUpdate} />}
          {selectedKey === 'fireSafety' && <FireSafetyPanel config={config} onUpdate={onUpdate} />}
          {selectedKey === 'businessPlate' && <BusinessPlatePanel config={config} onUpdate={onUpdate} />}
          {selectedKey === 'environmental' && <EnvironmentalPanel lobConfigs={lobConfigs} />}
          {selectedKey === 'weightsAndMeasures' && (
            <WeightsAndMeasuresPanel config={config} onUpdate={onUpdate} />
          )}
          {selectedKey === 'communityTax' && <CommunityTaxPanel config={config} onUpdate={onUpdate} />}
          {selectedKey === 'barangayClearance' && <BarangayClearancePanel lobConfigs={lobConfigs} />}
          {selectedKey === 'specialPermit' && <SpecialPermitPanel config={config} onUpdate={onUpdate} />}
          {selectedKey === 'certification' && <CertificationPanel config={config} onUpdate={onUpdate} />}
          {showSaveButton && (
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={handleSave} loading={saving}>
                Save special fees
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading && !config) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin tip="Loading special fees...">
          <div style={{ minHeight: 80 }} />
        </Spin>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Failed to load"
          description={error}
          action={<Button onClick={fetchConfig}>Retry</Button>}
        />
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert
          type="info"
          message="Special fees (Charter)"
          description="Sanitary, Fire Safety, and other regulatory fees. Edit in Fee by Line of Business for Environmental and Barangay fees."
          showIcon
        />
        <Select
          size="large"
          value={selectedKey}
          onChange={setSelectedKey}
          options={SPECIAL_FEE_SECTIONS.map((s) => ({ value: s.key, label: s.label }))}
          style={{ width: '100%' }}
        />
        {renderDetail()}
      </div>
    )
  }

  return (
    <>
    <div style={{ display: 'flex', height: '100%', minHeight: 400 }}>
      <div
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          padding: 12,
          overflowY: 'auto',
          background: token.colorBgLayout,
          borderRight: `1px solid ${token.colorBorder}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SPECIAL_FEE_SECTIONS.map((item) => renderSectionItem(item, selectedKey === item.key))}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: token.colorBgContainer,
        }}
      >
        {renderDetail()}
      </div>
    </div>
    {stepUpModal}
    </>
  )
}
