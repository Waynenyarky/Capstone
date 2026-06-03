import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, message, Alert } from 'antd';
import { CreditCardOutlined, BankOutlined, CalendarOutlined } from '@ant-design/icons';
import { getPaymentMethods, getPaymentHistory, setupRecurringPayment, submitPaymentDispute } from '../../services/paymentService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const AdvancedPaymentDashboard = () => {
  const { business } = useBusiness();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [paymentRecoveryVisible, setPaymentRecoveryVisible] = useState(false);
  const [paymentSuccessVisible, setPaymentSuccessVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (business?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [methodsData, historyData] = await Promise.all([
            getPaymentMethods(business.id),
            getPaymentHistory(business.id)
          ]);
          setPaymentMethods(methodsData?.methods || []);
          setPaymentHistory(historyData?.payments || []);
        } catch (error) {
          message.error('Failed to fetch payment data.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [business]);

  const handleSetupRecurring = async (values) => {
    try {
      await setupRecurringPayment(business.id, values);
      message.success('Recurring payment setup successfully.');
      setRecurringModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to setup recurring payment.');
    }
  };

  const handleSubmitDispute = async (values) => {
    try {
      await submitPaymentDispute(selectedPayment.id, values);
      message.success('Payment dispute submitted successfully.');
      setDisputeModalVisible(false);
      setSelectedPayment(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit payment dispute.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'green',
      'Pending': 'orange',
      'Failed': 'red',
      'Processing': 'blue',
      'Disputed': 'purple'
    };
    return colors[status] || 'default';
  };

  const paymentColumns = [
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>${amount}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary">View Details</Button>
          {record.status === 'Completed' && (
            <Button
              size="small"
              onClick={() => { setSelectedPayment(record); setDisputeModalVisible(true); }}
            >
              Dispute
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const totalPayments = paymentHistory.length;
  const completedPayments = paymentHistory.filter(p => p.status === 'Completed').length;
  const pendingPayments = paymentHistory.filter(p => p.status === 'Pending').length;
  const totalAmount = paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <Card loading={loading} title={<span data-testid="payments-title">Advanced Payment Dashboard</span>} data-testid="payments-dashboard">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }} data-testid="payment-stats">
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="total-payments-stat">
            <Statistic
              title="Total Payments"
              value={totalPayments}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="completed-payments-stat">
            <Statistic
              title="Completed"
              value={completedPayments}
              valueStyle={{ color: '#3f8600' }}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="pending-payments-stat">
            <Statistic
              title="Pending"
              value={pendingPayments}
              valueStyle={{ color: '#faad14' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="total-amount-stat">
            <Statistic
              title="Total Amount"
              value={totalAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Payment Methods" size="small" data-testid="payment-methods-card">
            <div data-testid="payment-methods-list">
              {paymentMethods.map(method => (
                <div key={method.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }} data-testid="payment-method-item">
                  <Space>
                    {method.type === 'credit-card' ? <CreditCardOutlined /> :
                     method.type === 'bank' ? <BankOutlined /> : <CreditCardOutlined />}
                    <Text strong>{method.name}</Text>
                    {method.isDefault && <Tag color="green">Default</Tag>}
                  </Space>
                  <div>
                    <Text type="secondary">{method.description}</Text>
                    <br />
                    <Text type="secondary">Expires: {method.expires}</Text>
                  </div>
                  <Space>
                    <Button type={method.isDefault ? 'primary' : 'default'} size="small">
                      {method.isDefault ? 'Default' : 'Set Default'}
                    </Button>
                    <Button type="primary" size="small" data-testid="pay-now-button">
                      Pay Now
                    </Button>
                  </Space>
                </div>
              ))}
            </div>
            <Button type="dashed" block style={{ marginTop: 16 }} data-testid="add-payment-method-button">
              Add Payment Method
            </Button>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" size="small" data-testid="quick-actions-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={() => setRecurringModalVisible(true)} data-testid="setup-recurring-button">
                Setup Recurring Payment
              </Button>
              <Button block data-testid="view-analytics-button">View Payment Analytics</Button>
              <Button block data-testid="download-history-button">Download Payment History</Button>
              <Button block data-testid="manage-methods-button">Manage Payment Methods</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Payment History" style={{ marginTop: 16 }} data-testid="payment-history-card">
        <div data-testid="pending-payments" style={{ marginBottom: 16 }}>
          <Alert
            message={`You have ${pendingPayments} pending payment(s)`}
            type="warning"
            showIcon
          />
        </div>
        <Table dataSource={paymentHistory} columns={paymentColumns} rowKey="paymentId" data-testid="payment-history-table" />
      </Card>

      <Modal
        title={<span data-testid="payment-modal">Setup Recurring Payment</span>}
        open={recurringModalVisible}
        onCancel={() => setRecurringModalVisible(false)}
        footer={null}
        data-testid="recurring-payment-modal"
      >
        <Form form={form} onFinish={handleSetupRecurring} layout="vertical" data-testid="payment-form">
          <Form.Item name="paymentType" label="Payment Type" rules={[{ required: true, message: 'Please select payment type' }]}>
            <Select placeholder="Select payment type" data-testid="payment-method-select">
              <Select.Option value="permit-renewal">Permit Renewal</Select.Option>
              <Select.Option value="compliance-fee">Compliance Fee</Select.Option>
              <Select.Option value="inspection-fee">Inspection Fee</Select.Option>
              <Select.Option value="business-license">Business License</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Please enter amount' }]}>
            <Input type="number" prefix="$" placeholder="0.00" data-testid="payment-amount" />
          </Form.Item>
          <Form.Item name="cardNumber" label="Card Number">
            <Input placeholder="1234 5678 9012 3456" data-testid="card-number-input" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expiry" label="Expiry">
                <Input placeholder="MM/YY" data-testid="card-expiry-input" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cvc" label="CVC">
                <Input placeholder="123" data-testid="card-cvc-input" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: 'Please select frequency' }]}>
            <Select placeholder="Select frequency">
              <Select.Option value="monthly">Monthly</Select.Option>
              <Select.Option value="quarterly">Quarterly</Select.Option>
              <Select.Option value="annually">Annually</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" data-testid="confirm-payment-button">Setup Recurring Payment</Button>
              <Button onClick={() => setRecurringModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Submit Payment Dispute"
        open={disputeModalVisible}
        onCancel={() => setDisputeModalVisible(false)}
        footer={null}
        data-testid="payment-dispute-modal"
      >
        <Form form={form} onFinish={handleSubmitDispute} layout="vertical">
          <Form.Item name="reason" label="Dispute Reason" rules={[{ required: true, message: 'Please enter dispute reason' }]}>
            <Select placeholder="Select dispute reason">
              <Select.Option value="duplicate">Duplicate Charge</Select.Option>
              <Select.Option value="incorrect-amount">Incorrect Amount</Select.Option>
              <Select.Option value="unauthorized">Unauthorized Payment</Select.Option>
              <Select.Option value="service-not-rendered">Service Not Rendered</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please provide description' }]}>
            <Input.TextArea rows={4} placeholder="Please describe the issue in detail" />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email" rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}>
            <Input placeholder="your@email.com" />
          </Form.Item>
          <Form.Item name="supportingDocuments" label="Supporting Documents">
            <Input placeholder="Document URLs or references" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Submit Dispute</Button>
              <Button onClick={() => setDisputeModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span data-testid="payment-success-message">Payment Successful</span>}
        open={paymentSuccessVisible}
        onCancel={() => setPaymentSuccessVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPaymentSuccessVisible(false)}>Close</Button>
        ]}
      >
        <Alert
          message="Payment processed successfully!"
          description="Your payment has been confirmed and recorded."
          type="success"
          showIcon
        />
      </Modal>

      <Modal
        title={<span data-testid="payment-recovery-modal">Payment Recovery</span>}
        open={paymentRecoveryVisible}
        onCancel={() => setPaymentRecoveryVisible(false)}
        footer={null}
      >
        <Alert
          message="Payment Failed"
          description="Your payment could not be processed. Please try an alternative method."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block data-testid="alternative-card-option" onClick={() => {}}>Try Different Card</Button>
          <Button block data-testid="bank-transfer-option" onClick={() => {}}>Bank Transfer</Button>
          <Button block type="primary" data-testid="mobile-money-option" onClick={() => {}}>Mobile Money</Button>
        </Space>
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Mobile Number">
            <Input placeholder="09123456789" data-testid="mobile-number-input" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block data-testid="process-payment-button">Process Payment</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdvancedPaymentDashboard;
