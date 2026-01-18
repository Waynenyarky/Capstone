import React, { useState, useEffect } from 'react'
import { Card, Form, Upload, Button, Space, Typography, Alert, List, App } from 'antd'
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { saveBIRRegistration, uploadBusinessRegistrationFile } from '../services/businessRegistrationService'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Text } = Typography

export default function BIRRegistrationStep({ businessId, initialData, onSave, onNext, inModal = false }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  // Check if business is new
  const isNewBusiness = !businessId || businessId === 'new'
  const storageKey = `business_registration_bir_${businessId || 'new'}`

  useEffect(() => {
    const buildFormValues = (data) => {
      if (!data || typeof data !== 'object') return null
      const formValues = {
        ...data
      }
      
      // Convert URL strings to file objects for Upload components
      if (data.paymentReceiptUrl && typeof data.paymentReceiptUrl === 'string') {
        const urlParts = data.paymentReceiptUrl.split('/')
        const filename = urlParts[urlParts.length - 1] || 'payment_receipt.pdf'
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.paymentReceiptUrl)
        const displayUrl = resolveAvatarUrl(data.paymentReceiptUrl)
        formValues.paymentReceiptUrl = [{
          uid: `-payment-receipt-${Date.now()}`,
          name: filename,
          status: 'done',
          url: displayUrl,
          thumbUrl: isImage ? displayUrl : undefined,
          response: { url: data.paymentReceiptUrl }
        }]
      }
      
      // Ensure upload fields are always arrays
      if (!formValues.paymentReceiptUrl || !Array.isArray(formValues.paymentReceiptUrl)) {
        formValues.paymentReceiptUrl = []
      }

      return formValues
    }

    const loadStored = () => {
      try {
        const stored = sessionStorage.getItem(storageKey)
        if (stored) {
          return JSON.parse(stored)
        }
      } catch (e) {
        // Ignore storage errors
      }
      return null
    }

    const storedData = loadStored()
    const hasUploadUrls = (data) => {
      if (!data || typeof data !== 'object') return false
      return ['paymentReceiptUrl'].some((field) => {
        const value = data[field]
        return typeof value === 'string' && value.trim() !== ''
      })
    }

    const sourceData = hasUploadUrls(initialData)
      ? initialData
      : (storedData || initialData)
    const formValues = buildFormValues(sourceData)
    if (formValues) {
      form.setFieldsValue(formValues)
    } else {
      form.setFieldsValue({
        paymentReceiptUrl: []
      })
    }
  }, [initialData, form, storageKey])

  const persistBirField = (fieldName, url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return
    try {
      const stored = sessionStorage.getItem(storageKey)
      const parsed = stored ? JSON.parse(stored) : {}
      const updated = { ...parsed, [fieldName]: url }
      sessionStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      // Ignore storage errors
    }
  }

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e
    }
    if (e?.fileList) {
      return Array.isArray(e.fileList) ? e.fileList : []
    }
    // Ensure we always return an array
    return []
  }

  const customUploadRequest = async ({ file, onSuccess, onError, onProgress }, fieldName) => {
    try {
      const result = await uploadBusinessRegistrationFile(businessId, file, fieldName)
      const uploadedUrl = result?.url
      if (!uploadedUrl) {
        throw new Error('Upload failed: missing file URL')
      }
      const displayUrl = resolveAvatarUrl(uploadedUrl)
      message.success(`File ${file.name} uploaded successfully`)
      
      // Update the file object with the URL before calling onSuccess
      const updatedFile = {
        ...file,
        status: 'done',
        url: displayUrl,
        thumbUrl: /\.(jpg|jpeg|png|gif|webp)$/i.test(uploadedUrl) ? displayUrl : undefined,
        response: { url: uploadedUrl }
      }
      
      // Call onSuccess with the response - Ant Design will automatically update file.response
      onSuccess({ url: uploadedUrl }, updatedFile)
      persistBirField(fieldName, uploadedUrl)
      
      // Manually update the form field to ensure the file object has the URL
      // Use a small delay to ensure Ant Design has processed the onSuccess callback first
      setTimeout(() => {
        const currentFileList = form.getFieldValue(fieldName) || []
        // Update the file list with the URL
        const updatedFileList = currentFileList.map(f => {
          if (f.uid === file.uid || f.name === file.name) {
            return updatedFile
          }
          return f
        })
        // Only update if the list has changed
        if (JSON.stringify(currentFileList) !== JSON.stringify(updatedFileList)) {
          form.setFieldValue(fieldName, updatedFileList)
        }
      }, 200)
    } catch (error) {
      console.error('BIR document upload failed:', error)
      message.error(error?.message || 'Failed to upload document. Please try again.')
      onError?.(error)
    }
  }

  const handleFinish = async (values) => {
    // Check if business exists before allowing save
    if (isNewBusiness) {
      message.warning('Please complete Step 2 (Application Form) first to create your business before saving BIR registration.')
      return
    }

    try {
      setLoading(true)
      
      // Extract URLs from file lists - check multiple possible locations for the URL
      const extractUrl = (fileList) => {
        if (!fileList || !Array.isArray(fileList) || fileList.length === 0) return ''
        const file = fileList[0]
        return file.response?.url || 
               file.url || 
               file.thumbUrl || 
               (typeof file.response === 'string' ? file.response : null) ||
               ''
      }
      const paymentReceiptUrl = extractUrl(values.paymentReceiptUrl)
      
      const birData = {
        paymentReceiptUrl: paymentReceiptUrl
      }
      
      console.log('BIRRegistrationStep - Extracted birData:', birData)

      await saveBIRRegistration(businessId, birData)
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(birData))
      } catch (e) {
        // Ignore storage errors
      }
      
      if (onSave) {
        await onSave(birData)
      }
      message.success('BIR registration information saved successfully')
      
      // Only navigate to next step if not in modal
      if (!inModal && onNext) {
        onNext()
      }
    } catch (error) {
      console.error('Failed to save BIR registration:', error)
      const errorMessage = error?.message || 'Failed to save BIR registration. Please try again.'
      if (errorMessage.includes('Business not found') || errorMessage.includes('complete Step 2')) {
        message.warning(errorMessage)
      } else {
        message.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (fieldName) => {
    try {
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          const updated = { ...parsed }
          delete updated[fieldName]
          if (Object.keys(updated).length > 0) {
            sessionStorage.setItem(storageKey, JSON.stringify(updated))
          } else {
            sessionStorage.removeItem(storageKey)
          }
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
    return true
  }

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 8 }}>BIR Registration</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Register your business with the Bureau of Internal Revenue
        </Text>
      </div>

      <Alert
        message="BIR Payment Requirement"
        description={
          <List
            size="small"
            dataSource={[
              'Upload the official payment form or receipt issued by the Bureau of Internal Revenue (BIR).',
              'Accepted formats: PDF or image (JPG, PNG).',
              'Ensure the file is clear and legible for verification.'
            ]}
            renderItem={(item) => <List.Item style={{ padding: '4px 0' }}>{item}</List.Item>}
          />
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={() => {}}
      >
        <Form.Item
          label="Payment Form / Receipt"
          name="paymentReceiptUrl"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{ required: true, message: 'Please upload the payment form or receipt' }]}
        >
          <Upload
            customRequest={(options) => customUploadRequest(options, 'paymentReceiptUrl')}
            listType="picture-card"
            maxCount={1}
            accept=".pdf,image/*"
            onRemove={() => handleRemove('paymentReceiptUrl')}
            onPreview={(file) => {
              if (file.url || file.thumbUrl) {
                window.open(file.url || file.thumbUrl, '_blank')
              }
            }}
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>

        <div style={{ marginTop: 32, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            htmlType="submit"
            loading={loading}
          >
            {inModal ? 'Save Changes' : 'Save and Continue'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}
