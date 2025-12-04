import { Form, App } from 'antd'
import { SERVICE_STATUS_OPTIONS, SERVICE_STATUS } from "@/features/admin/services/constants/serviceStatus.js"
import { notifyServiceCreated } from "@/features/admin/services/lib/servicesEvents.js"
import { fetchJsonWithFallback, fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useServiceForm(onSubmit) {
  const [form] = Form.useForm()
  const { success, error } = useNotifier()
  const maxCount = 1

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

  // Prevent auto-upload; keep file in the Form field
  const beforeUpload = () => false

  // Map Upload onChange event to Form field value (enforce maxCount) and attach preview URLs
  const getImageValueFromEvent = (e) => {
    const files = e?.fileList || []
    return files.slice(-maxCount).map((f) => {
      const origin = f?.originFileObj
      if (origin && !f.thumbUrl && !f.url) {
        try {
          // Create a blob URL for instant local preview
          f.thumbUrl = URL.createObjectURL(origin)
        } catch (err) { void err }
      }
      return f
    })
  }

  // No explicit onChange needed; Form.Item value mapping handles it
  // Provide explicit Upload change handler to ensure Form field is updated reliably
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
    const isRelative = typeof url === 'string' && url.startsWith('/')
    const res = isRelative ? await fetchWithFallback(url) : await fetch(url)
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

  const handleFinish = async (values) => {
    try {
      const fileItem = Array.isArray(values.image) ? values.image[0] : null
      if (!fileItem) throw new Error('Please upload an image')

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
      if (!dataURL) throw new Error('Could not read image file')
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
        image: {
          filename: fileObj?.name || 'image',
          contentType: fileObj?.type || 'image/*',
          dataURL,
        },
      }

      const created = await fetchJsonWithFallback('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      success('Service created')
      form.resetFields()
      if (typeof onSubmit === 'function') onSubmit(created)
      notifyServiceCreated(created)
    } catch (err) {
      console.error('Create service failed:', err)
      error(err, 'Create service failed')
    }
  }

  const reset = () => form.resetFields()

  return {
    form,
    handleFinish,
    reset,
    statusOptions: SERVICE_STATUS_OPTIONS,
    SERVICE_STATUS,
    // upload
    onPreview,
    beforeUpload,
    maxCount,
    getImageValueFromEvent,
    onUploadChange,
  }
}