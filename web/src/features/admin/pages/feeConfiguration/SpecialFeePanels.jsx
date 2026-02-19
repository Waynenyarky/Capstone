import React from 'react'
import {
  InputNumber,
  Button,
  Table,
  Typography,
  Space,
  Input,
  Card,
  Alert,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { getCharterTaxCodeLabel } from '@/constants/charterTaxCodes.js'

const { Text } = Typography

const DEFAULT_SANITARY_BRACKETS = [
  { minSqm: 0, maxSqm: 24.99, fee: 0 },
  { minSqm: 25, maxSqm: 49.99, fee: 50 },
  { minSqm: 50, maxSqm: 99.99, fee: 60 },
  { minSqm: 100, maxSqm: 199.99, fee: 150 },
  { minSqm: 200, maxSqm: 499.99, fee: 200 },
  { minSqm: 500, maxSqm: 999.99, fee: 250 },
  { minSqm: 1000, maxSqm: null, fee: 400 },
]

export function SanitaryPanel({ config, onUpdate }) {
  const brackets = config?.sanitaryBrackets?.length ? config.sanitaryBrackets : DEFAULT_SANITARY_BRACKETS
  const houseForRentFee = typeof config?.sanitaryHouseForRentFee === 'number' ? config.sanitaryHouseForRentFee : 50

  const addBracket = () => {
    const last = brackets[brackets.length - 1]
    const min = last ? (last.maxSqm != null ? last.maxSqm + 0.01 : last.minSqm + 100) : 0
    onUpdate({ sanitaryBrackets: [...brackets, { minSqm: min, maxSqm: null, fee: 0 }] })
  }
  const removeBracket = (index) => {
    onUpdate({ sanitaryBrackets: brackets.filter((_, i) => i !== index) })
  }
  const updateBracket = (index, field, value) => {
    const next = [...brackets]
    next[index] = { ...next[index], [field]: value }
    onUpdate({ sanitaryBrackets: next })
  }

  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Fee by floor area (sq.m.). House for rent uses a fixed fee. Charter Section 5E.01.
      </Text>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">House for rent (fixed fee, ₱)</Text>
        <InputNumber
          min={0}
          value={houseForRentFee}
          onChange={(v) => onUpdate({ sanitaryHouseForRentFee: v ?? 0 })}
          style={{ width: 120, marginLeft: 8 }}
        />
      </div>
      <Table
        size="small"
        pagination={false}
        dataSource={brackets.map((b, i) => ({ ...b, key: i }))}
        columns={[
          {
            title: 'Min (sq.m.)',
            dataIndex: 'minSqm',
            width: 120,
            render: (_, r, i) => (
              <InputNumber
                min={0}
                value={r.minSqm}
                onChange={(v) => updateBracket(i, 'minSqm', v ?? 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: 'Max (sq.m.)',
            dataIndex: 'maxSqm',
            width: 120,
            render: (_, r, i) => (
              <InputNumber
                min={0}
                placeholder="No limit"
                value={r.maxSqm}
                onChange={(v) => updateBracket(i, 'maxSqm', v ?? null)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: 'Fee (₱)',
            dataIndex: 'fee',
            width: 100,
            render: (_, r, i) => (
              <InputNumber
                min={0}
                value={r.fee}
                onChange={(v) => updateBracket(i, 'fee', v ?? 0)}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '',
            width: 48,
            render: (_, __, i) => (
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeBracket(i)} aria-label="Remove row" />
            ),
          },
        ]}
      />
      <Button type="dashed" onClick={addBracket} icon={<PlusOutlined />} style={{ marginTop: 8 }}>
        Add bracket
      </Button>
    </>
  )
}

export function FireSafetyPanel({ config, onUpdate }) {
  const rate = typeof config?.fireSafetyRate === 'number' ? config.fireSafetyRate : 0.15
  const min = typeof config?.fireSafetyMin === 'number' ? config.fireSafetyMin : 500
  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Applied as a percentage of BPLO regulatory fees (Mayor&apos;s Permit + Business Tax), with a minimum amount. Charter: 15%, min P500.
      </Text>
      <Space wrap size="middle">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Rate (0–1, e.g. 0.15 = 15%)</Text>
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            value={rate}
            onChange={(v) => onUpdate({ fireSafetyRate: v ?? 0 })}
            style={{ width: 120, display: 'block', marginTop: 4 }}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Minimum (₱)</Text>
          <InputNumber
            min={0}
            value={min}
            onChange={(v) => onUpdate({ fireSafetyMin: v ?? 0 })}
            style={{ width: 120, display: 'block', marginTop: 4 }}
          />
        </div>
      </Space>
    </>
  )
}

export function BusinessPlatePanel({ config, onUpdate }) {
  const bp = config?.businessPlate || {}
  const feePerUnit = bp.feePerUnit
  const note = bp.note ?? ''
  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Cost determined by BPLO from year to year, not to exceed cost of acquisition. Charter 4A.01.
      </Text>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Fee per unit (₱)</Text>
          <InputNumber
            min={0}
            value={feePerUnit}
            onChange={(v) => onUpdate({ businessPlate: { ...bp, feePerUnit: v ?? undefined } })}
            style={{ width: 160, display: 'block', marginTop: 4 }}
            placeholder="Optional"
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Note</Text>
          <Input
            value={note}
            onChange={(e) => onUpdate({ businessPlate: { ...bp, note: e.target.value } })}
            placeholder="e.g. Cost not to exceed acquisition"
            style={{ marginTop: 4 }}
          />
        </div>
      </Space>
    </>
  )
}

export function EnvironmentalPanel({ lobConfigs = [] }) {
  const dataSource = (lobConfigs || [])
    .filter((c) => c.isActive !== false)
    .map((c) => ({
      key: c._id || c.id,
      taxCode: getCharterTaxCodeLabel(c.taxCode),
      lineOfBusiness: c.lineOfBusiness,
      fee: c.environmentalProtectionFee != null ? `₱${Number(c.environmentalProtectionFee).toLocaleString()}` : '—',
    }))
  return (
    <>
      <Alert
        type="info"
        message="Edit in Fee by Line of Business"
        description="Environmental Protection Fee is set per line of business. Use the Fee by Line of Business tab to edit each row."
        style={{ marginBottom: 16 }}
        showIcon
      />
      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        Charter 4W.01 — per annum by industry.
      </Text>
      <Table
        size="small"
        pagination={{ pageSize: 10 }}
        dataSource={dataSource}
        columns={[
          { title: 'Tax Code', dataIndex: 'taxCode', width: 160 },
          { title: 'Line of Business', dataIndex: 'lineOfBusiness', ellipsis: true },
          { title: 'Env. Fee (₱)', dataIndex: 'fee', width: 100 },
        ]}
      />
    </>
  )
}

export function WeightsAndMeasuresPanel({ config, onUpdate }) {
  const wam = config?.weightsAndMeasures || {}
  const linear = wam.linear || []
  const capacity = wam.capacity || []
  const weights = wam.weights || []
  const updateNested = (field, value) => onUpdate({ weightsAndMeasures: { ...wam, [field]: value } })

  const renderBrackets = (list, field, maxLabel, unitLabel) => (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ fontSize: 12 }}>{field}</Text>
      <Table
        size="small"
        pagination={false}
        dataSource={(list || []).map((b, i) => ({ ...b, key: i }))}
        columns={[
          {
            title: maxLabel,
            dataIndex: 'maxValue',
            width: 100,
            render: (v, r, i) => (
              <InputNumber
                min={0}
                value={v}
                placeholder="No limit"
                onChange={(val) => {
                  const next = [...(list || [])]
                  next[i] = { ...next[i], maxValue: val ?? 0 }
                  updateNested(field, next)
                }}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: 'Fee/unit (₱)',
            dataIndex: 'feePerUnit',
            width: 100,
            render: (v, r, i) => (
              <InputNumber
                min={0}
                value={v}
                onChange={(val) => {
                  const next = [...(list || [])]
                  next[i] = { ...next[i], feePerUnit: val ?? 0 }
                  updateNested(field, next)
                }}
                style={{ width: '100%' }}
              />
            ),
          },
        ]}
      />
    </div>
  )

  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Charter 4J.01 — sealing and licensing of weights and measures. Linear (m), capacity (L), weights (kg).
      </Text>
      {renderBrackets(linear, 'linear', 'Max (m)', 'meters')}
      {renderBrackets(capacity, 'capacity', 'Max (L)', 'liters')}
      {renderBrackets(weights, 'weights', 'Max (kg)', 'kg')}
      <Space wrap size="middle">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Retesting per unit (₱)</Text>
          <InputNumber
            min={0}
            value={wam.retestingPerUnit}
            onChange={(v) => updateNested('retestingPerUnit', v ?? 0)}
            style={{ width: 120, display: 'block', marginTop: 4 }}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Gasoline per nozzle (₱)</Text>
          <InputNumber
            min={0}
            value={wam.gasolinePerNozzle}
            onChange={(v) => updateNested('gasolinePerNozzle', v ?? 0)}
            style={{ width: 120, display: 'block', marginTop: 4 }}
          />
        </div>
      </Space>
    </>
  )
}

export function CommunityTaxPanel({ config, onUpdate }) {
  const ct = config?.communityTax || {}
  const update = (key, value) => onUpdate({ communityTax: { ...ct, [key]: value } })
  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Charter Section 3.01–3.07. Individual: base + rate per ₱1,000 income (cap). Juridical: base + rate per ₱5,000 real/gross (cap).
      </Text>
      <Card size="small" title="Individual" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Base (₱)</Text>
            <InputNumber min={0} value={ct.individualBase} onChange={(v) => update('individualBase', v ?? 0)} style={{ width: 100, display: 'block', marginTop: 4 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Rate per ₱1,000</Text>
            <InputNumber min={0} value={ct.individualRatePer1000} onChange={(v) => update('individualRatePer1000', v ?? 0)} style={{ width: 100, display: 'block', marginTop: 4 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Cap (₱)</Text>
            <InputNumber min={0} value={ct.individualCap} onChange={(v) => update('individualCap', v ?? 0)} style={{ width: 100, display: 'block', marginTop: 4 }} />
          </div>
        </Space>
      </Card>
      <Card size="small" title="Juridical">
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Base (₱)</Text>
            <InputNumber min={0} value={ct.juridicalBase} onChange={(v) => update('juridicalBase', v ?? 0)} style={{ width: 100, display: 'block', marginTop: 4 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Rate per ₱5,000</Text>
            <InputNumber min={0} value={ct.juridicalRatePer5000} onChange={(v) => update('juridicalRatePer5000', v ?? 0)} style={{ width: 100, display: 'block', marginTop: 4 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Cap (₱)</Text>
            <InputNumber min={0} value={ct.juridicalCap} onChange={(v) => update('juridicalCap', v ?? 0)} style={{ width: 100, display: 'block', marginTop: 4 }} />
          </div>
        </Space>
      </Card>
    </>
  )
}

export function BarangayClearancePanel({ lobConfigs = [] }) {
  const dataSource = (lobConfigs || [])
    .filter((c) => c.isActive !== false)
    .map((c) => ({
      key: c._id || c.id,
      taxCode: getCharterTaxCodeLabel(c.taxCode),
      lineOfBusiness: c.lineOfBusiness,
      fee: c.barangayClearanceFee != null ? `₱${Number(c.barangayClearanceFee).toLocaleString()}` : '—',
    }))
  return (
    <>
      <Alert
        type="info"
        message="Edit in Fee by Line of Business"
        description="Barangay Business Clearance fee is set per line of business. Use the Fee by Line of Business tab to edit each row."
        style={{ marginBottom: 16 }}
        showIcon
      />
      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        Charter Artikulo A — per annum by LOB.
      </Text>
      <Table
        size="small"
        pagination={{ pageSize: 10 }}
        dataSource={dataSource}
        columns={[
          { title: 'Tax Code', dataIndex: 'taxCode', width: 160 },
          { title: 'Line of Business', dataIndex: 'lineOfBusiness', ellipsis: true },
          { title: 'Barangay Fee (₱)', dataIndex: 'fee', width: 120 },
        ]}
      />
    </>
  )
}

export function SpecialPermitPanel({ config, onUpdate }) {
  const sp = config?.specialPermit || {}
  const update = (key, value) => onUpdate({ specialPermit: { ...sp, [key]: value } })
  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Streamer: per sq yard for a fixed number of days. Motorcade/Promotional: per day. Charter table.
      </Text>
      <Space wrap size="middle">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Streamer — ₱ per sq yard</Text>
          <InputNumber min={0} value={sp.streamerPerSqYard} onChange={(v) => update('streamerPerSqYard', v ?? 0)} style={{ width: 120, display: 'block', marginTop: 4 }} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Streamer — days</Text>
          <InputNumber min={0} value={sp.streamerDays} onChange={(v) => update('streamerDays', v ?? 0)} style={{ width: 120, display: 'block', marginTop: 4 }} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Motorcade/Promotional — ₱ per day</Text>
          <InputNumber min={0} value={sp.motorcadePerDay} onChange={(v) => update('motorcadePerDay', v ?? 0)} style={{ width: 120, display: 'block', marginTop: 4 }} />
        </div>
      </Space>
    </>
  )
}

export function CertificationPanel({ config, onUpdate }) {
  const cert = config?.certificationOfBusinessRecord || { fee: 60, documentaryStamp: 30 }
  const copy = config?.certifiedTrueCopyPerDocument || { fee: 60, documentaryStamp: 30 }
  return (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Certification of Business Record and Certified True Copy of Business Permit. Charter fees: P60 + P30 documentary stamp.
      </Text>
      <Card size="small" title="Certification of Business Record" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Fee (₱)</Text>
            <InputNumber
              min={0}
              value={cert.fee}
              onChange={(v) => onUpdate({ certificationOfBusinessRecord: { ...cert, fee: v ?? 0 } })}
              style={{ width: 100, display: 'block', marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Documentary stamp (₱)</Text>
            <InputNumber
              min={0}
              value={cert.documentaryStamp}
              onChange={(v) => onUpdate({ certificationOfBusinessRecord: { ...cert, documentaryStamp: v ?? 0 } })}
              style={{ width: 100, display: 'block', marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>
      <Card size="small" title="Certified True Copy per document">
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Fee (₱)</Text>
            <InputNumber
              min={0}
              value={copy.fee}
              onChange={(v) => onUpdate({ certifiedTrueCopyPerDocument: { ...copy, fee: v ?? 0 } })}
              style={{ width: 100, display: 'block', marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Documentary stamp (₱)</Text>
            <InputNumber
              min={0}
              value={copy.documentaryStamp}
              onChange={(v) => onUpdate({ certifiedTrueCopyPerDocument: { ...copy, documentaryStamp: v ?? 0 } })}
              style={{ width: 100, display: 'block', marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>
    </>
  )
}
