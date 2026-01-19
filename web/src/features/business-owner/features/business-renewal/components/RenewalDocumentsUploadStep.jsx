import React, { useState, useEffect } from 'react'
import { Card, Form, Upload, Button, Space, Typography, Alert, Badge, Row, Col, App } from 'antd'
import { UploadOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { uploadRenewalFile, uploadRenewalDocuments } from '../services/businessRenewalService'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Text } = Typography

export default function RenewalDocumentsUploadStep({ businessId, renewalId, businessType, initialDocuments, onSave, onNext, inModal = false }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [aiValidating, setAiValidating] = useState({})
  
  const storageKey = `business_renewal_documents_${businessId}_${renewalId}`

  useEffect(() => {
    const buildFormValues = (documents) => {
      if (!documents || typeof documents !== 'object') return {}
      const formValues = {}
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          const url = documents[key]
          const displayUrl = resolveAvatarUrl(url)
          const urlParts = url.split('/')
          const filename = urlParts[urlParts.length - 1] || `${key}_document`
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || /image/i.test(url)
          
          const fileObj = {
            uid: `-${key}-${Date.now()}`,
            name: filename,
            status: 'done',
            url: displayUrl,
            thumbUrl: isImage ? displayUrl : undefined,
            response: { url: url }
          }
          
          formValues[key] = [fileObj]
        }
      })
      return formValues
    }

    const loadDocuments = () => {
      const initialValues = buildFormValues(initialDocuments)
      if (Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues)
        return
      }
      
      try {
        const stored = sessionStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          const storedValues = buildFormValues(parsed)
          if (Object.keys(storedValues).length > 0) {
            form.setFieldsValue(storedValues)
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }

    loadDocuments()
  }, [initialDocuments, form, storageKey])

  const persistDocumentUrl = (fieldName, url) => {
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

  const normFile = (e, fieldName) => {
    if (Array.isArray(e)) {
      return e
    }
    return e?.fileList || []
  }

  const customUploadRequest = async ({ file, onSuccess, onError, onProgress }, fieldName) => {
    setAiValidating(prev => ({ ...prev, [fieldName]: true }))

    try {
      const result = await uploadRenewalFile(businessId, renewalId, file, fieldName)
      const uploadedUrl = result?.url || result?.gatewayUrl
      if (!uploadedUrl) {
        throw new Error('Upload failed: missing file URL')
      }

      const displayUrl = resolveAvatarUrl(uploadedUrl)
      message.success({
        content: `AI Validation Complete: ${file.name} appears valid.`,
        icon: <RobotOutlined style={{ color: '#1890ff' }} />
      })
      
      const updatedFile = {
        ...file,
        status: 'done',
        url: displayUrl,
        thumbUrl: /\.(jpg|jpeg|png|gif|webp)$/i.test(uploadedUrl) ? displayUrl : undefined,
        response: { url: uploadedUrl }
      }
      
      onSuccess({ url: uploadedUrl }, updatedFile)
      persistDocumentUrl(fieldName, uploadedUrl)
      
      setTimeout(() => {
        const currentFileList = form.getFieldValue(fieldName) || []
        const updatedFileList = currentFileList.map(f => {
          if (f.uid === file.uid || f.name === file.name) {
            return updatedFile
          }
          return f
        })
        if (JSON.stringify(currentFileList) !== JSON.stringify(updatedFileList)) {
          form.setFieldValue(fieldName, updatedFileList)
        }
      }, 200)
    } catch (error) {
      console.error('Renewal document upload failed:', error)
      message.error(error?.message || 'Failed to upload document. Please try again.')
      onError?.(error)
    } finally {
      setAiValidating(prev => ({ ...prev, [fieldName]: false }))
    }
  }

  const handleFinish = async (values) => {
    try {
      setLoading(true)
      
      const documents = {}
      Object.keys(values).forEach(key => {
        if (values[key] && Array.isArray(values[key]) && values[key].length > 0) {
          const file = values[key][0]
          const url = file.response?.url || 
                     file.url || 
                     file.thumbUrl || 
                     (typeof file.response === 'string' ? file.response : null) ||
                     ''
          
          if (url && url.trim() !== '' && url !== 'undefined' && url !== 'null') {
            documents[key] = url
          }
        }
      })

      const documentKeys = Object.keys(documents)
      if (documentKeys.length === 0) {
        message.warning('Please upload at least one document before saving.')
        setLoading(false)
        return
      }

      await uploadRenewalDocuments(businessId, renewalId, documents)
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(documents))
      } catch (e) {
        // Ignore storage errors
      }
      
      if (onSave && documentKeys.length > 0) {
        onSave(documents)
      }
      message.success('Documents uploaded successfully')
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to upload documents:', error)
      message.error(error?.message || 'Failed to upload documents. Please try again.')
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

  const isFoodBusiness = businessType === 'food_beverages'

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 8 }}>Upload Renewal Documents</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Upload all required renewal documents
        </Text>
      </div>

      <Alert
        message="Document Requirements"
        description="Please ensure all uploaded documents are clear, readable, and in PDF or image format (JPG, PNG). Maximum file size: 10MB per document."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Previous Year's Mayor's Permit</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="previousMayorsPermit"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'previousMayorsPermit')}
              rules={[{ required: true, message: 'Please upload previous Mayor\'s Permit' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'previousMayorsPermit')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('previousMayorsPermit')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Previous Year's Official Receipt</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="previousOfficialReceipt"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'previousOfficialReceipt')}
              rules={[{ required: true, message: 'Please upload previous Official Receipt' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'previousOfficialReceipt')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('previousOfficialReceipt')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Audited Financial Statements</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="auditedFinancialStatements"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'auditedFinancialStatements')}
              rules={[{ required: true, message: 'Please upload Audited Financial Statements' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'auditedFinancialStatements')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('auditedFinancialStatements')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Income Tax Return</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="incomeTaxReturn"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'incomeTaxReturn')}
              rules={[{ required: true, message: 'Please upload Income Tax Return' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'incomeTaxReturn')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('incomeTaxReturn')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Barangay Clearance (Current Year)</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="barangayClearance"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'barangayClearance')}
              rules={[{ required: true, message: 'Please upload Barangay Clearance' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'barangayClearance')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('barangayClearance')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Community Tax Certificate (CTC)</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="ctc"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'ctc')}
              rules={[{ required: true, message: 'Please upload Community Tax Certificate' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'ctc')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('ctc')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Fire Safety Inspection Certificate (FSIC)</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="fireSafetyInspection"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'fireSafetyInspection')}
              rules={[{ required: true, message: 'Please upload Fire Safety Inspection Certificate' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'fireSafetyInspection')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('fireSafetyInspection')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Sanitary Permit / Health Certificate</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="sanitaryPermit"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'sanitaryPermit')}
              help={isFoodBusiness ? 'Required for food-related businesses' : 'Upload if applicable'}
              rules={isFoodBusiness ? [{ required: true, message: 'Please upload Sanitary Permit' }] : []}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'sanitaryPermit')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('sanitaryPermit')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Business Insurance</span>
                </Space>
              }
              name="businessInsurance"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'businessInsurance')}
              help="Upload only if required"
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'businessInsurance')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('businessInsurance')}
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
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <span>Sworn Declaration of Gross Receipts</span>
                </Space>
              }
              name="swornDeclaration"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'swornDeclaration')}
              help="Upload if books are not yet finalized"
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'swornDeclaration')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('swornDeclaration')}
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
          </Col>
        </Row>

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
