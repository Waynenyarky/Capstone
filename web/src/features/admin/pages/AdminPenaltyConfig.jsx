import React, { useState, useEffect, useCallback } from 'react'
import { Form, InputNumber, DatePicker, Button, Spin, Alert, Typography, Space, Popconfirm, message } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import AdminLayout from '../components/AdminLayout.jsx'
import { get, post, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { useAdminStepUp } from '../hooks/useAdminStepUp'

const { Title, Text } = Typography

export default function AdminPenaltyConfig() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [configId, setConfigId] = useState(null)
  const [error, setError] = useState(null)
  const { success, error: notifyError } = useNotifier()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

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
      <AdminLayout pageTitle="Penalty Configuration" pageIcon={<SafetyCertificateOutlined />}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin tip="Loading penalty configuration...">
            <div style={{ minHeight: 48 }} />
          </Spin>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout pageTitle="Penalty Configuration" pageIcon={<SafetyCertificateOutlined />}>
        <div style={{ padding: 24 }}>
          <Alert
            type="error"
            message="Failed to load"
            description={error}
            action={<Button onClick={fetchConfig}>Retry</Button>}
          />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="Penalty Configuration" pageIcon={<SafetyCertificateOutlined />}>
      {stepUpModal}
      <div style={{ padding: 24, maxWidth: 600 }}>
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
              Save
            </Button>
            <Popconfirm
              title="Reset to defaults?"
              description="This will reset surcharge to 25%, interest to 2%, and start day to 20."
              onConfirm={handleReset}
              okText="Reset"
              cancelText="Cancel"
            >
              <Button loading={resetting}>Reset to Defaults</Button>
            </Popconfirm>
          </Space>
        </Form>
      </div>
    </AdminLayout>
  )
}
