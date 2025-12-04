import React from 'react'
import { Form, DatePicker, Button, Flex, Card, Input, Select, Tag, Radio, InputNumber, Typography } from 'antd'
import { appointmentRules } from "@/features/customer/appointments/validations/appointmentRules.js"
import { useAppointmentForm } from "@/features/customer/appointments/hooks/useAppointmentForm.js"
import { useCustomerAddresses } from '@/features/customer/addresses/hooks/useCustomerAddresses.js'
import { useAuthSession } from '@/features/authentication'
import { authHeaders } from '@/lib/authHeaders.js'
import { createAppointment } from '@/features/customer/services/appointmentsService.js'
import { useNotifier } from '@/shared/notifications.js'

export default function BookAppointmentForm({ onFinish, selectedService }) {
  const { form, disabledDate, disabledTime } = useAppointmentForm(undefined, selectedService)
  const { addresses, primary } = useCustomerAddresses()
  const { currentUser } = useAuthSession()
  const { success, error } = useNotifier()
  const addressOptions = (Array.isArray(addresses) ? addresses : []).map((a) => ({
    label: (a.label ? `${a.label} — ` : '') + `${a.city}${a.province ? `, ${a.province}` : ''}`,
    value: a.id,
  }))
  React.useEffect(() => {
    if (primary?.id) {
      form.setFieldsValue({ serviceAddressId: primary.id })
    }
  }, [primary, form])

  const pricingMode = String(selectedService?.pricingMode || 'fixed')
  const fixedPrice = selectedService?.fixedPrice
  const hourlyRate = selectedService?.hourlyRate

  const handleRequestSubmit = async (values) => {
    try {
      const payload = {
        offeringId: selectedService?.id,
        serviceId: values.serviceId,
        providerId: values.providerId,
        serviceAddressId: values.serviceAddressId,
        appointment: values.appointment?.toISOString?.() || values.appointment,
        notes: values.notes || '',
        pricingSelection: values.pricingSelection || (pricingMode === 'hourly' ? 'hourly' : 'fixed'),
        estimatedHours: values.pricingSelection === 'hourly' || pricingMode === 'hourly' ? Number(values.estimatedHours || 0) : undefined,
      }
      const headers = authHeaders(currentUser, 'customer')
      await createAppointment(payload, headers)
      success('Appointment request submitted')
      if (typeof onFinish === 'function') onFinish(values)
      form.resetFields(['appointment', 'notes', 'estimatedHours'])
    } catch (e) {
      error(typeof e?.message === 'string' ? e.message : 'Failed to submit appointment')
    }
  }
  return (
    <Card title="Request Appointment">
      <Form form={form} layout="vertical" onFinish={handleRequestSubmit}>
        {selectedService && (
          <Form.Item name="serviceName" label="Selected Service">
            <Input value={selectedService?.serviceName} disabled />
          </Form.Item>
        )}
        {selectedService && (
          <Form.Item name="providerName" label="Provider">
            <Input value={selectedService?.providerName} disabled />
          </Form.Item>
        )}
        <Form.Item name="offeringId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="serviceId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="providerId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="serviceAddressId" label="Service Address" rules={[{ required: true, message: 'Select the address for the service' }]}> 
          <Select
            options={addressOptions}
            placeholder={primary ? `Default: ${primary.city}${primary.province ? `, ${primary.province}` : ''}` : 'Choose address'}
          />
        </Form.Item>
        <Form.Item
          name="appointment"
          label="Desired Appointment Date & Time"
          rules={appointmentRules}
        >
          <DatePicker
            format="YYYY-MM-DD HH:mm"
            disabledDate={disabledDate}
            showTime={{ format: 'HH:mm' }}
            disabledTime={disabledTime}
            style={{ width: '100%' }}
          />
        </Form.Item>
        {pricingMode === 'both' && (
          <Form.Item name="pricingSelection" label="Pricing">
            <Radio.Group>
              <Radio value="fixed">Fixed {typeof fixedPrice === 'number' ? `— ${fixedPrice}` : ''}</Radio>
              <Radio value="hourly">Hourly {typeof hourlyRate === 'number' ? `— ${hourlyRate}/hr` : ''}</Radio>
            </Radio.Group>
          </Form.Item>
        )}
        {pricingMode === 'hourly' && (
          <Typography.Paragraph>
            Pricing: Hourly {typeof hourlyRate === 'number' ? `— ${hourlyRate}/hr` : ''}
          </Typography.Paragraph>
        )}
        {pricingMode === 'fixed' && (
          <Typography.Paragraph>
            Pricing: Fixed {typeof fixedPrice === 'number' ? `— ${fixedPrice}` : ''}
          </Typography.Paragraph>
        )}
        {(pricingMode === 'hourly' || (pricingMode === 'both')) && (
          <Form.Item name="estimatedHours" label="Estimated Hours" rules={pricingMode === 'hourly' ? [{ required: true, message: 'Provide estimated hours' }] : []}>
            <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} placeholder="Add any details for the provider" />
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit">Request Appointment</Button>
        </Flex>
      </Form>
    </Card>
  )
}