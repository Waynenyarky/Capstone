import React, { useEffect } from 'react'
import { Card, Form, Space, Typography, Divider, Switch, Input, InputNumber, Radio, TimePicker, Tag, Button } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'
import { WEEK_DAYS } from '@/features/provider/constants.js'
import ConfirmUpdateOfferingModal from '@/features/provider/offerings/components/ConfirmUpdateOfferingModal.jsx'

function OfferingFormCard({ offering, service, isSubmitting, updateOffering }) {
  const [form] = Form.useForm()
  const { success } = useNotifier()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmValues, setConfirmValues] = React.useState(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const prevOfferingIdRef = React.useRef(offering?.id)

  useEffect(() => {
    const currentId = offering?.id
    const shouldSync = prevOfferingIdRef.current !== currentId || !isDirty
    if (!shouldSync) return
    form.setFieldsValue({
      pricingMode: offering.pricingMode,
      fixedPrice: typeof offering.fixedPrice === 'number' ? offering.fixedPrice : null,
      hourlyRate: typeof offering.hourlyRate === 'number' ? offering.hourlyRate : null,
      emergencyAvailable: !!offering.emergencyAvailable,
      providerDescription: offering.providerDescription || '',
      active: !!offering.active,
      availability: (offering.availability || []).reduce((acc, av) => {
        acc[av.day] = {
          available: !!av.available,
          startTime: av.startTime ? dayjs(av.startTime, 'HH:mm') : null,
          endTime: av.endTime ? dayjs(av.endTime, 'HH:mm') : null,
        }
        return acc
      }, {}),
    })
    prevOfferingIdRef.current = currentId
  }, [offering, form, isDirty])

  // Normalize values to a payload-like shape for robust equality checks
  const toPayloadFromValues = (values) => ({
    pricingMode: values.pricingMode,
    fixedPrice: typeof values.fixedPrice === 'number' ? values.fixedPrice : null,
    hourlyRate: typeof values.hourlyRate === 'number' ? values.hourlyRate : null,
    emergencyAvailable: !!values.emergencyAvailable,
    providerDescription: values.providerDescription || '',
    active: !!values.active,
    // Ensure offering status aligns with activation toggle for public visibility
    status: values.active ? 'active' : 'inactive',
    availability: WEEK_DAYS.map((day) => {
      const d = values.availability?.[day] || {}
      return {
        day,
        available: !!d.available,
        startTime: d.startTime ? dayjs(d.startTime).format('HH:mm') : null,
        endTime: d.endTime ? dayjs(d.endTime).format('HH:mm') : null,
      }
    }),
  })

  const toPayloadFromOffering = (o) => ({
    pricingMode: o.pricingMode,
    fixedPrice: typeof o.fixedPrice === 'number' ? o.fixedPrice : null,
    hourlyRate: typeof o.hourlyRate === 'number' ? o.hourlyRate : null,
    emergencyAvailable: !!o.emergencyAvailable,
    providerDescription: o.providerDescription || '',
    active: !!o.active,
    availability: WEEK_DAYS.map((day) => {
      const d = (o.availability || []).find((a) => a.day === day) || {}
      return {
        day,
        available: !!d.available,
        startTime: d.startTime ?? null,
        endTime: d.endTime ?? null,
      }
    }),
  })

  // Recompute dirty state whenever offering changes
  useEffect(() => {
    const v = form.getFieldsValue()
    const current = toPayloadFromValues(v)
    const initial = toPayloadFromOffering(offering)
    setIsDirty(JSON.stringify(current) !== JSON.stringify(initial))
  }, [offering, form])

  const serviceMode = String(service?.pricingMode || 'fixed')
  const canFixed = serviceMode === 'fixed' || serviceMode === 'both'
  const canHourly = serviceMode === 'hourly' || serviceMode === 'both'

  const save = async () => {
    const values = form.getFieldsValue()
    setConfirmValues(values)
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    const values = confirmValues || form.getFieldsValue()
    const payload = toPayloadFromValues(values)
    const ok = await updateOffering(offering.id, payload)
    if (ok) success(`Saved ${offering.serviceName}`)
    setConfirmOpen(false)
    setConfirmValues(null)
    // Recompute dirty state after save
    const initial = toPayloadFromOffering({ ...offering, ...payload })
    const current = toPayloadFromValues(form.getFieldsValue())
    setIsDirty(JSON.stringify(current) !== JSON.stringify(initial))
  }

  return (
    <Card title={offering.serviceName} variant="outlined">
      <Form
        form={form}
        layout="vertical"
        onFinish={save}
        onValuesChange={(_, allValues) => {
          const current = toPayloadFromValues(allValues)
          const initial = toPayloadFromOffering(offering)
          setIsDirty(JSON.stringify(current) !== JSON.stringify(initial))
        }}
      >
        <Form.Item label="Pricing Mode" name="pricingMode">
          <Radio.Group
            options={[
              { label: 'Fixed price', value: 'fixed', disabled: !canFixed },
              { label: 'Hourly rate', value: 'hourly', disabled: !canHourly },
              { label: 'Both', value: 'both', disabled: serviceMode !== 'both' },
            ]}
          />
        </Form.Item>

        {canFixed && (
          <Form.Item label={`Fixed Price${typeof service?.priceMin === 'number' && typeof service?.priceMax === 'number' ? ` (${service.priceMin}–${service.priceMax})` : ''}`} name="fixedPrice">
            <InputNumber style={{ width: '100%' }} min={service?.priceMin ?? undefined} max={service?.priceMax ?? undefined} />
          </Form.Item>
        )}
        {canHourly && (
          <Form.Item label={`Hourly Rate${typeof service?.hourlyRateMin === 'number' && typeof service?.hourlyRateMax === 'number' ? ` (${service.hourlyRateMin}–${service.hourlyRateMax})` : ''}`} name="hourlyRate">
            <InputNumber style={{ width: '100%' }} min={service?.hourlyRateMin ?? undefined} max={service?.hourlyRateMax ?? undefined} />
          </Form.Item>
        )}

        <Divider />
        <Typography.Text strong>Weekly Availability</Typography.Text>
        {WEEK_DAYS.map((day) => (
          <Space key={`${offering.id}-${day}`} align="center" style={{ display: 'flex', marginTop: 8 }}>
            <Tag style={{ width: 60, textAlign: 'center' }}>{day.toUpperCase()}</Tag>
            <Form.Item name={["availability", day, 'available']} valuePropName="checked" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
            <Form.Item name={["availability", day, 'startTime']} style={{ margin: 0 }}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name={["availability", day, 'endTime']} style={{ margin: 0 }}>
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>
        ))}

        <Divider />
        <Form.Item name="emergencyAvailable" valuePropName="checked" label="Available for emergency calls?">
          <Switch />
        </Form.Item>
        <Form.Item label="Your service description" name="providerDescription">
          <Input.TextArea rows={3} placeholder="Describe how you provide this service" />
        </Form.Item>
        <Form.Item name="active" valuePropName="checked" label="Activate this service">
          <Switch />
        </Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button htmlType="submit" type="primary" loading={isSubmitting} disabled={!isDirty}>Save</Button>
        </Space>
      </Form>
      <ConfirmUpdateOfferingModal
        open={confirmOpen}
        offering={offering}
        values={confirmValues}
        onConfirm={handleConfirmSave}
        onCancel={() => { setConfirmOpen(false); setConfirmValues(null) }}
        confirmLoading={isSubmitting}
        okDisabled={!isDirty}
      />
    </Card>
  )
}

export default OfferingFormCard