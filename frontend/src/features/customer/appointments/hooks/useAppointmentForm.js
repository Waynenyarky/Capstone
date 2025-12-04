import dayjs from 'dayjs'
import { Form } from 'antd'
import { useEffect } from 'react'
import { useNotifier } from '@/shared/notifications.js'

export function useAppointmentForm(onSubmit, selectedService) {
  const [form] = Form.useForm()
  const { success } = useNotifier()

  const disabledDate = (current) => {
    if (!current) return false
    // No past dates
    if (current.startOf('day').isBefore(dayjs().startOf('day'))) return true
    // Disable days outside provider availability (if provided)
    const availability = Array.isArray(selectedService?.availability) ? selectedService.availability : []
    if (availability.length === 0) return false
    const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const key = map[current.day()]
    const entry = availability.find((a) => a && a.day === key)
    if (!entry || !entry.available) return true
    return false
  }

  const disabledTime = (current) => {
    const availability = Array.isArray(selectedService?.availability) ? selectedService.availability : []
    const fullHours = Array.from({ length: 24 }, (_, i) => i)
    const fullMinutes = Array.from({ length: 60 }, (_, i) => i)
    // Do not disable seconds; antd requires a valid seconds value even when not shown
    if (!current || availability.length === 0) {
      return { disabledHours: () => [], disabledMinutes: () => [], disabledSeconds: () => [] }
    }
    const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const key = map[current.day()]
    const entry = availability.find((a) => a && a.day === key)
    if (!entry || !entry.available) {
      return { disabledHours: () => fullHours, disabledMinutes: () => fullMinutes, disabledSeconds: () => [] }
    }
    if (!entry.startTime || !entry.endTime) {
      // Entire day available
      return { disabledHours: () => [], disabledMinutes: () => [], disabledSeconds: () => [] }
    }
    const [sH, sM] = String(entry.startTime).split(':').map((v) => parseInt(v, 10))
    const [eH, eM] = String(entry.endTime).split(':').map((v) => parseInt(v, 10))
    const disabledHours = () => fullHours.filter((h) => h < sH || h > eH)
    const disabledMinutes = (hour) => {
      if (hour < sH || hour > eH) return fullMinutes
      if (hour === sH && hour === eH) {
        // Single-hour window
        return fullMinutes.filter((m) => m < sM || m > eM)
      }
      if (hour === sH) return fullMinutes.filter((m) => m < sM)
      if (hour === eH) return fullMinutes.filter((m) => m > eM)
      return []
    }
    return { disabledHours, disabledMinutes, disabledSeconds: () => [] }
  }

  const handleFinish = (values) => {
    success('Appointment submitted')
    if (typeof onSubmit === 'function') onSubmit(values)
  }

  const reset = () => form.resetFields()

  useEffect(() => {
    const serviceId = selectedService?.serviceId || null
    const serviceName = selectedService?.serviceName || ''
    const providerId = selectedService?.providerId || null
    const providerName = selectedService?.providerName || ''
    const offeringId = selectedService?.id || null
    const next = {}
    if (serviceId) next.serviceId = serviceId
    if (serviceName) next.serviceName = serviceName
    if (providerId) next.providerId = providerId
    if (providerName) next.providerName = providerName
    if (offeringId) next.offeringId = offeringId
    if (Object.keys(next).length > 0) {
      form.setFieldsValue(next)
    }
  }, [selectedService, form])

  return { form, disabledDate, disabledTime, handleFinish, reset }
}