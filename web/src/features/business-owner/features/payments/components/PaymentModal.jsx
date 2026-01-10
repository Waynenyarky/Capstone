import React, { useState } from 'react'
import { Modal, Form, Select, Input, Typography, Button, Descriptions, Divider, message, Alert, Space } from 'antd'
import { CreditCardOutlined, QrcodeOutlined, BankOutlined, ShopOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

export default function PaymentModal({ open, bill, onCancel, onPay }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleFinish = async (values) => {
    setLoading(true)
    try {
      await onPay(bill.id, values.method, values.transactionId)
      message.success('Payment processed successfully! Receipt generated.')
      onCancel()
    } catch (error) {
      message.error('Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (!bill) return null

  return (
    <Modal
      open={open}
      title={<Title level={4} style={{ margin: 0 }}>Process Payment</Title>}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden={true}
    >
      <Alert message="Secure Transaction" description="This payment will be recorded on the blockchain." type="success" showIcon style={{ marginBottom: 16 }} />
      
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Invoice #">{bill.invoiceNumber}</Descriptions.Item>
        <Descriptions.Item label="Description">{bill.description}</Descriptions.Item>
        <Descriptions.Item label="Amount Due">
          <Text strong style={{ fontSize: 18, color: '#52c41a' }}>₱{bill.amount.toFixed(2)}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ method: 'Gcash' }}
      >
        <Form.Item label="Payment Method" name="method" rules={[{ required: true }]}>
          <Select size="large">
            <Option value="Gcash"><Space><QrcodeOutlined /> Gcash</Space></Option>
            <Option value="Credit/Debit Card"><Space><CreditCardOutlined /> Credit/Debit Card</Space></Option>
            <Option value="Bank Transfer"><Space><BankOutlined /> Bank Transfer</Space></Option>
            <Option value="Over-the-Counter"><Space><ShopOutlined /> Over-the-Counter</Space></Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Transaction ID (if manual payment)" 
          name="transactionId"
          help="Optional for online payments, required for manual reference."
        >
          <Input placeholder="e.g. 123456789" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Pay Now ₱{bill.amount.toFixed(2)}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
