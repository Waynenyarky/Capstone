import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Upload, Button, Space, Typography, Alert, List, Row, Col, App } from 'antd'
import { UploadOutlined, FileTextOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { saveBIRRegistration, uploadBusinessRegistrationFile } from '../services/businessRegistrationService'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Text } = Typography

export default function BIRRegistrationStep({ businessId, initialData, onSave, onNext, inModal = false }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [businessCapital, setBusinessCapital] = useState(initialData?.businessCapital || 0)
  
  // Check if business is new
  const isNewBusiness = !businessId || businessId === 'new'
  const storageKey = `business_registration_bir_${businessId || 'new'}`

  useEffect(() => {
    const buildFormValues = (data) => {
      if (!data || typeof data !== 'object') return null
      const formValues = {
        ...data,
        registrationFee: 500, // Fixed fee
        documentaryStampTax: data.documentaryStampTax || calculateDocumentaryStampTax(businessCapital)
      }
      
      // Convert URL strings to file objects for Upload components
      if (data.certificateUrl && typeof data.certificateUrl === 'string') {
        const urlParts = data.certificateUrl.split('/')
        const filename = urlParts[urlParts.length - 1] || 'certificate.pdf'
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.certificateUrl)
        const displayUrl = resolveAvatarUrl(data.certificateUrl)
        formValues.certificateUrl = [{
          uid: `-certificate-${Date.now()}`,
          name: filename,
          status: 'done',
          url: displayUrl,
          thumbUrl: isImage ? displayUrl : undefined,
          response: { url: data.certificateUrl }
        }]
      }
      
      if (data.booksOfAccountsUrl && typeof data.booksOfAccountsUrl === 'string') {
        const urlParts = data.booksOfAccountsUrl.split('/')
        const filename = urlParts[urlParts.length - 1] || 'books_of_accounts.pdf'
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.booksOfAccountsUrl)
        const displayUrl = resolveAvatarUrl(data.booksOfAccountsUrl)
        formValues.booksOfAccountsUrl = [{
          uid: `-books-${Date.now()}`,
          name: filename,
          status: 'done',
          url: displayUrl,
          thumbUrl: isImage ? displayUrl : undefined,
          response: { url: data.booksOfAccountsUrl }
        }]
      }
      
      if (data.authorityToPrintUrl && typeof data.authorityToPrintUrl === 'string') {
        const urlParts = data.authorityToPrintUrl.split('/')
        const filename = urlParts[urlParts.length - 1] || 'authority_to_print.pdf'
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.authorityToPrintUrl)
        const displayUrl = resolveAvatarUrl(data.authorityToPrintUrl)
        formValues.authorityToPrintUrl = [{
          uid: `-authority-${Date.now()}`,
          name: filename,
          status: 'done',
          url: displayUrl,
          thumbUrl: isImage ? displayUrl : undefined,
          response: { url: data.authorityToPrintUrl }
        }]
      }
      
      // Ensure upload fields are always arrays
      if (!formValues.certificateUrl || !Array.isArray(formValues.certificateUrl)) {
        formValues.certificateUrl = []
      }
      if (!formValues.booksOfAccountsUrl || !Array.isArray(formValues.booksOfAccountsUrl)) {
        formValues.booksOfAccountsUrl = []
      }
      if (!formValues.authorityToPrintUrl || !Array.isArray(formValues.authorityToPrintUrl)) {
        formValues.authorityToPrintUrl = []
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
      return ['certificateUrl', 'booksOfAccountsUrl', 'authorityToPrintUrl'].some((field) => {
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
        registrationFee: 500,
        certificateUrl: [],
        booksOfAccountsUrl: [],
        authorityToPrintUrl: []
      })
    }
  }, [initialData, form, businessCapital, storageKey])

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

  const persistBirData = (partial) => {
    if (!partial || typeof partial !== 'object') return
    try {
      const stored = sessionStorage.getItem(storageKey)
      const parsed = stored ? JSON.parse(stored) : {}
      const updated = { ...parsed, ...partial }
      sessionStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Calculate Documentary Stamp Tax based on business capital
  const calculateDocumentaryStampTax = (capital) => {
    if (!capital || capital <= 0) return 0
    // Simplified calculation - in reality, this follows BIR rules
    // For now, using a simple percentage (actual BIR rules are more complex)
    if (capital <= 5000000) {
      return Math.ceil(capital * 0.001) // 0.1% for capital up to 5M
    } else {
      return 5000 + Math.ceil((capital - 5000000) * 0.0005) // Different rate above 5M
    }
  }

  const handleBusinessCapitalChange = (value) => {
    setBusinessCapital(value || 0)
    const dst = calculateDocumentaryStampTax(value || 0)
    form.setFieldsValue({ documentaryStampTax: dst })
    persistBirData({
      businessCapital: value || 0,
      documentaryStampTax: dst
    })
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
      
      const certificateUrl = extractUrl(values.certificateUrl)
      const booksOfAccountsUrl = extractUrl(values.booksOfAccountsUrl)
      const authorityToPrintUrl = extractUrl(values.authorityToPrintUrl)
      
      const birData = {
        registrationNumber: values.registrationNumber || '',
        certificateUrl: certificateUrl,
        registrationFee: values.registrationFee || 500,
        documentaryStampTax: values.documentaryStampTax || 0,
        businessCapital: values.businessCapital || 0,
        booksOfAccountsUrl: booksOfAccountsUrl,
        authorityToPrintUrl: authorityToPrintUrl
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
        message="BIR Requirements"
        description={
          <List
            size="small"
            dataSource={[
              "Mayor's Permit or proof of ongoing LGU application",
              'DTI / SEC / CDA Registration',
              'Barangay Clearance',
              'Valid government-issued ID of the business owner',
              'Lease Contract or Land Title'
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
        onValuesChange={(changedValues, allValues) => {
          const payload = {}
          if (Object.prototype.hasOwnProperty.call(changedValues, 'registrationNumber')) {
            payload.registrationNumber = changedValues.registrationNumber || ''
          }
          if (Object.prototype.hasOwnProperty.call(changedValues, 'businessCapital')) {
            payload.businessCapital = changedValues.businessCapital || 0
            payload.documentaryStampTax = allValues.documentaryStampTax || 0
          }
          if (Object.prototype.hasOwnProperty.call(allValues, 'registrationFee')) {
            payload.registrationFee = allValues.registrationFee
          }
          if (Object.keys(payload).length > 0) {
            persistBirData(payload)
          }
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="BIR Registration Number (Form 2303)"
              name="registrationNumber"
              rules={[{ required: true, message: 'Please enter BIR Registration Number' }]}
            >
              <Input placeholder="Enter BIR Registration Number" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Business Capital (for Documentary Stamp Tax calculation)"
              name="businessCapital"
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="₱"
                placeholder="Enter business capital"
                min={0}
                formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₱\s?|(,*)/g, '')}
                onChange={handleBusinessCapitalChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Registration Fee"
              name="registrationFee"
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="₱"
                disabled
                value={500}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Documentary Stamp Tax (Auto-calculated)"
              name="documentaryStampTax"
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="₱"
                disabled
                formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="BIR Certificate of Registration (Form 2303)"
          name="certificateUrl"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{ required: true, message: 'Please upload BIR Certificate of Registration' }]}
        >
          <Upload
            customRequest={(options) => customUploadRequest(options, 'certificateUrl')}
            listType="picture-card"
            maxCount={1}
            accept=".pdf,image/*"
          onRemove={() => handleRemove('certificateUrl')}
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

        <Form.Item
          label="Books of Accounts Registration"
          name="booksOfAccountsUrl"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{ required: true, message: 'Please upload Books of Accounts Registration' }]}
        >
          <Upload
            customRequest={(options) => customUploadRequest(options, 'booksOfAccountsUrl')}
            listType="picture-card"
            maxCount={1}
            accept=".pdf,image/*"
          onRemove={() => handleRemove('booksOfAccountsUrl')}
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

        <Form.Item
          label="Authority to Print Official Receipts and Invoices"
          name="authorityToPrintUrl"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{ required: true, message: 'Please upload Authority to Print' }]}
        >
          <Upload
            customRequest={(options) => customUploadRequest(options, 'authorityToPrintUrl')}
            listType="picture-card"
            maxCount={1}
            accept=".pdf,image/*"
          onRemove={() => handleRemove('authorityToPrintUrl')}
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
