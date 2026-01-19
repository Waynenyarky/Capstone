import React, { useState } from 'react'
import { Card, Typography, Form, Select, Input, Button, Alert, Space, Descriptions, App, Spin } from 'antd'
import { CreditCardOutlined, QrcodeOutlined, BankOutlined, ShopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { processPayment } from '../services/businessRenewalService'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

export default function RenewalPaymentStep({ businessId, renewalId, assessment, onSave, onNext }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [currentAssessment, setCurrentAssessment] = useState(assessment)
  const [loading, setLoading] = useState(!assessment)

  // Load assessment if not provided
  React.useEffect(() => {
    if (!currentAssessment && businessId && renewalId) {
      const loadAssessment = async () => {
        try {
          setLoading(true)
          const { calculateAssessment } = await import('../services/businessRenewalService')
          const loaded = await calculateAssessment(businessId, renewalId)
          setCurrentAssessment(loaded)
        } catch (error) {
          console.error('Failed to load assessment:', error)
          message.error('Failed to load assessment. Please go back to the assessment step.')
        } finally {
          setLoading(false)
        }
      }
      loadAssessment()
    }
  }, [businessId, renewalId, currentAssessment, message])

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading assessment...</Text>
          </div>
        </div>
      </Card>
    )
  }

  if (!currentAssessment || !currentAssessment.total) {
    return (
      <Card>
        <Alert
          message="Assessment Required"
          description="Please complete the assessment step before proceeding to payment."
          type="warning"
          showIcon
        />
      </Card>
    )
  }

  const handleFinish = async (values) => {
    try {
      setProcessing(true)
      
      // Process payment through payment service
      const paymentData = {
        status: 'paid',
        paymentMethod: values.method,
        transactionId: values.transactionId || `TX-${Date.now()}`
      }

      // Save payment to renewal record
      await processPayment(businessId, renewalId, paymentData)

      setPaymentStatus('paid')
      message.success('Payment processed successfully!')
      
      if (onSave) onSave(paymentData)
      if (onNext) onNext()
    } catch (error) {
      console.error('Payment processing failed:', error)
      message.error(error?.message || 'Payment processing failed. Please try again.')
      setPaymentStatus('failed')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (paymentStatus === 'paid') {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
          <Title level={3} style={{ color: '#52c41a' }}>Payment Successful</Title>
          <Text type="secondary" style={{ fontSize: 16, display: 'block', marginTop: 16 }}>
            Your payment of {formatCurrency(currentAssessment.total)} has been processed successfully.
          </Text>
          <Button
            type="primary"
            size="large"
            onClick={onNext}
            style={{ marginTop: 24 }}
          >
            Continue to Submission
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CreditCardOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Pay Assessed Fees</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Complete payment to proceed with renewal submission
          </Paragraph>
        </div>

        <Alert
          message="Payment Required"
          description="You must complete payment before submitting your renewal application."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Descriptions bordered column={1} size="middle" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Total Assessed Amount">
            <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
              {formatCurrency(currentAssessment.total || 0)}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ method: 'Gcash' }}
        >
          <Form.Item 
            label={<Text strong>Payment Method</Text>} 
            name="method" 
            rules={[{ required: true, message: 'Please select a payment method' }]}
          >
            <Select size="large">
              <Option value="Gcash">
                <Space>
                  <QrcodeOutlined /> Gcash
                </Space>
              </Option>
              <Option value="Credit/Debit Card">
                <Space>
                  <CreditCardOutlined /> Credit/Debit Card
                </Space>
              </Option>
              <Option value="Bank Transfer">
                <Space>
                  <BankOutlined /> Bank Transfer
                </Space>
              </Option>
              <Option value="Over-the-Counter">
                <Space>
                  <ShopOutlined /> Over-the-Counter
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item 
            label={<Text strong>Transaction ID / Reference Number</Text>}
            name="transactionId"
            help="Enter your payment transaction ID or reference number for verification."
          >
            <Input 
              placeholder="e.g. GC-123456789 or OTC-REF-001" 
              size="large"
            />
          </Form.Item>

          <Alert
            message="Secure Transaction"
            description="This payment will be recorded on the blockchain for audit purposes."
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div style={{ marginTop: 32, textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={processing}
              disabled={processing}
              icon={<CheckCircleOutlined />}
            >
              Process Payment - {formatCurrency(assessment.total || 0)}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
