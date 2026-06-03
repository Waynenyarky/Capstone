import { useState, useEffect } from 'react';
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
  Tabs,
  List,
  Avatar,
  Steps
} from 'antd';
import {
  ExclamationCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  getAppeals,
  submitAppeal,
  APPEAL_TYPES,
  APPEAL_STATUSES,
  getAppealTypeLabel,
  getAppealStatusLabel
} from '@/features/business-owner/services/appealsService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

const AppealsSystem = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newAppealModalVisible, setNewAppealModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchAppealsData();
  }, [businessId]);

  const fetchAppealsData = async () => {
    setLoading(true);
    try {
      const appealsData = await getAppeals({ status: filterStatus });
      setAppeals(appealsData?.appeals || []);
    } catch (error) {
      console.error('Failed to fetch appeals data:', error);
      message.error('Failed to load appeals data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async (values) => {
    setSubmitting(true);
    try {
      const appealData = {
        businessId,
        appealType: values.appealType,
        description: values.description,
        violationId: values.violationId,
        inspectionId: values.inspectionId,
        evidence: fileList.map(file => file.url || file.name)
      };

      await submitAppeal(appealData);
      message.success('Appeal submitted successfully');
      setNewAppealModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchAppealsData(); // Refresh data
    } catch (error) {
      message.error('Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: '#1890ff',
      under_review: '#faad14',
      approved: '#52c41a',
      rejected: '#f5222d'
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusIcon = (status) => {
    const icons = {
      submitted: <ClockCircleOutlined />,
      under_review: <ExclamationCircleOutlined />,
      approved: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getAppealProgress = (status) => {
    const progress = {
      submitted: 25,
      under_review: 50,
      approved: 100,
      rejected: 75
    };
    return progress[status] || 0;
  };

  const getAppealSteps = (status) => {
    const currentStep = {
      submitted: 0,
      under_review: 1,
      approved: 2,
      rejected: 2
    };
    return currentStep[status] || 0;
  };

  const filteredAppeals = appeals.filter(appeal => {
    const matchesFilter = !filterStatus || appeal.status === filterStatus;
    const matchesSearch = !searchTerm || 
      appeal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appeal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAppealTypeLabel(appeal.appealType).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const appealColumns = [
    {
      title: 'Appeal ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <Text code>{id}</Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'appealType',
      key: 'appealType',
      render: (type) => (
        <Tag color="blue">{getAppealTypeLabel(type)}</Tag>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description) => (
        <Tooltip title={description}>
          <Text>{description}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <div>
          <Badge 
            status={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'processing'} 
            text={getAppealStatusLabel(status)}
          />
          <div style={{ marginTop: 4 }}>
            <Progress 
              percent={getAppealProgress(status)} 
              size="small" 
              showInfo={false}
              strokeColor={getStatusColor(status)}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (
        <Text type="secondary">
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
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'submitted' && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => message.info('You can withdraw this appeal')}
            >
              Withdraw
            </Button>
          )}
        </Space>
      )
    }
  ];

  const calculateAppealStats = () => {
    const total = appeals.length;
    const submitted = appeals.filter(a => a.status === 'submitted').length;
    const underReview = appeals.filter(a => a.status === 'under_review').length;
    const approved = appeals.filter(a => a.status === 'approved').length;
    const rejected = appeals.filter(a => a.status === 'rejected').length;
    
    return { total, submitted, underReview, approved, rejected };
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange: (info) => {
      setFileList(info.fileList);
    },
    beforeUpload: () => false, // Prevent automatic upload
  };

  return (
    <div className={`appeals-system ${className || ''}`}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Appeals System</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchAppealsData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setNewAppealModalVisible(true)}
            >
              New Appeal
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            {/* Appeal Statistics */}
            <Title level={4}>Appeal Overview</Title>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Appeals"
                    value={calculateAppealStats().total}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Submitted"
                    value={calculateAppealStats().submitted}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Under Review"
                    value={calculateAppealStats().underReview}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Resolved"
                    value={calculateAppealStats().approved + calculateAppealStats().rejected}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Filters and Search */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Select
                  placeholder="Filter by status"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">All Statuses</Option>
                  {Object.entries(APPEAL_STATUSES).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Search appeals..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col span={8}>
                <Text type="secondary">
                  {filteredAppeals.length} of {appeals.length} appeals
                </Text>
              </Col>
            </Row>

            {/* Recent Appeals */}
            <Title level={4}>Recent Appeals</Title>
            {filteredAppeals.length > 0 ? (
              <Table
                dataSource={filteredAppeals}
                columns={appealColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty 
                description="No appeals found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </TabPane>

          <TabPane tab="All Appeals" key="all">
            <Table
              dataSource={filteredAppeals}
              columns={appealColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Appeal Guidelines" key="guidelines">
            <AppealGuidelines />
          </TabPane>
        </Tabs>

        <Divider />

        {/* Information Section */}
        <Title level={4}>Understanding Appeals</Title>
        <Alert
          message="Appeal Process"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Appeals allow you to contest decisions or assessments that you believe are incorrect:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Grounds for Appeal">
                    <Text type="secondary">
                      • Incorrect fee calculations<br/>
                      • Wrong violation citations<br/>
                      • Assessment errors<br/>
                      • Other valid reasons
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Required Evidence">
                    <Text type="secondary">
                      • Supporting documents<br/>
                      • Photographs<br/>
                      • Receipts<br/>
                      • Official records
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Timeline">
                    <Text type="secondary">
                      • Submission: Immediate<br/>
                      • Review: 5-10 business days<br/>
                      • Decision: 15-20 business days<br/>
                      • Notification: Within 24 hours
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
          message="Need Help with Appeals?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you need assistance with the appeals process, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Appeal Guide</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">FAQ</Button>
                <Button type="link" size="small">Legal Assistance</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Appeal Detail Modal */}
      <Modal
        title="Appeal Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedAppeal && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Appeal ID" span={2}>
                {selectedAppeal.id}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{getAppealTypeLabel(selectedAppeal.appealType)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedAppeal.status === 'approved' ? 'success' : 'error'} 
                  text={getAppealStatusLabel(selectedAppeal.status)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Date">
                {new Date(selectedAppeal.submittedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedAppeal.updatedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedAppeal.description}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>Appeal Progress</Title>
              <Steps
                current={getAppealSteps(selectedAppeal.status)}
                size="small"
                items={[
                  { title: 'Submitted', description: 'Appeal submitted for review' },
                  { title: 'Under Review', description: 'LGU staff reviewing appeal' },
                  { title: 'Decision', description: 'Final decision made' }
                ]}
              />
            </div>

            {selectedAppeal.resolution && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Resolution</Title>
                <Alert
                  message={selectedAppeal.status === 'approved' ? 'Appeal Approved' : 'Appeal Rejected'}
                  description={selectedAppeal.resolution}
                  type={selectedAppeal.status === 'approved' ? 'success' : 'error'}
                  showIcon
                />
              </div>
            )}

            {selectedAppeal.evidence && selectedAppeal.evidence.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Evidence</Title>
                <List
                  dataSource={selectedAppeal.evidence}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<PaperClipOutlined />} />}
                        title={item.name || 'Evidence Document'}
                        description={item.url || 'Document uploaded'}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New Appeal Modal */}
      <Modal
        title="Submit New Appeal"
        open={newAppealModalVisible}
        onCancel={() => setNewAppealModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setNewAppealModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            htmlType="submit"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Submit Appeal
          </Button>
        ]}
        width={600}
      >
        <Form form={form} onFinish={handleSubmitAppeal} layout="vertical">
          <Form.Item 
            name="appealType"
            label="Appeal Type"
            rules={[{ required: true, message: 'Please select appeal type' }]}
          >
            <Select placeholder="Select appeal type">
              {Object.entries(APPEAL_TYPES).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please provide description' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Describe why you are appealing this decision..."
            />
          </Form.Item>
          
          <Form.Item 
            name="violationId"
            label="Related Violation ID (Optional)"
          >
            <Input placeholder="Enter violation ID if applicable" />
          </Form.Item>
          
          <Form.Item 
            name="inspectionId"
            label="Related Inspection ID (Optional)"
          >
            <Input placeholder="Enter inspection ID if applicable" />
          </Form.Item>
          
          <Form.Item label="Supporting Evidence">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag files to upload</p>
              <p className="ant-upload-hint">Support for multiple file uploads</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Appeal Guidelines Component
const AppealGuidelines = () => {
  return (
    <div>
      <Title level={4}>Appeal Guidelines</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="When to Appeal" size="small">
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>Incorrect Fee Assessment</Text>
                <div>
                  <Text type="secondary">
                    You believe fees were calculated incorrectly or applied in error
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>Wrong Violation Citation</Text>
                <div>
                  <Text type="secondary">
                    Violation was issued incorrectly or doesn't apply to your situation
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>Assessment Errors</Text>
                <div>
                  <Text type="secondary">
                    Official assessment contains factual or procedural errors
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>Other Valid Reasons</Text>
                <div>
                  <Text type="secondary">
                    Other legitimate grounds for appeal as permitted by law
                  </Text>
                </div>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Appeal Process" size="small">
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: 'Submit Appeal',
                  description: 'Complete appeal form with supporting evidence'
                },
                {
                  title: 'Initial Review',
                  description: 'LGU staff reviews appeal for completeness'
                },
                {
                  title: 'Investigation',
                  description: 'Detailed review of case and evidence'
                },
                {
                  title: 'Decision',
                  description: 'Final decision made and communicated'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Success Tips" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Title level={5}>Documentation</Title>
            <ul>
              <li>Gather all relevant documents</li>
              <li>Include clear photographs</li>
              <li>Provide official receipts</li>
              <li>Submit certified copies</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Timeline</Title>
            <ul>
              <li>Submit within 30 days</li>
              <li>Be specific and concise</li>
              <li>Follow up regularly</li>
              <li>Keep records of communication</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Best Practices</Title>
            <ul>
              <li>Be professional and respectful</li>
              <li>Stick to relevant facts</li>
              <li>Cite specific regulations</li>
              <li>Consider legal advice if needed</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AppealsSystem;
