import React from 'react'
import { Form } from 'antd'
import { useServiceTable } from "@/features/admin/services/hooks/useServiceTable.js"
import { useCategoryTable } from "@/features/admin/services/hooks/useCategoryTable.js"
import { fetchJsonWithFallback } from "@/lib/http.js"
import { notifyServiceUpdated } from "@/features/admin/services/lib/servicesEvents.js"
import { useNotifier } from '@/shared/notifications.js'

export function useEditServiceForm(selectedServiceId) {
  const { services, reloadServices, isLoading } = useServiceTable()
  const { categories } = useCategoryTable()
  const [form] = Form.useForm()
  const { success, error } = useNotifier()
  const [selectedId, setSelectedId] = React.useState(selectedServiceId || null)
  const [saving, setSaving] = React.useState(false)
  const currentImageList = Form.useWatch('image', form) || []
  const [hasChanges, setHasChanges] = React.useState(false)

  const selected = React.useMemo(() => {
    return services.find((s) => String(s.id) === String(selectedId)) || null
  }, [services, selectedId])

  React.useEffect(() => {
    if (selectedServiceId && selectedServiceId !== selectedId) {
      setSelectedId(selectedServiceId)
    }
  }, [selectedServiceId, selectedId])

  const beforeUpload = () => false
  const getImageValueFromEvent = (e) => {
    const files = e?.fileList || []
    return files.slice(-1).map((f) => {
      const origin = f?.originFileObj
      if (origin && !f.thumbUrl && !f.url) {
        try { f.thumbUrl = URL.createObjectURL(origin) } catch (err) { void err }
      }
      return f
    })
  }
  const onUploadChange = (info) => {
    const normalized = getImageValueFromEvent(info)
    form.setFieldsValue({ image: normalized })
  }
  const toDataURL = (file) => new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
    } catch (err) {
      reject(err)
    }
  })
  const toDataURLFromUrl = async (url) => {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
      } catch (err) {
        reject(err)
      }
    })
  }
  const onPreview = async (file) => {
    let src = file.url
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file.originFileObj)
        reader.onload = () => resolve(reader.result)
      })
    }
    const image = new Image()
    image.src = src
    const imgWindow = window.open(src)
    imgWindow?.document.write(image.outerHTML)
  }

  React.useEffect(() => {
    if (selected) {
      form.setFieldsValue({
        serviceId: selected.id,
        name: selected.name || '',
        description: selected.description || '',
        status: selected.status || undefined,
        categoryId: selected.categoryId || undefined,
        pricingMode: selected.pricingMode || 'fixed',
        priceMin: selected.priceMin ?? null,
        priceMax: selected.priceMax ?? null,
        hourlyRateMin: selected.hourlyRateMin ?? null,
        hourlyRateMax: selected.hourlyRateMax ?? null,
        image: selected.image && selected.image.dataURL
          ? [{
              uid: '-1',
              name: selected.image.filename || 'image',
              status: 'done',
              thumbUrl: selected.image.dataURL,
            }]
          : [],
      })
      setHasChanges(false)
    } else {
      form.resetFields()
      setHasChanges(false)
    }
  }, [selected, form])

  const onValuesChange = (_, allValues) => {
    const changed = (() => {
      if (!selected) return false
      const canon = (v) => (v === undefined || v === null || v === '' ? null : v)
      const numCanon = (v) => {
        if (v === undefined || v === null || v === '') return null
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }
      const diffs = []
      diffs.push(canon(allValues.name) !== canon(selected.name))
      diffs.push(canon(allValues.description) !== canon(selected.description))
      diffs.push(canon(allValues.status) !== canon(selected.status))
      diffs.push(canon(allValues.categoryId) !== canon(selected.categoryId))
      diffs.push(canon(allValues.pricingMode) !== canon(selected.pricingMode || 'fixed'))
      diffs.push(numCanon(allValues.priceMin) !== (selected.priceMin ?? null))
      diffs.push(numCanon(allValues.priceMax) !== (selected.priceMax ?? null))
      diffs.push(numCanon(allValues.hourlyRateMin) !== (selected.hourlyRateMin ?? null))
      diffs.push(numCanon(allValues.hourlyRateMax) !== (selected.hourlyRateMax ?? null))
      const selectedHasImage = !!(selected.image && selected.image.dataURL)
      const formHasImage = Array.isArray(allValues.image) && allValues.image.length > 0
      diffs.push(selectedHasImage !== formHasImage)
      return diffs.some(Boolean)
    })()
    setHasChanges(!!changed)
  }

  const onSave = async () => {
    try {
      const values = await form.validateFields()
      const id = String(selectedId || values.serviceId || '').trim()
      if (!id) {
        error('Select a service')
        return
      }
      const payload = {
        name: values.name,
        description: values.description,
        status: values.status,
        categoryId: values.categoryId,
        pricingMode: values.pricingMode,
        priceMin: values.priceMin,
        priceMax: values.priceMax,
        hourlyRateMin: values.hourlyRateMin,
        hourlyRateMax: values.hourlyRateMax,
      }
      // Image optional — include only if present
      const fileItem = Array.isArray(values.image) ? values.image[0] : null
      if (fileItem) {
        let dataURL = null
        const fileObj = fileItem.originFileObj
        if (fileObj) {
          dataURL = await toDataURL(fileObj)
        } else if (fileItem.thumbUrl) {
          if (String(fileItem.thumbUrl).startsWith('data:')) {
            dataURL = fileItem.thumbUrl
          } else {
            dataURL = await toDataURLFromUrl(fileItem.thumbUrl)
          }
        } else if (fileItem.url) {
          dataURL = await toDataURLFromUrl(fileItem.url)
        }
        if (dataURL) {
          payload.image = {
            filename: fileObj?.name || 'image',
            contentType: fileObj?.type || 'image/*',
            dataURL,
          }
        }
      }
      setSaving(true)
      const updated = await fetchJsonWithFallback(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      success('Service updated')
      setSaving(false)
      // Notify listeners (e.g., ServiceTable) to reload
      try { notifyServiceUpdated(updated) } catch (err) { void err }
      await reloadServices()
      // Reset edit form state after successful save
      try {
        form.resetFields()
      } catch (err) { void err }
      setHasChanges(false)
      setSelectedId(null)
    } catch (err) {
      setSaving(false)
      if (err?.message) error(err.message)
    }
  }

  return {
    // data
    services,
    categories,
    isLoading,
    selected,
    // form
    form,
    currentImageList,
    // selection
    selectedId,
    setSelectedId,
    // upload helpers
    beforeUpload,
    getImageValueFromEvent,
    onUploadChange,
    onPreview,
    // actions
    onSave,
    saving,
    hasChanges,
    onValuesChange,
  }
}