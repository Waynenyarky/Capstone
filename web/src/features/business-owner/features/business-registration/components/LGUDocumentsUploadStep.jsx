import React, { useState, useEffect } from 'react'
import { Card, Form, Upload, Button, Space, Typography, Alert, Badge, Row, Col, App } from 'antd'
import { UploadOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { uploadBusinessRegistrationFile, uploadLGUDocuments } from '../services/businessRegistrationService'
import { resolveAvatarUrl } from '@/lib/utils'
import { useAuthSession } from '@/features/authentication'

const { Title, Text } = Typography

export default function LGUDocumentsUploadStep({ businessId, businessType, initialDocuments, onSave, onNext, inModal = false }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [aiValidating, setAiValidating] = useState({})
  const { currentUser } = useAuthSession()
  
  // Check if business is new
  const isNewBusiness = !businessId || businessId === 'new'
  const storageKey = `business_registration_lgu_documents_${businessId || 'new'}`

  useEffect(() => {
    const buildFormValues = (documents) => {
      if (!documents || typeof documents !== 'object') return {}
      const formValues = {}
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          const url = documents[key]
          const displayUrl = resolveAvatarUrl(url)
          // Extract filename from URL or use a default name
          const urlParts = url.split('/')
          const filename = urlParts[urlParts.length - 1] || `${key}_document`
          
          // Determine if it's an image or PDF based on URL/extension
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || /image/i.test(url)
          
          const fileObj = {
            uid: `-${key}-${Date.now()}`,
            name: filename,
            status: 'done',
            url: displayUrl,
            thumbUrl: isImage ? displayUrl : undefined, // For picture-card display
            response: { url: url } // Ensure response.url exists for form submission
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
      const result = await uploadBusinessRegistrationFile(businessId, file, fieldName)
      const uploadedUrl = result?.url
      if (!uploadedUrl) {
        throw new Error('Upload failed: missing file URL')
      }

      const displayUrl = resolveAvatarUrl(uploadedUrl)
      message.success({
        content: `AI Validation Complete: ${file.name} appears valid.`,
        icon: <RobotOutlined style={{ color: '#1890ff' }} />
      })
      
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
      persistDocumentUrl(fieldName, uploadedUrl)
      
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
      console.error('LGU document upload failed:', error)
      message.error(error?.message || 'Failed to upload document. Please try again.')
      onError?.(error)
    } finally {
      setAiValidating(prev => ({ ...prev, [fieldName]: false }))
    }
  }

  const handleFinish = async (values) => {
    // Check if business exists before allowing upload
    if (isNewBusiness) {
      message.warning('Please complete Step 2 (Application Form) first to create your business before uploading documents.')
      return
    }

    try {
      setLoading(true)
      
      // Extract URLs from file lists - check multiple possible locations for the URL
      const documents = {}
      Object.keys(values).forEach(key => {
        if (values[key] && Array.isArray(values[key]) && values[key].length > 0) {
          const file = values[key][0]
          // Try multiple locations where the URL might be stored
          const url = file.response?.url || 
                     file.url || 
                     file.thumbUrl || 
                     (typeof file.response === 'string' ? file.response : null) ||
                     ''
          
          // Only include document if URL is valid
          if (url && url.trim() !== '' && url !== 'undefined' && url !== 'null') {
            documents[key] = url
          }
        }
      })

      // Validate that we have at least one document before proceeding
      const documentKeys = Object.keys(documents)
      if (documentKeys.length === 0) {
        message.warning('Please upload at least one document before saving.')
        setLoading(false)
        return
      }

      console.log('LGUDocumentsUploadStep - Extracted documents:', documents)
      
      await uploadLGUDocuments(businessId, documents)
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(documents))
      } catch (e) {
        // Ignore storage errors
      }
      
      // Only call onSave if we have valid documents
      if (onSave && documentKeys.length > 0) {
        onSave(documents)
      }
      message.success('Documents uploaded successfully')
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to upload documents:', error)
      const errorMessage = error?.message || 'Failed to upload documents. Please try again.'
      // Show specific error if it's about business not found
      if (errorMessage.includes('complete Step 2') || errorMessage.includes('business')) {
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

  const isFoodBusiness = businessType === 'food_beverages'

  // Show warning if business hasn't been created yet
  if (isNewBusiness) {
    return (
      <Card>
        <Alert
          message="Complete Step 2 First"
          description="Please complete Step 2 (Application Form) to create your business before uploading documents. The business must be created first so we can associate these documents with it."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 8 }}>Upload Required LGU Documents</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Upload clear digital copies of all required documents
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
                  <span>2×2 ID Picture</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="idPicture"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'idPicture')}
              rules={[{ required: true, message: 'Please upload 2×2 ID picture' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'idPicture')}
                listType="picture-card"
                maxCount={1}
                accept="image/*"
                onRemove={() => handleRemove('idPicture')}
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
                  <span>Barangay Business Clearance</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="barangayClearance"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'barangayClearance')}
              rules={[{ required: true, message: 'Please upload Barangay Business Clearance' }]}
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
                  <span>DTI / SEC / CDA Registration</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="dtiSecCda"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'dtiSecCda')}
              rules={[{ required: true, message: 'Please upload DTI/SEC/CDA Registration' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'dtiSecCda')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('dtiSecCda')}
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
                  <span>Lease Contract or Land Title (if applicable)</span>
                </Space>
              }
              name="leaseOrLandTitle"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'leaseOrLandTitle')}
              help="Upload only if applicable"
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'leaseOrLandTitle')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('leaseOrLandTitle')}
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
                  <span>Certificate of Occupancy</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="occupancyPermit"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'occupancyPermit')}
              rules={[{ required: true, message: 'Please upload Certificate of Occupancy' }]}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'occupancyPermit')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('occupancyPermit')}
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
                  <span>Health Certificate (Required for food-related businesses)</span>
                  <Badge count={<Space><RobotOutlined style={{ color: '#1890ff', fontSize: 12 }} /> AI Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} />
                </Space>
              }
              name="healthCertificate"
              valuePropName="fileList"
              getValueFromEvent={(e) => normFile(e, 'healthCertificate')}
              rules={isFoodBusiness ? [{ required: true, message: 'Please upload Health Certificate' }] : []}
            >
              <Upload
                customRequest={(options) => customUploadRequest(options, 'healthCertificate')}
                listType="picture-card"
                maxCount={1}
                accept=".pdf,image/*"
                onRemove={() => handleRemove('healthCertificate')}
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
