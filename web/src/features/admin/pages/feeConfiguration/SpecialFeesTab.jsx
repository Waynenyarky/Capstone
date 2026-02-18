import React, { useState, useEffect, useCallback } from 'react'
import {
  Form,
  InputNumber,
  Button,
  Spin,
  Alert,
  Card,
  Typography,
  Table,
  Space,
} from 'antd'
import { SafetyCertificateOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { get, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'

const { Text } = Typography

const DEFAULT_BRACKETS = [
  { minSqm: 0, maxSqm: 24.99, fee: 0 },
  { minSqm: 25, maxSqm: 49.99, fee: 50 },
  { minSqm: 50, maxSqm: 99.99, fee: 60 },
  { minSqm: 100, maxSqm: 199.99, fee: 150 },
  { minSqm: 200, maxSqm: 499.99, fee: 200 },
  { minSqm: 500, maxSqm: 999.99, fee: 250 },
  { minSqm: 1000, maxSqm: null, fee: 400 },
]

export default function SpecialFeesTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState(null)
  const [brackets, setBrackets] = useState(DEFAULT_BRACKETS)
  const [houseForRentFee, setHouseForRentFee] = useState(50)
  const [fireSafetyRate, setFireSafetyRate] = useState(0.15)
  const [fireSafetyMin, setFireSafetyMin] = useState(500)
  const { success, error: notifyError } = useNotifier()

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await get('/api/business/admin/regulatory-fee-config')
      const data = res?.data
      if (data) {
        setConfig(data)
        setBrackets(
          Array.isArray(data.sanitaryBrackets) && data.sanitaryBrackets.length > 0
            ? data.sanitaryBrackets
            : DEFAULT_BRACKETS
        )
        setHouseForRentFee(
          typeof data.sanitaryHouseForRentFee === 'number' ? data.sanitaryHouseForRentFee : 50
        )
        setFireSafetyRate(
          typeof data.fireSafetyRate === 'number' ? data.fireSafetyRate : 0.15
        )
        setFireSafetyMin(
          typeof data.fireSafetyMin === 'number' ? data.fireSafetyMin : 500
        )
      }
    } catch (err) {
      setError(err?.message || 'Failed to load special fees configuration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      await put('/api/business/admin/regulatory-fee-config', {
        sanitaryBrackets: brackets,
        sanitaryHouseForRentFee: houseForRentFee,
        fireSafetyRate,
        fireSafetyMin,
      })
      success('Special fees saved')
      await fetchConfig()
    } catch (err) {
      notifyError(err, 'Failed to save special fees')
    } finally {
      setSaving(false)
    }
  }, [brackets, houseForRentFee, fireSafetyRate, fireSafetyMin, success, notifyError, fetchConfig])

  const addBracket = () => {
    const last = brackets[brackets.length - 1]
    const min = last ? (last.maxSqm != null ? last.maxSqm + 0.01 : last.minSqm + 100) : 0
    setBrackets([...brackets, { minSqm: min, maxSqm: null, fee: 0 }])
  }

  const removeBracket = (index) => {
    setBrackets(brackets.filter((_, i) => i !== index))
  }

  const updateBracket = (index, field, value) => {
    const next = [...brackets]
    next[index] = { ...next[index], [field]: value }
    setBrackets(next)
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

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Alert
        type="info"
        message="Sanitary Inspection Fee (by area) and Fire Safety Inspection Fee (rate and minimum) are used when computing application fees. Changes apply immediately to new calculations."
        style={{ marginBottom: 24 }}
        showIcon
      />

      <Card
        title={
          <span>
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            Sanitary Inspection Fee (Charter 5E.01)
          </span>
        }
        style={{ marginBottom: 24 }}
        size="small"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Fee by floor area (sq.m.). House for rent uses a fixed fee below.
        </Text>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">House for rent (fixed fee, ₱)</Text>
          <InputNumber
            min={0}
            value={houseForRentFee}
            onChange={(v) => setHouseForRentFee(v ?? 0)}
            style={{ width: 120, marginLeft: 8 }}
          />
        </div>
        <Table
          size="small"
          pagination={false}
          dataSource={brackets.map((b, i) => ({ ...b, key: i }))}
          columns={[
            { title: 'Min (sq.m.)', dataIndex: 'minSqm', width: 120, render: (_, r, i) => (
              <InputNumber
                min={0}
                value={r.minSqm}
                onChange={(v) => updateBracket(i, 'minSqm', v ?? 0)}
                style={{ width: '100%' }}
              />
            )},
            { title: 'Max (sq.m.)', dataIndex: 'maxSqm', width: 120, render: (_, r, i) => (
              <InputNumber
                min={0}
                placeholder="No limit"
                value={r.maxSqm}
                onChange={(v) => updateBracket(i, 'maxSqm', v ?? null)}
                style={{ width: '100%' }}
              />
            )},
            { title: 'Fee (₱)', dataIndex: 'fee', width: 100, render: (_, r, i) => (
              <InputNumber
                min={0}
                value={r.fee}
                onChange={(v) => updateBracket(i, 'fee', v ?? 0)}
                style={{ width: '100%' }}
              />
            )},
            {
              title: '',
              width: 48,
              render: (_, __, i) => (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeBracket(i)}
                  aria-label="Remove row"
                />
              ),
            },
          ]}
        />
        <Button type="dashed" onClick={addBracket} icon={<PlusOutlined />} style={{ marginTop: 8 }}>
          Add bracket
        </Button>
      </Card>

      <Card
        title="Fire Safety Inspection Fee"
        style={{ marginBottom: 24 }}
        size="small"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Applied as a percentage of BPLO regulatory fees (Mayor&apos;s Permit + Business Tax), with a minimum amount.
        </Text>
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Rate (0–1, e.g. 0.15 = 15%)</Text>
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              value={fireSafetyRate}
              onChange={(v) => setFireSafetyRate(v ?? 0)}
              style={{ width: 120, display: 'block', marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Minimum (₱)</Text>
            <InputNumber
              min={0}
              value={fireSafetyMin}
              onChange={(v) => setFireSafetyMin(v ?? 0)}
              style={{ width: 120, display: 'block', marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>

      <Button type="primary" onClick={handleSave} loading={saving}>
        Save special fees
      </Button>
    </div>
  )
}
