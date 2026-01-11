import React, { useState, useEffect } from 'react'
import { Form, Select, Input, DatePicker, Button, Card, Row, Col, Typography, message, Space, List, Tag, Divider } from 'antd'
import { EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { getAssociatedPermits } from '../services/cessationService'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

export default function CessationForm({ onSubmit, onCancel }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activePermits, setActivePermits] = useState([])

  useEffect(() => {
    getAssociatedPermits().then(setActivePermits)
  }, [])

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      await onSubmit(values)
      message.success('Cessation request submitted successfully!')
      form.resetFields()
    } catch {
      message.error('Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="borderless">
      <Title level={4}>Business Cessation Request</Title>
      <Text type="secondary">Submit a formal request to temporarily halt or permanently close your business operations.</Text>
      <Divider />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Cessation Type" name="type" rules={[{ required: true }]}>
              <Select placeholder="Select Type">
                <Option value="Temporary Halt">Temporary Halt</Option>
                <Option value="Permanent Closure">Permanent Closure</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Effective Date" name="effectiveDate" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Reason for Cessation" name="reason" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="Please provide a detailed reason..." />
        </Form.Item>

        <Form.Item label="Associated Permits (Auto-detected)">
          <List
            size="small"
            bordered
            dataSource={activePermits}
            renderItem={item => (
              <List.Item>
                <Space>
                  <Tag color="blue">{item.type}</Tag>
                  <Text>{item.number}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Form.Item>

        <Form.Item 
          name="signature" 
          label="Type Full Name to Sign" 
          rules={[{ required: true, message: 'Digital signature is required' }]}
          extra="By typing your name, you certify that this request is legitimate."
        >
          <Input prefix={<EditOutlined />} style={{ fontStyle: 'italic', fontWeight: 'bold' }} />
        </Form.Item>

        <div style={{ background: '#fff1f0', padding: 12, borderRadius: 4, marginBottom: 24, border: '1px solid #ffa39e' }}>
          <Space align="start">
            <SafetyCertificateOutlined style={{ color: '#f5222d', marginTop: 4 }} />
            <div>
              <Text strong style={{ color: '#cf1322' }}>Legal Warning & Blockchain Record</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                This action will be permanently recorded on the blockchain. LGU officers will be notified for inspection.
              </Text>
            </div>
          </Space>
        </div>

        <Form.Item>
          <Space>
            <Button type="primary" danger htmlType="submit" loading={loading}>
              Submit Request
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
