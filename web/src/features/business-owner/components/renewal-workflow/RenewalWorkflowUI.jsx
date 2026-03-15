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
  Upload,
  message,
  Spin,
  Tabs,
  List,
  Avatar,
  Steps,
  Rate,
  DatePicker,
  InputNumber,
  Checkbox,
  Radio,
  Collapse,
  Tree,
  Transfer,
  Calendar,
  Alert as AntAlert
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  PayCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  FileSearchOutlined,
  CalculatorOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  CarOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  getRenewalPeriod,
  startRenewal,
  acknowledgePeriod,
  downloadRequirementsPdf,
  submitGrossReceipts,
  uploadDocuments,
  uploadFile,
  getAssessment,
  processPayment,
  submitRenewal,
  getRenewalStatus
} from '@/features/business-owner/services/businessRenewalService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Panel } = Collapse;

const RenewalWorkflowUI = ({ businessId: propBusinessId, className }) => {
  const { businessId: paramBusinessId } = useParams();
  const navigate = useNavigate();
  const businessId = propBusinessId || paramBusinessId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [renewals, setRenewals] = useState([]);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newRenewalModalVisible, setNewRenewalModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [renewalPeriod, setRenewalPeriod] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [businesses, setBusinesses] = useState([]);
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    if (businessId) {
      fetchRenewalData();
    } else {
      // Load businesses so user can pick one
      getBusinessProfile?.()
        .then(profile => {
          const approved = (profile?.businesses || []).filter(b => b.applicationStatus === 'approved');
          setBusinesses(approved);
        })
        .catch(() => setBusinesses([]));
    }
  }, [businessId]);

  const fetchRenewalData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const periodData = await getRenewalPeriod(businessId);
      setRenewalPeriod(periodData);
      setRenewals(periodData?.renewals || []);
    } catch (error) {
      console.error('Failed to fetch renewal data:', error);
      message.error('Failed to load renewal data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRenewal = async (renewalYear) => {
    setSubmitting(true);
    try {
      const renewalData = await startRenewal(businessId, renewalYear);
      message.success('Renewal process started successfully');
      setNewRenewalModalVisible(false);
      fetchRenewalData();
    } catch (error) {
      message.error('Failed to start renewal process');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledgePeriod = async (renewalId) => {
    try {
      await acknowledgePeriod(businessId, renewalId);
      message.success('Renewal period acknowledged');
      fetchRenewalData();
    } catch (error) {
      message.error('Failed to acknowledge renewal period');
    }
  };

  const handleViewDetails = (renewal) => {
    setSelectedRenewal(renewal);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#faad14',
      in_progress: '#1890ff',
      completed: '#52c41a',
      rejected: '#f5222d',
      expired: '#8c8c8c'
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      in_progress: <SyncOutlined spin />,
      completed: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
      expired: <ExclamationCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getProgress = (status) => {
    const progress = {
      pending: 20,
      in_progress: 60,
      completed: 100,
      rejected: 40,
      expired: 0
    };
    return progress[status] || 0;
  };

  const renewalColumns = [
    {
      title: 'Renewal ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      render: (year) => <Text strong>{year}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <div>
          <Badge 
            status={status === 'completed' ? 'success' : status === 'rejected' ? 'error' : 'processing'} 
            text={status.replace('_', ' ').toUpperCase()}
          />
          <div style={{ marginTop: 4 }}>
            <Progress 
              percent={getProgress(status)} 
              size="small" 
              showInfo={false}
              strokeColor={getStatusColor(status)}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString()}
        </Text>
      )
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date) => (
        <Text type={new Date(date) < new Date() ? 'danger' : 'secondary'}>
          {new Date(date).toLocaleDateString()}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<FileSearchOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleAcknowledgePeriod(record.id)}
            >
              Acknowledge
            </Button>
          )}
        </Space>
      )
    }
  ];

  const calculateStats = () => {
    const total = renewals.length;
    const pending = renewals.filter(r => r.status === 'pending').length;
    const inProgress = renewals.filter(r => r.status === 'in_progress').length;
    const completed = renewals.filter(r => r.status === 'completed').length;
    const expired = renewals.filter(r => r.status === 'expired').length;
    
    return { total, pending, inProgress, completed, expired };
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange: (info) => {
      setFileList(info.fileList);
    },
    beforeUpload: () => false,
  };

  const renewalSteps = [
    { title: 'Period Acknowledgment', description: 'Acknowledge renewal period' },
    { title: 'Document Preparation', description: 'Prepare required documents' },
    { title: 'Gross Receipts', description: 'Submit gross receipts declaration' },
    { title: 'Assessment', description: 'Pay assessment fees' },
    { title: 'Final Submission', description: 'Submit complete application' }
  ];

  // When no businessId is available, show a business selector
  if (!businessId) {
    return (
      <div className={`renewal-workflow-ui ${className || ''}`} data-testid="renewals-dashboard">
        <Card title={<Space><CalendarOutlined /><span>Renewal Workflow</span></Space>}>
          {businesses.length > 0 ? (
            <div>
              <Title level={5}>Select a business to manage renewals</Title>
              <Row gutter={[16, 16]}>
                {businesses.map(b => (
                  <Col xs={24} sm={12} md={8} key={b.businessId || b._id}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => navigate(`/renewals/${b.businessId || b._id}`)}
                    >
                      <Text strong>{b.businessName || b.registeredBusinessName || 'Unnamed Business'}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{b.businessId || b._id}</Text>
                      {b.permitStatus && (
                        <div style={{ marginTop: 4 }}>
                          <Tag color={b.permitStatus === 'active' ? 'success' : 'default'}>{b.permitStatus}</Tag>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <Empty description="No approved businesses found for renewal" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className={`renewal-workflow-ui ${className || ''}`} data-testid="renewals-dashboard">
      <Card
        title={
          <Space data-testid="renewals-title">
            <CalendarOutlined />
            <span>Renewal Workflow</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchRenewalData}
              loading={loading}
              data-testid="refresh-renewals-button"
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setNewRenewalModalVisible(true)}
              data-testid="start-renewal-button"
            >
              Start Renewal
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} data-testid="renewals-tabs">
          <TabPane tab="Overview" key="overview">
            <Title level={4} data-testid="renewals-overview-title">Renewal Overview</Title>
            <Row gutter={16} style={{ marginBottom: 24 }} data-testid="renewal-stats">
              <Col span={6}>
                <Card size="small" data-testid="total-renewals-stat">
                  <Statistic
                    title="Total Renewals"
                    value={calculateStats().total}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" data-testid="pending-renewals-stat">
                  <Statistic
                    title="Pending"
                    value={calculateStats().pending}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" data-testid="inprogress-renewals-stat">
                  <Statistic
                    title="In Progress"
                    value={calculateStats().inProgress}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<SyncOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" data-testid="completed-renewals-stat">
                  <Statistic
                    title="Completed"
                    value={calculateStats().completed}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Title level={4} data-testid="recent-renewals-title">Recent Renewals</Title>
            {renewals.length > 0 ? (
              <Table
                dataSource={renewals}
                columns={[...renewalColumns, {
                  title: 'Actions',
                  key: 'renew-actions',
                  render: (_, record) => (
                    <Button 
                      type="primary" 
                      size="small"
                      data-testid="renew-business-button"
                      onClick={() => handleViewDetails(record)}
                    >
                      Renew
                    </Button>
                  )
                }]}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
                data-testid="renewals-table"
              />
            ) : (
              <Empty 
                description="No renewals found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                data-testid="empty-renewals"
              />
            )}
          </TabPane>

          <TabPane tab="All Renewals" key="all">
            <Table
              dataSource={renewals}
              columns={renewalColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Renewal Guide" key="guide">
            <RenewalGuide />
          </TabPane>

          <TabPane tab="Calendar" key="calendar">
            <div style={{ padding: 24 }}>
              <Title level={4}>Renewal Calendar</Title>
              <Calendar fullscreen={false} />
            </div>
          </TabPane>
        </Tabs>

        <Divider />

        <Title level={4}>Understanding Renewal Process</Title>
        <Alert
          message="Renewal Process Overview"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Business renewals ensure your business permits remain valid and compliant:
              </Paragraph>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Renewal Timeline">
                    <Text type="secondary">
                      • Period starts 90 days before expiry<br/>
                      • Acknowledgment required within 30 days<br/>
                      • Document preparation period: 60 days<br/>
                      • Assessment and payment: 30 days<br/>
                      • Total process: 90-120 days
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Required Documents">
                    <Text type="secondary">
                      • Previous year's permits<br/>
                      • Updated business documents<br/>
                      • Gross receipts declaration<br/>
                      • Tax clearance certificates<br/>
                      • Compliance certificates
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Payment Structure">
                    <Text type="secondary">
                      • Assessment fees based on gross receipts<br/>
                      • Additional charges for late filing<br/>
                      • Multiple payment options available<br/>
                      • Online payment processing
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

        <Alert
          message="Need Help with Renewals?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you need assistance with renewals, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Renewal Guide</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">FAQ</Button>
                <Button type="link" size="small">Document Checklist</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Renewal Detail Modal */}
      <Modal
        title="Renewal Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedRenewal && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Renewal ID" span={2}>
                {selectedRenewal.id}
              </Descriptions.Item>
              <Descriptions.Item label="Year">
                {selectedRenewal.year}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedRenewal.status === 'completed' ? 'success' : 'error'} 
                  text={selectedRenewal.status.replace('_', ' ').toUpperCase()}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {new Date(selectedRenewal.startDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Deadline">
                {new Date(selectedRenewal.deadline).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>Renewal Progress</Title>
              <Steps
                current={currentStep}
                size="small"
                items={renewalSteps}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* New Renewal Modal */}
      <Modal
        title={<span data-testid="renewal-form">Start New Renewal</span>}
        open={newRenewalModalVisible}
        onCancel={() => setNewRenewalModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setNewRenewalModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            onClick={() => form.submit()}
            loading={submitting}
            data-testid="submit-renewal-button"
          >
            Start Renewal
          </Button>
        ]}
        width={600}
      >
        <Form form={form} onFinish={(values) => handleStartRenewal(values.year)} layout="vertical" data-testid="renewal-form">
          <Form.Item 
            name="year"
            label="Renewal Year"
            rules={[{ required: true, message: 'Please select renewal year' }]}
          >
            <DatePicker picker="year" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Renewal Confirmation Modal */}
      <Modal
        title={<span data-testid="renewal-confirmation">Renewal Confirmation</span>}
        open={false}
        footer={null}
      >
        <Alert
          message="Renewal Submitted Successfully"
          description="Your renewal application has been submitted for processing."
          type="success"
          showIcon
        />
      </Modal>
    </div>
  );
};

// Renewal Guide Component
const RenewalGuide = () => {
  return (
    <div>
      <Title level={4}>Renewal Process Guide</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Renewal Steps" size="small">
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>Acknowledge Period</Text>
                <div>
                  <Text type="secondary">
                    Acknowledge renewal notice and timeline
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>Prepare Documents</Text>
                <div>
                  <Text type="secondary">
                    Gather all required documents and certificates
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>Submit Gross Receipts</Text>
                <div>
                  <Text type="secondary">
                    File gross receipts declaration for assessment
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>Pay Assessment</Text>
                <div>
                  <Text type="secondary">
                    Pay calculated assessment fees
                  </Text>
                </div>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Important Dates" size="small">
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: 'Renewal Period Opens',
                  description: '90 days before expiry'
                },
                {
                  title: 'Acknowledgment Deadline',
                  description: '30 days from notice'
                },
                {
                  title: 'Document Submission',
                  description: '60 days period'
                },
                {
                  title: 'Final Deadline',
                  description: 'Permit expiry date'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Document Checklist" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Title level={5}>Business Documents</Title>
            <ul>
              <li>Previous year's permit</li>
              <li>Updated business registration</li>
              <li>DTI/SEC certificate</li>
              <li>Barangay clearance</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Financial Documents</Title>
            <ul>
              <li>Gross receipts declaration</li>
              <li>Tax clearance certificate</li>
              <li>Financial statements</li>
              <li>Payment receipts</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Compliance Documents</Title>
            <ul>
              <li>Sanitary permit</li>
              <li>Fire safety certificate</li>
              <li>Environmental compliance</li>
              <li>Zoning clearance</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RenewalWorkflowUI;
