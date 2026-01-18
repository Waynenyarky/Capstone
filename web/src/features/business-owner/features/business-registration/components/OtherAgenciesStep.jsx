import React, { useState, useEffect } from 'react'
import { Card, Form, Checkbox, Upload, Button, Space, Typography, Alert, Row, Col, App } from 'antd'
import { UploadOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { saveOtherAgencyRegistrations, uploadBusinessRegistrationFile } from '../services/businessRegistrationService'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Text } = Typography

export default function OtherAgenciesStep({ businessId, initialData, onSave, onNext }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const hasEmployees = Form.useWatch('hasEmployees', form)
  
  // Check if business is new
  const isNewBusiness = !businessId || businessId === 'new'
  const storageKey = `business_registration_agencies_${businessId || 'new'}`

  useEffect(() => {
    const buildUploadValue = (url, fallbackName) => {
      if (!url || typeof url !== 'string') return []
      const displayUrl = resolveAvatarUrl(url)
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1] || fallbackName
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
      return [{
        uid: `-${fallbackName}-${Date.now()}`,
        name: filename,
        status: 'done',
        url: displayUrl,
        thumbUrl: isImage ? displayUrl : undefined,
        response: { url }
      }]
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
    const hasProofUrls = (data) => {
      if (!data || typeof data !== 'object') return false
      return Boolean(
        data.sss?.proofUrl ||
        data.philhealth?.proofUrl ||
        data.pagibig?.proofUrl
      )
    }

    const sourceData = hasProofUrls(initialData)
      ? initialData
      : (storedData || initialData)
    if (sourceData) {
      form.setFieldsValue({
        hasEmployees: sourceData.hasEmployees || false,
        sssRegistered: sourceData.sss?.registered || false,
        philhealthRegistered: sourceData.philhealth?.registered || false,
        pagibigRegistered: sourceData.pagibig?.registered || false,
        sssProofUrl: buildUploadValue(sourceData.sss?.proofUrl, 'sss_proof.pdf'),
        philhealthProofUrl: buildUploadValue(sourceData.philhealth?.proofUrl, 'philhealth_proof.pdf'),
        pagibigProofUrl: buildUploadValue(sourceData.pagibig?.proofUrl, 'pagibig_proof.pdf')
      })
    }
  }, [initialData, form, storageKey])

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e
    }
    return e?.fileList || []
  }

  const handleRemove = (fieldName) => {
    try {
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          const updated = { ...parsed }
          if (fieldName === 'sssProofUrl' && updated.sss) updated.sss.proofUrl = ''
          if (fieldName === 'philhealthProofUrl' && updated.philhealth) updated.philhealth.proofUrl = ''
          if (fieldName === 'pagibigProofUrl' && updated.pagibig) updated.pagibig.proofUrl = ''
          sessionStorage.setItem(storageKey, JSON.stringify(updated))
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
    return true
  }

  const persistAgencyField = (fieldName, url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return
    try {
      const stored = sessionStorage.getItem(storageKey)
      const parsed = stored ? JSON.parse(stored) : {}
      const updated = { ...parsed }
      if (!updated.sss) updated.sss = {}
      if (!updated.philhealth) updated.philhealth = {}
      if (!updated.pagibig) updated.pagibig = {}
      if (fieldName === 'sssProofUrl') updated.sss.proofUrl = url
      if (fieldName === 'philhealthProofUrl') updated.philhealth.proofUrl = url
      if (fieldName === 'pagibigProofUrl') updated.pagibig.proofUrl = url
      sessionStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      // Ignore storage errors
    }
  }

  const persistAgencyFlags = (partial) => {
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

  const customUploadRequest = async ({ file, onSuccess, onError }, fieldName) => {
    try {
      const result = await uploadBusinessRegistrationFile(businessId, file, fieldName)
      const uploadedUrl = result?.url
      if (!uploadedUrl) {
        throw new Error('Upload failed: missing file URL')
      }
      const displayUrl = resolveAvatarUrl(uploadedUrl)
      message.success(`File ${file.name} uploaded successfully`)
      onSuccess({ url: uploadedUrl }, {
        ...file,
        status: 'done',
        url: displayUrl,
        thumbUrl: /\.(jpg|jpeg|png|gif|webp)$/i.test(uploadedUrl) ? displayUrl : undefined,
        response: { url: uploadedUrl }
      })
      persistAgencyField(fieldName, uploadedUrl)
    } catch (error) {
      console.error('Agency document upload failed:', error)
      message.error(error?.message || 'Failed to upload document. Please try again.')
      onError?.(error)
    }
  }

  const handleFinish = async (values) => {
    // Prevent submission if businessId is 'new'
    if (isNewBusiness) {
      message.warning('Please complete Step 2 (Application Form) first to create your business before saving agency registration details.')
      return
    }

    try {
      setLoading(true)
      
      const agencyData = {
        hasEmployees: values.hasEmployees || false,
        sss: {
          registered: values.sssRegistered || false,
          proofUrl: values.sssProofUrl?.[0]?.response?.url || values.sssProofUrl?.[0]?.url || values.sssProofUrl?.[0]?.thumbUrl || ''
        },
        philhealth: {
          registered: values.philhealthRegistered || false,
          proofUrl: values.philhealthProofUrl?.[0]?.response?.url || values.philhealthProofUrl?.[0]?.url || values.philhealthProofUrl?.[0]?.thumbUrl || ''
        },
        pagibig: {
          registered: values.pagibigRegistered || false,
          proofUrl: values.pagibigProofUrl?.[0]?.response?.url || values.pagibigProofUrl?.[0]?.url || values.pagibigProofUrl?.[0]?.thumbUrl || ''
        }
      }

      await saveOtherAgencyRegistrations(businessId, agencyData)
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(agencyData))
      } catch (e) {
        // Ignore storage errors
      }
      
      if (onSave) onSave(agencyData)
      message.success('Agency registration information saved successfully')
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to save agency registrations:', error)
      const errorMessage = error?.message || 'Failed to save agency registrations. Please try again.'
      // Show specific error if it's about business not found
      if (errorMessage.includes('complete Step 2') || errorMessage.includes('Business not found')) {
        message.warning(errorMessage)
      } else {
        message.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <InfoCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 8 }}>Other Government Agency Registrations</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Register with other government agencies if your business has employees
        </Text>
      </div>

      {isNewBusiness && (
        <Alert
          message="Action Required"
          description="You need to complete Step 2 (Application Form) and save your business details before you can save agency registration details."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={(changedValues) => {
          const payload = {}
          if (Object.prototype.hasOwnProperty.call(changedValues, 'hasEmployees')) {
            payload.hasEmployees = changedValues.hasEmployees || false
          }
          if (Object.prototype.hasOwnProperty.call(changedValues, 'sssRegistered')) {
            payload.sss = { ...(payload.sss || {}), registered: changedValues.sssRegistered || false }
          }
          if (Object.prototype.hasOwnProperty.call(changedValues, 'philhealthRegistered')) {
            payload.philhealth = { ...(payload.philhealth || {}), registered: changedValues.philhealthRegistered || false }
          }
          if (Object.prototype.hasOwnProperty.call(changedValues, 'pagibigRegistered')) {
            payload.pagibig = { ...(payload.pagibig || {}), registered: changedValues.pagibigRegistered || false }
          }
          if (Object.keys(payload).length > 0) {
            persistAgencyFlags(payload)
          }
        }}
      >
        <Form.Item
          name="hasEmployees"
          valuePropName="checked"
          style={{ marginBottom: 24 }}
        >
          <Checkbox style={{ fontSize: 16 }}>
            Does your business have employees?
          </Checkbox>
        </Form.Item>

        {hasEmployees && (
          <>
            <Alert
              message="Employee Registration Required"
              description="If your business has employees, you must register with the following government agencies and provide proof of registration."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="sssRegistered"
                  valuePropName="checked"
                >
                  <Checkbox>Registered with Social Security System (SSS)</Checkbox>
                </Form.Item>
                <Form.Item
                  label="SSS Proof of Registration"
                  name="sssProofUrl"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (form.getFieldValue('sssRegistered') && (!value || value.length === 0)) {
                          return Promise.reject('Please upload SSS proof of registration')
                        }
                        return Promise.resolve()
                      }
                    }
                  ]}
                >
                  <Upload
                    customRequest={(options) => customUploadRequest(options, 'sssProofUrl')}
                    listType="picture-card"
                    maxCount={1}
                    accept=".pdf,image/*"
                    onRemove={() => handleRemove('sssProofUrl')}
                  >
                    {(form.getFieldValue('sssProofUrl')?.length || 0) >= 1 ? null : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="philhealthRegistered"
                  valuePropName="checked"
                >
                  <Checkbox>Registered with PhilHealth</Checkbox>
                </Form.Item>
                <Form.Item
                  label="PhilHealth Proof of Registration"
                  name="philhealthProofUrl"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (form.getFieldValue('philhealthRegistered') && (!value || value.length === 0)) {
                          return Promise.reject('Please upload PhilHealth proof of registration')
                        }
                        return Promise.resolve()
                      }
                    }
                  ]}
                >
                  <Upload
                    customRequest={(options) => customUploadRequest(options, 'philhealthProofUrl')}
                    listType="picture-card"
                    maxCount={1}
                    accept=".pdf,image/*"
                    onRemove={() => handleRemove('philhealthProofUrl')}
                  >
                    {(form.getFieldValue('philhealthProofUrl')?.length || 0) >= 1 ? null : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="pagibigRegistered"
                  valuePropName="checked"
                >
                  <Checkbox>Registered with Pag-IBIG Fund</Checkbox>
                </Form.Item>
                <Form.Item
                  label="Pag-IBIG Proof of Registration"
                  name="pagibigProofUrl"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (form.getFieldValue('pagibigRegistered') && (!value || value.length === 0)) {
                          return Promise.reject('Please upload Pag-IBIG proof of registration')
                        }
                        return Promise.resolve()
                      }
                    }
                  ]}
                >
                  <Upload
                    customRequest={(options) => customUploadRequest(options, 'pagibigProofUrl')}
                    listType="picture-card"
                    maxCount={1}
                    accept=".pdf,image/*"
                    onRemove={() => handleRemove('pagibigProofUrl')}
                  >
                    {(form.getFieldValue('pagibigProofUrl')?.length || 0) >= 1 ? null : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {!hasEmployees && (
          <Alert
            message="No Employees"
            description="If your business does not have employees, you can skip this step. You can always update this information later if you hire employees."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <div style={{ marginTop: 32, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            htmlType="submit"
            loading={loading}
          >
            Save and Continue
          </Button>
        </div>
      </Form>
    </Card>
  )
}
