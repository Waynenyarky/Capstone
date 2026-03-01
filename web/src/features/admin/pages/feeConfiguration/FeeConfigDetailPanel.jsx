import React, { useEffect } from 'react'
import { Form } from '@/shared/components/AppForm'
import {
  InputNumber,
  Input,
  Select,
  Button,
  Space,
  Typography,
  theme,
  Empty,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { CHARTER_TAX_CODE_OPTIONS } from '@/constants/charterTaxCodes.js'

const { Text } = Typography

const BRACKET_KIND_OPTIONS = [
  { value: 'rate', label: 'Rate (single rate on full amount)' },
  { value: 'tiered', label: 'Tiered (rate per bracket segment)' },
  { value: 'fixed', label: 'Fixed (amount per bracket)' },
]

/** Charter Annex 1 (OCBPLO 2025) business tax categories — exact section labels. */
const BUSINESS_TAX_CATEGORY_OPTIONS = [
  { value: 'Annex 1 (a) — Manufacturers', label: 'Annex 1 (a) — Manufacturers' },
  { value: 'Annex 1 (b) — Wholesalers/Distributors', label: 'Annex 1 (b) — Wholesalers/Distributors' },
  { value: 'Annex 1 (c) — Exporters / Essential commodities', label: 'Annex 1 (c) — Exporters / Essential commodities' },
  { value: 'Annex 1 (d) — Retailers', label: 'Annex 1 (d) — Retailers' },
  { value: 'Annex 1 (e) — Contractors', label: 'Annex 1 (e) — Contractors' },
  { value: 'Annex 1 (f) — Banks/Financial', label: 'Annex 1 (f) — Banks/Financial' },
  { value: 'Annex 1 (g) — Peddlers', label: 'Annex 1 (g) — Peddlers' },
  { value: 'Annex 1 (h) — Other (2.2% / 1.1%)', label: 'Annex 1 (h) — Other (2.2% / 1.1%)' },
  { value: 'Annex 1 (i) — Public utility vehicles', label: 'Annex 1 (i) — Public utility vehicles' },
]

export default function FeeConfigDetailPanel({
  config,
  configs = [],
  saving,
  onSave,
  onDelete,
  onCancel,
}) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()

  const isCreate = config && (config._id == null)
  const isEmpty = !config

  useEffect(() => {
    if (config && (config._id != null || config.lineOfBusiness)) {
      form.setFieldsValue({
        taxCode: config.taxCode != null && config.taxCode !== '' ? config.taxCode : undefined,
        lineOfBusiness: config.lineOfBusiness,
        mayorsPermitFee: config.mayorsPermitFee,
        environmentalProtectionFee: config.environmentalProtectionFee ?? undefined,
        barangayClearanceFee: config.barangayClearanceFee ?? undefined,
        businessTaxCategory: config.businessTaxCategory || '',
        bracketKind: config.bracketKind || 'rate',
        brackets: (config.brackets || []).map((b) => ({
          min: b.min,
          max: b.max ?? undefined,
          rate: b.rate ?? undefined,
          amount: b.amount ?? undefined,
        })),
      })
    } else if (!config || isCreate) {
      form.resetFields()
      if (isCreate) form.setFieldsValue({ bracketKind: 'rate', brackets: [] })
    }
  }, [config, form, isCreate])

  const bracketKind = Form.useWatch('bracketKind', form) || 'rate'
  const businessTaxCategory = Form.useWatch('businessTaxCategory', form)
  const useFixed = bracketKind === 'fixed'

  const businessTaxCategoryOptions = React.useMemo(() => {
    const current = businessTaxCategory
    const hasCurrent = current && typeof current === 'string' && current.trim() !== ''
    const inList = BUSINESS_TAX_CATEGORY_OPTIONS.some((o) => o.value === current)
    if (hasCurrent && !inList) {
      return [...BUSINESS_TAX_CATEGORY_OPTIONS, { value: current, label: current }]
    }
    return BUSINESS_TAX_CATEGORY_OPTIONS
  }, [businessTaxCategory])

  if (isEmpty) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">Select a line of business to view or edit, or add a new one.</Text>}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: 16, flex: 1, minHeight: 0 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              taxCode: values.taxCode != null && values.taxCode !== '' ? String(values.taxCode).trim() : '',
              lineOfBusiness: (values.lineOfBusiness || '').trim(),
              mayorsPermitFee: values.mayorsPermitFee,
              environmentalProtectionFee: values.environmentalProtectionFee ?? null,
              barangayClearanceFee: values.barangayClearanceFee ?? null,
              businessTaxCategory: values.businessTaxCategory || '',
              bracketKind: values.bracketKind || 'rate',
              brackets: (values.brackets || []).map((b) => ({
                min: b.min,
                max: b.max ?? null,
                rate: b.rate ?? null,
                amount: b.amount ?? null,
              })),
            }
            onSave(config._id ?? null, payload)
          }}
        >
          <Form.Item
            name="taxCode"
            label="Tax code (industry category)"
            rules={[{ required: true, message: 'Select the Charter tax code (industry category).' }]}
            extra="Charter category 1–12; each number represents an industry (e.g. 6 = Food Industries)."
          >
            <Select
              showSearch
              placeholder="Select tax code (e.g. 6 — Food Industries)"
              optionFilterProp="label"
              options={CHARTER_TAX_CODE_OPTIONS}
              allowClear={false}
            />
          </Form.Item>
          <Form.Item
            name="lineOfBusiness"
            label="Line of business"
            rules={[{ required: true, message: 'Enter the line of business description.' }]}
            extra="Enter the line of business in plain text (sentence only, no tax code). e.g. Canteens, Eateries, Food Stands - Less than 8 sq.m."
          >
            <Input placeholder="e.g. Restaurants - Above 50 sq.m." />
          </Form.Item>
          <Form.Item name="mayorsPermitFee" label="Mayor's Permit Fee (₱)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="environmentalProtectionFee"
            label="Environmental Protection Fee (₱)"
            extra="Charter 4W.01 — per annum, optional."
          >
            <InputNumber min={0} placeholder="Optional" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="barangayClearanceFee"
            label="Barangay Business Clearance Fee (₱)"
            extra="Charter Artikulo A — per annum, optional."
          >
            <InputNumber min={0} placeholder="Optional" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="businessTaxCategory" label="Business Tax Category">
            <Select
              allowClear
              showSearch
              placeholder="Select tax category"
              optionFilterProp="label"
              options={businessTaxCategoryOptions}
            />
          </Form.Item>
          <Form.Item name="bracketKind" label="Tax calculation type">
            <Select options={BRACKET_KIND_OPTIONS} />
          </Form.Item>

          <Text strong style={{ display: 'block', marginBottom: 8 }}>Tax brackets</Text>
          <Form.List name="brackets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" wrap>
                    <Form.Item {...restField} name={[name, 'min']} rules={[{ required: true }]}>
                      <InputNumber placeholder="Min" min={0} style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'max']}>
                      <InputNumber placeholder="Max" min={0} style={{ width: 100 }} />
                    </Form.Item>
                    {useFixed ? (
                      <Form.Item {...restField} name={[name, 'amount']} rules={[{ required: true }]}>
                        <InputNumber placeholder="Amount ₱" min={0} style={{ width: 120 }} />
                      </Form.Item>
                    ) : (
                      <Form.Item {...restField} name={[name, 'rate']} rules={[{ required: true }]}>
                        <InputNumber placeholder="Rate %" min={0} max={100} step={0.001} style={{ width: 100 }} />
                      </Form.Item>
                    )}
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add bracket
                </Button>
              </>
            )}
          </Form.List>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isCreate ? 'Create Fee Configuration' : 'Save Changes'}
            </Button>
            {isCreate && onCancel && (
              <Button onClick={onCancel}>Cancel</Button>
            )}
            {onDelete && config._id != null && (
              <Button danger onClick={() => onDelete(config._id)}>
                Delete Configuration
              </Button>
            )}
          </Space>
        </Form>
      </div>
    </div>
  )
}
