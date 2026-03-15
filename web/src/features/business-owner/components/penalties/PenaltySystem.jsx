import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Alert,
  Space,
  Typography,
  Divider,
  Tag,
  Progress,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
  Badge,
  Timeline,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Tabs,
  List,
  Avatar
} from 'antd';
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  EyeOutlined,
  PayCircleOutlined,
  AlertOutlined,
  ReloadOutlined,
  CalendarOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  getViolations,
  getOpenViolations,
  getViolationSummary,
  acknowledgeViolation,
  VIOLATION_STATUSES,
  VIOLATION_SEVERITIES,
  getStatusLabel,
  getSeverityLabel,
  getStatusColor,
  getSeverityColor
} from '@/features/business-owner/services/violationsService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const PenaltySystem = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [openViolations, setOpenViolations] = useState([]);
  const [violationSummary, setViolationSummary] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [penaltyCalculations, setPenaltyCalculations] = useState({});
  const [form] = Form.useForm();
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchPenaltyData();
  }, [businessId]);

  const fetchPenaltyData = async () => {
    setLoading(true);
    try {
      // Fetch all violations data
      const violationsData = await getViolations({ businessId });
      const openViolationsData = await getOpenViolations({ limit: 10 });
      const summaryData = await getViolationSummary();
      
      setViolations(violationsData?.violations || []);
      setOpenViolations(openViolationsData?.violations || []);
      setViolationSummary(summaryData);
      
      // Calculate penalties for open violations
      const calculations = {};
      openViolationsData?.violations?.forEach(violation => {
        calculations[violation.id] = calculatePenalty(violation);
      });
      setPenaltyCalculations(calculations);
    } catch (error) {
      console.error('Failed to fetch penalty data:', error);
      message.error('Failed to load penalty data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePenalty = (violation) => {
    // Simulate penalty calculation based on violation details
    const basePenalty = getBasePenalty(violation.severity);
    const daysOverdue = violation.daysOverdue || 0;
    const surchargeRate = 0.25; // 25% surcharge
    const interestRate = 0.02; // 2% monthly interest
    
    const surcharge = daysOverdue > 30 ? basePenalty * surchargeRate : 0;
    const interest = daysOverdue > 60 ? (basePenalty + surcharge) * (interestRate * Math.floor(daysOverdue / 30)) : 0;
    const totalPenalty = basePenalty + surcharge + interest;
    
    return {
      basePenalty,
      surcharge,
      interest,
      totalPenalty,
      daysOverdue,
      dueDate: new Date(Date.now() + (30 - daysOverdue) * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  };

  const getBasePenalty = (severity) => {
    const penalties = {
      minor: 1000,
      major: 5000,
      critical: 10000
    };
    return penalties[severity] || 1000;
  };

  const handleAcknowledgeViolation = async (violationId) => {
    try {
      await acknowledgeViolation(violationId);
      message.success('Violation acknowledged successfully');
      fetchPenaltyData(); // Refresh data
    } catch (error) {
      message.error('Failed to acknowledge violation');
    }
  };

  const handleViewDetails = (violation) => {
    setSelectedViolation(violation);
    setDetailModalVisible(true);
  };

  const handlePayPenalty = (violation) => {
    setSelectedViolation(violation);
    setPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      // Simulate payment processing
      message.loading('Processing payment...', 0);
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.destroy();
      message.success('Payment processed successfully');
      setPaymentModalVisible(false);
      fetchPenaltyData(); // Refresh data
    } catch (error) {
      message.destroy();
      message.error('Payment processing failed');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      minor: '#faad14',
      major: '#fa8c16',
      critical: '#f5222d'
    };
    return colors[severity] || '#d9d9d9';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#f5222d',
      resolved: '#52c41a',
      appealed: '#1890ff'
    };
    return colors[status] || '#d9d9d9';
  };

  const violationColumns = [
    {
      title: 'Violation ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <Text code>{id}</Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue">{type}</Tag>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {getSeverityLabel(severity)}
        </Tag>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Penalty',
      dataIndex: 'penalty',
      key: 'penalty',
      render: (_, record) => {
        const calc = penaltyCalculations[record.id];
        return calc ? (
          <div>
            <Text strong>₱{calc.totalPenalty.toLocaleString()}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Due: {calc.dueDate}
              </Text>
            </div>
          </div>
        ) : (
          <Text type="secondary">Calculating...</Text>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'open' ? 'error' : status === 'resolved' ? 'success' : 'processing'} 
          text={getStatusLabel(status)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'open' && (
            <Button 
              size="small" 
              type="primary"
              icon={<PayCircleOutlined />}
              onClick={() => handlePayPenalty(record)}
            >
              Pay
            </Button>
          )}
        </Space>
      )
    }
  ];

  const calculateTotalPenalties = () => {
    return Object.values(penaltyCalculations).reduce((total, calc) => total + calc.totalPenalty, 0);
  };

  const getUrgentViolations = () => {
    return openViolations.filter(v => {
      const calc = penaltyCalculations[v.id];
      return calc && calc.daysOverdue > 30;
    });
  };

  return (
    <div className={`penalty-system ${className || ''}`}>
      <Card
        title={
          <Space>
            <ExclamationCircleOutlined />
            <span>Penalty System</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchPenaltyData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<CalculatorOutlined />}
              onClick={() => setActiveTab('calculator')}
            >
              Penalty Calculator
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            {/* Penalty Overview Statistics */}
            <Title level={4}>Penalty Overview</Title>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Penalties"
                    value={calculateTotalPenalties()}
                    prefix="₱"
                    valueStyle={{ color: '#f5222d' }}
                    formatter={(value) => `₱${value.toLocaleString()}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Open Violations"
                    value={openViolations.length}
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Urgent (Over 30 days)"
                    value={getUrgentViolations().length}
                    valueStyle={{ color: '#fa8c16' }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Resolved"
                    value={violations.filter(v => v.status === 'resolved').length}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Urgent Violations Alert */}
            {getUrgentViolations().length > 0 && (
              <Alert
                message="Urgent Action Required"
                description={`You have ${getUrgentViolations().length} violation(s) overdue by more than 30 days. Additional penalties may apply.`}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {/* Open Violations */}
            <Title level={4}>Open Violations</Title>
            {openViolations.length > 0 ? (
              <Table
                dataSource={openViolations}
                columns={violationColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty 
                description="No open violations"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </TabPane>

          <TabPane tab="All Violations" key="all">
            <Table
              dataSource={violations}
              columns={violationColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Penalty Calculator" key="calculator">
            <PenaltyCalculator />
          </TabPane>

          <TabPane tab="Payment History" key="history">
            <PaymentHistory />
          </TabPane>
        </Tabs>

        <Divider />

        {/* Information Section */}
        <Title level={4}>Understanding Penalties</Title>
        <Alert
          message="Penalty Structure"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Penalties are calculated based on violation severity and overdue time:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Base Penalties">
                    <Text type="secondary">
                      • Minor: ₱1,000<br/>
                      • Major: ₱5,000<br/>
                      • Critical: ₱10,000
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Additional Charges">
                    <Text type="secondary">
                      • 25% surcharge after 30 days<br/>
                      • 2% monthly interest after 60 days<br/>
                      • Compounding on overdue amounts
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Payment Options">
                    <Text type="secondary">
                      • Online payment portal<br/>
                      • LGU payment centers<br/>
                      • Bank deposit options<br/>
                      • Installment plans available
                    </Text>
                  </Card>
                </Col>
              </Row>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Help Section */}
        <Alert
          message="Need Help with Penalties?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you have questions about penalties or need assistance with payments, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Payment Guide</Button>
                <Button type="link" size="small">Appeal Process</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">FAQ</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Violation Detail Modal */}
      <Modal
        title="Violation Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedViolation?.status === 'open' && (
            <Button 
              key="acknowledge" 
              onClick={() => handleAcknowledgeViolation(selectedViolation.id)}
            >
              Acknowledge
            </Button>
          ),
          selectedViolation?.status === 'open' && (
            <Button 
              key="pay" 
              type="primary"
              icon={<PayCircleOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handlePayPenalty(selectedViolation);
              }}
            >
              Pay Penalty
            </Button>
          )
        ]}
        width={800}
      >
        {selectedViolation && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Violation ID" span={2}>
                {selectedViolation.id}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedViolation.type}
              </Descriptions.Item>
              <Descriptions.Item label="Severity">
                <Tag color={getSeverityColor(selectedViolation.severity)}>
                  {getSeverityLabel(selectedViolation.severity)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedViolation.status === 'open' ? 'error' : 'success'} 
                  text={getStatusLabel(selectedViolation.status)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Date Issued">
                {new Date(selectedViolation.dateIssued).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedViolation.description}
              </Descriptions.Item>
            </Descriptions>

            {penaltyCalculations[selectedViolation.id] && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Penalty Breakdown</Title>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Base Penalty">
                    ₱{penaltyCalculations[selectedViolation.id].basePenalty.toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Surcharge (25%)">
                    ₱{penaltyCalculations[selectedViolation.id].surcharge.toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Interest">
                    ₱{penaltyCalculations[selectedViolation.id].interest.toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Penalty">
                    <Text strong style={{ color: '#f5222d' }}>
                      ₱{penaltyCalculations[selectedViolation.id].totalPenalty.toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Due Date">
                    {penaltyCalculations[selectedViolation.id].dueDate}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Pay Penalty"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="pay" 
            type="primary"
            htmlType="submit"
            onClick={() => form.submit()}
          >
            Process Payment
          </Button>
        ]}
        width={600}
      >
        {selectedViolation && (
          <div>
            <Alert
              message="Payment Processing"
              description="Complete the form below to process your penalty payment."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} onFinish={handlePaymentSubmit} layout="vertical">
              <Form.Item label="Violation ID">
                <Input value={selectedViolation.id} disabled />
              </Form.Item>
              
              <Form.Item label="Amount">
                <Input 
                  value={`₱${penaltyCalculations[selectedViolation.id]?.totalPenalty?.toLocaleString() || '0'}`}
                  disabled
                />
              </Form.Item>
              
              <Form.Item 
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="Select payment method">
                  <Option value="credit_card">Credit Card</Option>
                  <Option value="debit_card">Debit Card</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                  <Option value="cash">Cash (LGU Office)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item 
                name="referenceNumber"
                label="Reference Number (Optional)"
              >
                <Input placeholder="Enter reference number if available" />
              </Form.Item>
              
              <Form.Item 
                name="notes"
                label="Notes"
              >
                <TextArea rows={3} placeholder="Add any notes about this payment" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Penalty Calculator Component
const PenaltyCalculator = () => {
  const [form] = Form.useForm();
  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async (values) => {
    setCalculating(true);
    try {
      // Simulate calculation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const basePenalty = getBasePenalty(values.severity);
      const daysOverdue = values.daysOverdue || 0;
      const surchargeRate = 0.25;
      const interestRate = 0.02;
      
      const surcharge = daysOverdue > 30 ? basePenalty * surchargeRate : 0;
      const interest = daysOverdue > 60 ? (basePenalty + surcharge) * (interestRate * Math.floor(daysOverdue / 30)) : 0;
      const totalPenalty = basePenalty + surcharge + interest;
      
      setCalculation({
        basePenalty,
        surcharge,
        interest,
        totalPenalty,
        daysOverdue
      });
    } catch (error) {
      message.error('Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const getBasePenalty = (severity) => {
    const penalties = {
      minor: 1000,
      major: 5000,
      critical: 10000
    };
    return penalties[severity] || 1000;
  };

  return (
    <div>
      <Form form={form} onFinish={handleCalculate} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item 
              name="severity"
              label="Violation Severity"
              rules={[{ required: true, message: 'Please select severity' }]}
            >
              <Select placeholder="Select severity">
                <Option value="minor">Minor (₱1,000)</Option>
                <Option value="major">Major (₱5,000)</Option>
                <Option value="critical">Critical (₱10,000)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="daysOverdue"
              label="Days Overdue"
              rules={[{ required: true, message: 'Please enter days overdue' }]}
            >
              <Input type="number" placeholder="Enter days overdue" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label=" ">
              <Button 
                type="primary" 
                htmlType="submit"
                loading={calculating}
                icon={<CalculatorOutlined />}
              >
                Calculate
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {calculation && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Calculation Result</Title>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Base Penalty">
              ₱{calculation.basePenalty.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Surcharge (25%)">
              ₱{calculation.surcharge.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Interest">
              ₱{calculation.interest.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Total Penalty">
              <Text strong style={{ color: '#f5222d' }}>
                ₱{calculation.totalPenalty.toLocaleString()}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </div>
  );
};

// Payment History Component
const PaymentHistory = () => {
  const [payments] = useState([
    {
      id: 'PAY-001',
      violationId: 'VIO-001',
      amount: 1250,
      date: '2024-01-15',
      method: 'Credit Card',
      status: 'Completed'
    },
    {
      id: 'PAY-002',
      violationId: 'VIO-002',
      amount: 5000,
      date: '2024-01-10',
      method: 'Bank Transfer',
      status: 'Completed'
    }
  ]);

  return (
    <List
      dataSource={payments}
      renderItem={(payment) => (
        <List.Item>
          <List.Item.Meta
            avatar={<Avatar icon={<DollarOutlined />} />}
            title={`Payment ${payment.id}`}
            description={
              <div>
                <Text strong>₱{payment.amount.toLocaleString()}</Text>
                <div>
                  <Text type="secondary">
                    {payment.method} • {new Date(payment.date).toLocaleDateString()}
                  </Text>
                </div>
              </div>
            }
          />
          <div>
            <Badge status="success" text={payment.status} />
          </div>
        </List.Item>
      )}
    />
  );
};

export default PenaltySystem;
