import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, Select, Form, Input, InputNumber, Button, Typography, Alert,
  Spin, Empty, Tag, Descriptions, Space, Result, Upload, message
} from 'antd'
import { StopOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../../../components/BusinessOwnerLayout.jsx'
import { get, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function RetirementApplicationPage() {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/business/businesses')
      const biz = (res?.businesses || []).filter((b) => b.businessStatus === 'active')
      setBusinesses(biz)
    } catch (err) {
      notifyError(err, 'Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => { fetchBusinesses() }, [fetchBusinesses])

  const handleBusinessSelect = useCallback((businessId) => {
    const biz = businesses.find((b) => b.businessId === businessId)
    setSelectedBusiness(biz)
    setSubmitted(false)
    if (biz) {
      form.setFieldsValue({
        businessName: biz.businessName || biz.registeredBusinessName || '',
        yearsActive: biz.yearEstablished ? new Date().getFullYear() - biz.yearEstablished : 0,
      })
    }
  }, [businesses, form])

  const handleSubmit = useCallback(async (values) => {
    if (!selectedBusiness) return
    try {
      setSubmitting(true)
      await post(`/api/business/${selectedBusiness.businessId}/retire`, {
        applicationLetter: values.applicationLetter,
        swornStatementGrossSales: values.swornStatementGrossSales,
      })
      success('Retirement application submitted successfully')
      setSubmitted(true)
    } catch (err) {
      notifyError(err, 'Failed to submit retirement application')
    } finally {
      setSubmitting(false)
    }
  }, [selectedBusiness, success, notifyError])

  if (loading) {
    return (
      <BusinessOwnerLayout pageTitle="Retirement Application" pageIcon={<StopOutlined />}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin tip="Loading businesses..." />
        </div>
      </BusinessOwnerLayout>
    )
  }

  return (
    <BusinessOwnerLayout pageTitle="Retirement Application" pageIcon={<StopOutlined />}>
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <Paragraph type="secondary">
          Apply for business retirement or cessation. Your application will be reviewed by an inspector
          who will verify the closure before final confirmation.
        </Paragraph>

        {submitted ? (
          <Result
            status="success"
            title="Retirement Application Submitted"
            subTitle={`Your retirement application for "${selectedBusiness?.businessName || 'N/A'}" has been submitted. An inspector will verify the closure.`}
            extra={[
              <Button key="back" onClick={() => { setSubmitted(false); setSelectedBusiness(null) }}>
                Back to Selection
              </Button>,
            ]}
          />
        ) : (
          <>
            <Card title="Select Business" style={{ marginBottom: 24 }}>
              {businesses.length === 0 ? (
                <Empty description="No active businesses found" />
              ) : (
                <Select
                  placeholder="Select a business to retire"
                  style={{ width: '100%' }}
                  onChange={handleBusinessSelect}
                  value={selectedBusiness?.businessId}
                >
                  {businesses.map((b) => (
                    <Select.Option key={b.businessId} value={b.businessId}>
                      {b.businessName || b.registeredBusinessName || b.businessId}
                      {b.retirementStatus ? ` (${b.retirementStatus})` : ''}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Card>

            {selectedBusiness && (
              <>
                {selectedBusiness.retirementStatus && selectedBusiness.retirementStatus !== '' ? (
                  <Alert
                    type="warning"
                    message={`Retirement Status: ${selectedBusiness.retirementStatus}`}
                    description="This business already has a retirement application in progress."
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                ) : (
                  <Card title="Retirement Application" style={{ marginBottom: 24 }}>
                    <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                      <Descriptions.Item label="Business Name">
                        {selectedBusiness.businessName || selectedBusiness.registeredBusinessName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Business Plate No.">
                        {selectedBusiness.businessPlateNo || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color="green">{selectedBusiness.businessStatus}</Tag>
                      </Descriptions.Item>
                    </Descriptions>

                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                      <Form.Item
                        name="applicationLetter"
                        label="Application Letter (to City Mayor thru City Treasurer)"
                        rules={[{ required: true, message: 'Application letter is required' }]}
                      >
                        <TextArea
                          rows={6}
                          placeholder="Write your retirement application letter here..."
                        />
                      </Form.Item>

                      <Form.Item
                        name="swornStatementGrossSales"
                        label="Sworn Statement of Gross Sales (₱)"
                        rules={[{ required: true, message: 'Gross sales amount is required' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          placeholder="Enter gross sales amount"
                          formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(v) => v.replace(/[₱,\s]/g, '')}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Sworn Statement Document"
                        name="swornStatementDocument"
                        extra="Upload a scanned copy of the sworn statement of gross sales/receipts"
                      >
                        <Upload
                          maxCount={1}
                          beforeUpload={() => false}
                          accept=".pdf,.jpg,.jpeg,.png"
                        >
                          <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                      </Form.Item>

                      <Alert
                        type="info"
                        message="Important"
                        description="After submission, an inspector will verify that your business has ceased operations. Businesses returning after retirement must apply as a new permit."
                        showIcon
                        style={{ marginBottom: 24 }}
                      />

                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        danger
                        size="large"
                        block
                      >
                        Submit Retirement Application
                      </Button>
                    </Form>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </BusinessOwnerLayout>
  )
}
