import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Statistic,
  Row,
  Col,
  Alert,
  Tabs,
  Descriptions,
  message,
  Empty,
  Typography
} from 'antd';
import LottieSpinner from '@/shared/components/LottieSpinner.jsx';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BankOutlined,
  FileTextOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckOutlined
} from '@ant-design/icons';
import StaffLayout from '@/features/staffs/components/StaffLayout';
import {
  getPendingVerifications,
  verifyPayment,
  generateReceipt,
  getDailyCollectionReport
} from '@/features/treasury/services/treasuryService';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text } = Typography;

const TreasuryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [collectionReport, setCollectionReport] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    fetchPendingPayments();
    fetchCollectionReport();
  }, []);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const response = await getPendingVerifications();
      setPendingPayments(response.payments || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
      message.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionReport = async () => {
    try {
      const response = await getDailyCollectionReport(selectedDate.format('YYYY-MM-DD'));
      setCollectionReport(response);
    } catch (error) {
      console.error('Failed to fetch collection report:', error);
    }
  };

  const handleVerify = async (values) => {
    try {
      await verifyPayment(selectedPayment.paymentId, values.verificationNotes);
      message.success('Payment verified successfully');
      setVerifyModalVisible(false);
      form.resetFields();
      fetchPendingPayments();
      fetchCollectionReport();
    } catch (error) {
      message.error('Failed to verify payment');
    }
  };

  const handleGenerateReceipt = async () => {
    try {
      const result = await generateReceipt(selectedPayment.paymentId);
      setGeneratedReceipt(result);
      setReceiptModalVisible(true);
      message.success('Receipt generated successfully');
    } catch (error) {
      message.error('Failed to generate receipt');
    }
  };

  const getStatusTag = (status) => {
    const config = {
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' },
      processing: { color: 'processing', icon: <ClockCircleOutlined />, text: 'Processing' },
      paid: { color: 'success', icon: <CheckCircleOutlined />, text: 'Paid' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' }
    };
    const c = config[status] || config.pending;
    return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
  };

  const getMethodTag = (method) => {
    const methods = {
      bank_transfer: { color: 'blue', text: 'Bank Transfer' },
      cash: { color: 'green', text: 'Cash' },
      gcash: { color: 'purple', text: 'GCash' },
      maya: { color: 'orange', text: 'Maya' },
      credit_card: { color: 'cyan', text: 'Credit Card' }
    };
    const m = methods[method] || { color: 'default', text: method };
    return <Tag color={m.color}>{m.text}</Tag>;
  };

  const pendingColumns = [
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      render: (text) => <code>{text}</code>
    },
    {
      title: 'Business',
      dataIndex: 'businessId',
      key: 'businessId'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₱${amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: getMethodTag
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? dayjs(date).format('MMM D, h:mm A') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              setSelectedPayment(record);
              setVerifyModalVisible(true);
            }}
          >
            Verify
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedPayment(record);
            }}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  return (
    <StaffLayout>
      <div style={{ padding: '24px' }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          <BankOutlined /> Treasury Dashboard
        </Title>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Verification"
                value={pendingPayments.length}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Today's Collection"
                value={collectionReport?.total || 0}
                prefix="₱"
                valueStyle={{ color: '#52c41a' }}
                formatter={(value) => value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Transactions Today"
                value={collectionReport?.count || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Bank Transfers Pending"
                value={pendingPayments.filter(p => p.paymentMethod === 'bank_transfer').length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<BankOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="pending">
          <TabPane tab="Pending Verifications" key="pending">
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={fetchPendingPayments} loading={loading}>
                  Refresh
                </Button>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <LottieSpinner />
                </div>
              ) : pendingPayments.length === 0 ? (
                <Empty description="No pending verifications" />
              ) : (
                <Table
                  dataSource={pendingPayments}
                  columns={pendingColumns}
                  rowKey="paymentId"
                  pagination={{ pageSize: 10 }}
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Daily Collection" key="collections">
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      fetchCollectionReport();
                    }}
                  />
                  <Button icon={<ReloadOutlined />} onClick={fetchCollectionReport}>
                    Refresh
                  </Button>
                </Space>
              </div>

              {collectionReport && (
                <>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Total Collection"
                          value={collectionReport.total}
                          prefix="₱"
                          formatter={(value) => value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Number of Payments"
                          value={collectionReport.count}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Average Payment"
                          value={collectionReport.count > 0 ? collectionReport.total / collectionReport.count : 0}
                          prefix="₱"
                          formatter={(value) => value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Title level={5}>Collection by Payment Method</Title>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {Object.entries(collectionReport.byMethod || {}).map(([method, amount]) => (
                      <Col span={8} key={method}>
                        <Card size="small">
                          <Statistic
                            title={method.replace('_', ' ').toUpperCase()}
                            value={amount}
                            prefix="₱"
                            formatter={(value) => value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <Title level={5}>Payment Details</Title>
                  <Table
                    dataSource={collectionReport.payments || []}
                    columns={[
                      { title: 'Receipt #', dataIndex: 'receiptNumber', key: 'receiptNumber' },
                      { title: 'Payment ID', dataIndex: 'paymentId', key: 'paymentId' },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => `₱${amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
                      { title: 'Method', dataIndex: 'paymentMethod', key: 'paymentMethod', render: getMethodTag },
                      { title: 'Paid At', dataIndex: 'paidAt', key: 'paidAt', render: (date) => dayjs(date).format('MMM D, h:mm A') }
                    ]}
                    rowKey="paymentId"
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )}
            </Card>
          </TabPane>
        </Tabs>

        {/* Verify Payment Modal */}
        <Modal
          title="Verify Payment"
          visible={verifyModalVisible}
          onCancel={() => {
            setVerifyModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          {selectedPayment && (
            <>
              <Alert
                message="Payment Verification"
                description="Verify that the payment has been received and matches the declared amount."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Payment ID">{selectedPayment.paymentId}</Descriptions.Item>
                <Descriptions.Item label="Amount">₱{selectedPayment.amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Descriptions.Item>
                <Descriptions.Item label="Method">{getMethodTag(selectedPayment.paymentMethod)}</Descriptions.Item>
                <Descriptions.Item label="Reference">{selectedPayment.referenceNumber || 'N/A'}</Descriptions.Item>
                {selectedPayment.metadata?.bankName && (
                  <Descriptions.Item label="Bank">{selectedPayment.metadata.bankName}</Descriptions.Item>
                )}
                {selectedPayment.metadata?.transferReference && (
                  <Descriptions.Item label="Transfer Ref">{selectedPayment.metadata.transferReference}</Descriptions.Item>
                )}
              </Descriptions>
              <Form form={form} layout="vertical" onFinish={handleVerify}>
                <Form.Item
                  name="verificationNotes"
                  label="Verification Notes"
                  rules={[{ required: true, message: 'Please enter verification notes' }]}
                >
                  <TextArea rows={3} placeholder="Enter any notes about this verification..." />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                      Confirm Verification
                    </Button>
                    <Button onClick={() => {
                      setVerifyModalVisible(false);
                      form.resetFields();
                    }}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </Modal>

        {/* Receipt Modal */}
        <Modal
          title="Official Receipt"
          visible={receiptModalVisible}
          onCancel={() => setReceiptModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setReceiptModalVisible(false)}>
              Close
            </Button>,
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              Download PDF
            </Button>
          ]}
        >
          {generatedReceipt && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Title level={4}>OFFICIAL RECEIPT</Title>
              <div style={{ border: '2px solid #000', padding: '24px', marginTop: '24px' }}>
                <Title level={5}>{generatedReceipt.receiptNumber}</Title>
                <div style={{ marginTop: '24px', textAlign: 'left' }}>
                  <p><strong>Payment ID:</strong> {generatedReceipt.paymentId}</p>
                  <p><strong>Amount:</strong> ₱{generatedReceipt.amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                  <p><strong>Description:</strong> {generatedReceipt.description}</p>
                  <p><strong>Payment Method:</strong> {generatedReceipt.paymentMethod}</p>
                  <p><strong>Date:</strong> {dayjs(generatedReceipt.paidAt).format('MMMM D, YYYY h:mm A')}</p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </StaffLayout>
  );
};

export default TreasuryDashboard;
