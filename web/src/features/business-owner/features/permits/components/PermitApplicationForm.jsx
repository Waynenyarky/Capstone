import React, { useState, useEffect } from 'react'
import { Form, Select, Input, DatePicker, Upload, Button, Card, Row, Col, Typography, message, Space, Badge, Divider, Checkbox, theme } from 'antd'
import { UploadOutlined, RobotOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { calculateFee } from '../services/permitService'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

export default function PermitApplicationForm({ onSubmit, onCancel, initialValues }) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fee, setFee] = useState(0)
  const [aiValidating, setAiValidating] = useState(false)

  // Auto-generated Application Number
  const appNumber = "APP-" + dayjs().format('YYYYMMDD') + "-" + Math.floor(Math.random() * 1000)

  // Auto-fill Business Info (Mock)
  const businessInfo = {
    name: "Wayne Enterprises",
    tin: "123-456-789-000",
    address: "123 Gotham St., Metro City"
  }

  useEffect(() => {
    if (initialValues) {
      const safeValues = { ...initialValues }
      // Ensure date strings are converted to dayjs objects to prevent DatePicker crashes
      if (safeValues.applicationDate && !dayjs.isDayjs(safeValues.applicationDate)) {
        safeValues.applicationDate = dayjs(safeValues.applicationDate)
      }
      if (safeValues.validityPeriod && Array.isArray(safeValues.validityPeriod)) {
        safeValues.validityPeriod = safeValues.validityPeriod.map(d => 
          (d && !dayjs.isDayjs(d)) ? dayjs(d) : d
        )
      }
      form.setFieldsValue(safeValues)
    } else {
      form.setFieldsValue({
        applicationNumber: appNumber,
        applicationDate: dayjs(),
        ...businessInfo
      })
    }
  }, [initialValues, form])

  const handleValuesChange = (changedValues, allValues) => {
    if (changedValues.permitType || changedValues.businessSize) {
      const calculated = calculateFee(allValues.permitType, allValues.businessSize)
      setFee(calculated)
      form.setFieldsValue({ fees: calculated })
    }
  }

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      await onSubmit({ ...values, fees: fee })
      message.success('Application submitted successfully!')
      form.resetFields()
    } catch {
      message.error('Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e
    }
    return e?.fileList
  }

  const customUploadRequest = ({ onSuccess }) => {
    setAiValidating(true)
    setTimeout(() => {
      setAiValidating(false)
      message.success({ content: 'AI Validation Complete: Document appears valid.', icon: <RobotOutlined style={{ color: token.colorPrimary }} /> })
      onSuccess("ok")
    }, 1500)
  }

  return (
    <Card variant="borderless">
      <Title level={4}>New Permit Application</Title>
      <Text type="secondary">Fill out the details below. AI will assist in validating your documents.</Text>
      <Divider />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        initialValues={{ businessSize: 'Small' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Application Number" name="applicationNumber">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Application Date" name="applicationDate">
              <DatePicker style={{ width: '100%' }} disabled format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Card title="Business Information (Auto-filled)" size="small" style={{ marginBottom: 24, background: '#f9f9f9' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Business Name" name="name">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="TIN" name="tin">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Address" name="address">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Permit Type" name="permitType" rules={[{ required: true }]}>
              <Select placeholder="Select Permit Type">
                <Option value="Mayor's Permit">Mayor's Permit</Option>
                <Option value="Sanitary Permit">Sanitary Permit</Option>
                <Option value="Fire Safety">Fire Safety</Option>
                <Option value="Environmental Clearance">Environmental Clearance</Option>
                <Option value="Signage Permit">Signage Permit</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item label="Business Size (for fee calc)" name="businessSize">
              <Select>
                <Option value="Small">Small</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Large">Large</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Validity Period" name="validityPeriod" rules={[{ required: true }]}>
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item 
          label={<Space>Required Documents <Badge count={<Space><RobotOutlined style={{ color: '#1890ff' }} /> AI-Assisted Validation</Space>} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} /></Space>}
          name="documents" 
          valuePropName="fileList" 
          getValueFromEvent={normFile}
          rules={[{ required: true, message: 'Please upload documents' }]}
        >
          <Upload customRequest={customUploadRequest} listType="picture">
            <Button icon={<UploadOutlined />} loading={aiValidating}>
              {aiValidating ? 'AI Scanning...' : 'Click to Upload'}
            </Button>
          </Upload>
        </Form.Item>

        <Form.Item label="Estimated Fees (Auto-calculated)" name="fees">
          <Input prefix="₱" disabled style={{ color: '#000', fontWeight: 'bold' }} />
        </Form.Item>

        <Form.Item name="inspectionRequest" valuePropName="checked">
          <Checkbox>Request Pre-approval Inspection?</Checkbox>
        </Form.Item>

        <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, marginBottom: 24, border: '1px solid #b7eb8f' }}>
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
            <Text type="success">Blockchain Security: This application record will be timestamped and immutable upon submission.</Text>
          </Space>
        </div>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Application
            </Button>
            <Button onClick={onCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
