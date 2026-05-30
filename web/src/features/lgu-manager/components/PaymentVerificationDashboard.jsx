import { useState, useEffect } from 'react'
import { 
  Card, Table, Button, Modal, Form, Input, Space, Tag, Typography, 
  App, Empty, Row, Col, Statistic, Alert, DatePicker,
  Descriptions, Image
} from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { 
  CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, ReloadOutlined, DownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { 
  getPendingPayments, 
  verifyPayment, 
  rejectPayment,
  getDailyCollectionReport,
  downloadReconciliationReport
} from '../services/paymentVerificationService'

const { Title, Text } = Typography
const { TextArea } = Input

export default function PaymentVerificationDashboard() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [dailyStats, setDailyStats] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchDailyStats()
    }
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getPendingPayments()
      setPayments(data)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      message.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyStats = async () => {
    try {
      const stats = await getDailyCollectionReport(selectedDate.format('YYYY-MM-DD'))
      setDailyStats(stats)
    } catch (error) {
      console.error('Failed to fetch daily stats:', error)
    }
  }

  const openVerifyModal = (payment) => {
    setSelectedPayment(payment)
    setVerifyModalOpen(true)
    form.resetFields()
  }

  const handleVerify = async (values) => {
    setProcessing(true)
    try {
      await verifyPayment(selectedPayment._id || selectedPayment.paymentId, {
        verified: true,
        verificationNotes: values.notes,
        officialReceiptNumber: values.receiptNumber
      })
      
      message.success('Payment verified successfully')
      setVerifyModalOpen(false)
      fetchData()
      fetchDailyStats()
    } catch (error) {
      console.error('Verification failed:', error)
      message.error('Failed to verify payment')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (values) => {
    setProcessing(true)
    try {
      await rejectPayment(selectedPayment._id || selectedPayment.paymentId, {
        rejectionReason: values.rejectionReason
      })
      
      message.success('Payment rejected')
      setVerifyModalOpen(false)
      fetchData()
      fetchDailyStats()
    } catch (error) {
      console.error('Rejection failed:', error)
      message.error('Failed to reject payment')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const blob = await downloadReconciliationReport(selectedDate.format('YYYY-MM-DD'))
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reconciliation-${selectedDate.format('YYYY-MM-DD')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('Report downloaded')
    } catch (error) {
      console.error('Download failed:', error)
      message.error('Failed to download report')
    }
  }

  const columns = [
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (id, record) => id || record._id || 'N/A'
    },
    {
      title: 'Business Name',
      dataIndex: ['business', 'businessName'],
      key: 'businessName',
      render: (text, record) => text || record.businessName || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₱${(amount || 0).toLocaleString()}`
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        const colors = {
          cash: 'green',
          gcash: 'blue',
          maya: 'purple',
          bank_transfer: 'orange',
          online_banking: 'cyan'
        }
        return <Tag color={colors[method] || 'default'}>{method || 'N/A'}</Tag>
      }
    },
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (ref) => ref || 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM D, YYYY HH:mm')
    },
    {
      title: 'Status',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      render: (status) => {
        const colors = {
          pending: 'warning',
          verified: 'success',
          rejected: 'error'
        }
        return <Tag color={colors[status] || 'default'}>{status || 'pending'}</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openVerifyModal(record)}
          disabled={record.verificationStatus === 'verified'}
        >
          Review
        </Button>
      )
    }
  ]

  const pendingCount = payments.filter(p => p.verificationStatus === 'pending').length
  const verifiedCount = payments.filter(p => p.verificationStatus === 'verified').length
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  if (loading) {
    return (
      <Card>
        <LottieSpinner tip="Loading payment data..." />
      </Card>
    )
  }

  return (
    <div>
      <Title level={3}>Payment Verification Dashboard</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Verification"
              value={pendingCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified Today"
              value={verifiedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={totalAmount}
              prefix="₱"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Daily Collections"
              value={dailyStats?.totalCollections || 0}
              prefix="₱"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {pendingCount > 0 && (
        <Alert
          message={`${pendingCount} payment(s) pending verification`}
          description="Please review and verify pending payments to maintain accurate financial records."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="Payment Verification Queue"
        extra={
          <Space>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              format="YYYY-MM-DD"
            />
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={payments}
          rowKey={(record) => record._id || record.paymentId}
          pagination={{ pageSize: 10 }}
          locale={{ 
            emptyText: <Empty description="No payments to verify" image={Empty.PRESENTED_IMAGE_SIMPLE} /> 
          }}
        />
      </Card>

      <Modal
        title="Verify Payment"
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedPayment && (
          <div>
            <Alert
              message="Payment Details"
              description={
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Payment ID">
                    {selectedPayment.paymentId || selectedPayment._id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    ₱{(selectedPayment.amount || 0).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business">
                    {selectedPayment.business?.businessName || selectedPayment.businessName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Method">
                    {selectedPayment.paymentMethod}
                  </Descriptions.Item>
                  <Descriptions.Item label="Reference Number">
                    {selectedPayment.referenceNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date">
                    {dayjs(selectedPayment.createdAt).format('MMM D, YYYY HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />

            {selectedPayment.proofOfPayment && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Proof of Payment:</Text>
                <div style={{ marginTop: 8 }}>
                  <Image
                    src={selectedPayment.proofOfPayment}
                    alt="Proof of Payment"
                    style={{ maxWidth: '100%' }}
                  />
                </div>
              </div>
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleVerify}
            >
              <Form.Item
                name="receiptNumber"
                label="Official Receipt Number"
                rules={[{ required: true, message: 'Please enter OR number' }]}
              >
                <Input placeholder="OR-2026-XXXXX" />
              </Form.Item>

              <Form.Item
                name="notes"
                label="Verification Notes"
              >
                <TextArea rows={3} placeholder="Add any verification notes..." />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={processing}
                    icon={<CheckCircleOutlined />}
                  >
                    Verify & Approve
                  </Button>
                  <Button 
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: 'Reject Payment',
                        content: (
                          <Form layout="vertical">
                            <Form.Item
                              name="rejectionReason"
                              label="Rejection Reason"
                              rules={[{ required: true }]}
                            >
                              <TextArea rows={3} placeholder="Explain why this payment is being rejected..." />
                            </Form.Item>
                          </Form>
                        ),
                        onOk: (close) => {
                          const reason = document.querySelector('textarea[name="rejectionReason"]')?.value
                          if (reason) {
                            handleReject({ rejectionReason: reason })
                            close()
                          }
                        }
                      })
                    }}
                    icon={<CloseCircleOutlined />}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => setVerifyModalOpen(false)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
