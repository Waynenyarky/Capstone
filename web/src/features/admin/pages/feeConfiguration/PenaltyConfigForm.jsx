import { useState, useEffect, useCallback, useMemo } from 'react'
import { Form } from '@/shared/components/AppForm'
import { InputNumber, DatePicker, Button, Alert, Space, Popconfirm, message, Card, Typography, Divider, Splitter, theme } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { CalculatorOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { get, post, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'

const { Text } = Typography

/** Replicate backend computePenalty logic for the example scenario */
function computePenaltyExample(baseFees, submissionDate, config) {
  const surchargePercentage = config.surchargePercentage ?? 25
  const monthlyInterestRate = config.monthlyInterestRate ?? 2
  const penaltyStartDay = config.penaltyStartDay ?? 20

  const now = submissionDate ? submissionDate.toDate() : new Date()
  const year = now.getFullYear()
  const penaltyDate = new Date(year, 0, penaltyStartDay, 23, 59, 59)

  if (now <= penaltyDate) {
    return { surcharge: 0, interest: 0, totalPenalty: 0, monthsLate: 0, applies: false }
  }

  const surcharge = baseFees * (surchargePercentage / 100)
  const monthsLate = Math.max(0, now.getMonth())
  const interest = (baseFees + surcharge) * (monthlyInterestRate / 100) * monthsLate

  return {
    surcharge: Math.round(surcharge * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    totalPenalty: Math.round((surcharge + interest) * 100) / 100,
    monthsLate,
    applies: true,
  }
}

export default function PenaltyConfigForm() {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [configId, setConfigId] = useState(null)
  const [error, setError] = useState(null)
  const [exampleBaseFees, setExampleBaseFees] = useState(10000)
  const [exampleDate, setExampleDate] = useState(() => {
    const y = new Date().getFullYear()
    return dayjs(new Date(y, 2, 15))
  })
  const { success, error: notifyError } = useNotifier()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const surchargePct = Form.useWatch('surchargePercentage', form) ?? 25
  const interestRate = Form.useWatch('monthlyInterestRate', form) ?? 2
  const startDay = Form.useWatch('penaltyStartDay', form) ?? 20
  const penaltyConfig = useMemo(
    () => ({ surchargePercentage: surchargePct, monthlyInterestRate: interestRate, penaltyStartDay: startDay }),
    [surchargePct, interestRate, startDay]
  )
  const exampleResult = useMemo(
    () => computePenaltyExample(exampleBaseFees, exampleDate, penaltyConfig),
    [exampleBaseFees, exampleDate, penaltyConfig]
  )
  const totalDue = exampleBaseFees + exampleResult.totalPenalty
  const penaltyDeadline = `January ${startDay}, 23:59`

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await get('/api/admin/penalty-configuration')
      const config = res?.data
      if (config) {
        setConfigId(config._id)
        form.setFieldsValue({
          surchargePercentage: config.surchargePercentage,
          monthlyInterestRate: config.monthlyInterestRate,
          penaltyStartDay: config.penaltyStartDay,
          effectiveDate: config.effectiveDate ? dayjs(config.effectiveDate) : dayjs(),
        })
      }
    } catch (err) {
      setError(err?.message || 'Failed to load penalty configuration')
    } finally {
      setLoading(false)
    }
  }, [form])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = useCallback(async (values) => {
    try {
      setSaving(true)
      await runWithStepUp(async (stepUpToken) => {
        const headers = { 'X-Step-Up-Token': stepUpToken }
        const payload = {
          surchargePercentage: values.surchargePercentage,
          monthlyInterestRate: values.monthlyInterestRate,
          penaltyStartDay: values.penaltyStartDay,
          effectiveDate: values.effectiveDate?.toISOString?.() || new Date().toISOString(),
        }
        let res
        if (configId) {
          res = await put(`/api/admin/penalty-configuration/${configId}`, payload, { headers })
        } else {
          res = await post('/api/admin/penalty-configuration', payload, { headers })
          if (res?.data?._id) setConfigId(res.data._id)
        }
        if (res?.warnings?.length) {
          res.warnings.forEach((w) => message.warning(w))
        }
        success('Penalty configuration saved')
      })
    } catch (err) {
      if (err?.message !== 'Step-up cancelled') notifyError(err, 'Failed to save penalty configuration')
    } finally {
      setSaving(false)
    }
  }, [configId, success, notifyError, runWithStepUp])

  const handleReset = useCallback(async () => {
    try {
      setResetting(true)
      await runWithStepUp(async (stepUpToken) => {
        const res = await post('/api/admin/penalty-configuration/reset', {}, { headers: { 'X-Step-Up-Token': stepUpToken } })
        if (res?.data) {
          setConfigId(res.data._id)
          form.setFieldsValue({
            surchargePercentage: res.data.surchargePercentage,
            monthlyInterestRate: res.data.monthlyInterestRate,
            penaltyStartDay: res.data.penaltyStartDay,
            effectiveDate: dayjs(res.data.effectiveDate),
          })
        }
        success('Reset to defaults')
      })
    } catch (err) {
      if (err?.message !== 'Step-up cancelled') notifyError(err, 'Failed to reset')
    } finally {
      setResetting(false)
    }
  }, [form, success, notifyError, runWithStepUp])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <LottieSpinner tip="Loading penalty configuration...">
          <div style={{ minHeight: 80 }} />
        </LottieSpinner>
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

  const formPanel = (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <Alert
        type="info"
        message="Changes apply from the effective date forward. They are not retroactive."
        style={{ marginBottom: 24 }}
        showIcon
      />
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          surchargePercentage: 25,
          monthlyInterestRate: 2,
          penaltyStartDay: 20,
          effectiveDate: dayjs(),
        }}
      >
        <Form.Item
          name="surchargePercentage"
          label="Surcharge Percentage (%)"
          rules={[{ required: true, message: 'Required' }]}
          tooltip="Applied as a one-time surcharge on late renewals"
        >
          <InputNumber min={0} max={100} precision={1} addonAfter="%" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="monthlyInterestRate"
          label="Monthly Interest Rate (%)"
          rules={[{ required: true, message: 'Required' }]}
          tooltip="Applied per calendar month on (fees + surcharge) for each month past deadline"
        >
          <InputNumber min={0} max={100} precision={2} addonAfter="%" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="penaltyStartDay"
          label="Penalty Start Day (January)"
          rules={[{ required: true, message: 'Required' }]}
          tooltip="Penalty applies if renewal submitted after January <this day>"
          extra="Penalty applies if renewal is submitted after this day in January"
        >
          <InputNumber min={1} max={31} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="effectiveDate"
          label="Effective Date"
          rules={[{ required: true, message: 'Required' }]}
          tooltip="Changes take effect from this date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save Changes
          </Button>
          <Popconfirm
            title="Reset to defaults?"
            description="This will reset surcharge to 25%, interest to 2%, and start day to 20."
            onConfirm={handleReset}
            okText="Reset to Defaults"
            cancelText="Cancel"
          >
            <Button loading={resetting}>Reset to Defaults</Button>
          </Popconfirm>
        </Space>
      </Form>
    </div>
  )

  const scenarioPanel = (
    <div style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={
          <span>
            <CalculatorOutlined style={{ marginRight: 8 }} />
            Example calculation
          </span>
        }
        style={{ flex: 1, margin: 24, marginLeft: 16 }}
        size="small"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          See how penalty is applied with the current settings. Change the scenario or the values on the left to update the result.
        </Text>
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Base fees (₱)</Text>
            <InputNumber
              min={0}
              value={exampleBaseFees}
              onChange={(v) => setExampleBaseFees(v ?? 0)}
              formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/₱\s?|,/g, '')}
              style={{ width: 140, display: 'block', marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Submission date</Text>
            <DatePicker
              value={exampleDate}
              onChange={(d) => setExampleDate(d || dayjs())}
              style={{ width: 160, display: 'block', marginTop: 4 }}
              format="MMM D, YYYY"
            />
          </div>
        </Space>
        <Divider style={{ margin: '12px 0' }} />
        {exampleResult.applies ? (
          <>
            <Text>
              Renewal submitted after {penaltyDeadline} — penalty applies.
            </Text>
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary">Surcharge ({surchargePct}% of ₱{exampleBaseFees.toLocaleString()})</Text>
                <Text>₱{exampleResult.surcharge.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary">
                  Interest ({interestRate}% × {exampleResult.monthsLate} month{exampleResult.monthsLate !== 1 ? 's' : ''} on ₱{(exampleBaseFees + exampleResult.surcharge).toLocaleString()})
                </Text>
                <Text>₱{exampleResult.interest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                <Text strong>Total penalty</Text>
                <Text strong>₱{exampleResult.totalPenalty.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Text strong>Total due (base + penalty)</Text>
                <Text strong>₱{totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </div>
            </div>
          </>
        ) : (
          <Text>
            Renewal on or before {penaltyDeadline} — no penalty. Total due: <strong>₱{exampleBaseFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>.
          </Text>
        )}
      </Card>
    </div>
  )

  return (
    <>
    <Splitter style={{ height: '100%', minHeight: 400 }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {formPanel}
      </Splitter.Panel>
      <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {scenarioPanel}
      </Splitter.Panel>
    </Splitter>
    {stepUpModal}
    </>
  )
}
