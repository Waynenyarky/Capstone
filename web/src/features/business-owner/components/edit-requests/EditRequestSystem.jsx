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
  InputNumber
} from 'antd';
import {
  EditOutlined,
  FileTextOutlined,
  UploadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  UserOutlined,
  CalendarOutlined,
  FilterOutlined,
  SearchOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  getEditRequests,
  submitEditRequest,
  updateEditRequest,
  EDITABLE_FIELDS,
  FIELD_LABELS,
  EDIT_REQUEST_STATUSES,
  getFieldLabel,
  getStatusLabel
} from '@/features/business-owner/services/editRequestsService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

const EditRequestSystem = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editRequests, setEditRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newRequestModalVisible, setNewRequestModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [businessData, setBusinessData] = useState({
    businessName: 'ABC Restaurant',
    address: '123 Main St, Manila',
    phoneNumber: '+63-2-1234-5678',
    email: 'contact@abcrestaurant.com',
    tradeName: 'ABC',
    businessActivities: 'Restaurant Services',
    capital: 500000,
    contact: 'John Doe'
  });
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchEditRequestsData();
  }, [businessId]);

  const fetchEditRequestsData = async () => {
    setLoading(true);
    try {
      const requestsData = await getEditRequests();
      setEditRequests(requestsData?.editRequests || []);
    } catch (error) {
      console.error('Failed to fetch edit requests data:', error);
      message.error('Failed to load edit requests data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEditRequest = async (values) => {
    setSubmitting(true);
    try {
      const requestData = {
        businessId,
        fieldName: values.fieldName,
        currentValue: businessData[values.fieldName] || '',
        requestedValue: values.requestedValue,
        reason: values.reason,
        supportingDocuments: fileList.map(file => file.url || file.name)
      };

      await submitEditRequest(requestData);
      message.success('Edit request submitted successfully');
      setNewRequestModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchEditRequestsData(); // Refresh data
    } catch (error) {
      message.error('Failed to submit edit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#faad14',
      approved: '#52c41a',
      rejected: '#f5222d'
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      approved: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getRequestProgress = (status) => {
    const progress = {
      pending: 50,
      approved: 100,
      rejected: 75
    };
    return progress[status] || 0;
  };

  const getRequestSteps = (status) => {
    const currentStep = {
      pending: 1,
      approved: 2,
      rejected: 2
    };
    return currentStep[status] || 0;
  };

  const filteredRequests = editRequests.filter(request => {
    const matchesFilter = !filterStatus || request.status === filterStatus;
    const matchesSearch = !searchTerm || 
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getFieldLabel(request.fieldName).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const requestColumns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <Text code>{id}</Text>
      )
    },
    {
      title: 'Field to Edit',
      dataIndex: 'fieldName',
      key: 'fieldName',
      render: (fieldName) => (
        <Tag color="blue">{getFieldLabel(fieldName)}</Tag>
      )
    },
    {
      title: 'Current Value',
      dataIndex: 'currentValue',
      key: 'currentValue',
      ellipsis: true,
      render: (value) => (
        <Tooltip title={value}>
          <Text>{value || '—'}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Requested Value',
      dataIndex: 'requestedValue',
      key: 'requestedValue',
      ellipsis: true,
      render: (value) => (
        <Tooltip title={value}>
          <Text strong>{value}</Text>
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
            text={getStatusLabel(status)}
          />
          <div style={{ marginTop: 4 }}>
            <Progress 
              percent={getRequestProgress(status)} 
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
          {record.status === 'pending' && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => message.info('You can withdraw this request')}
            >
              Withdraw
            </Button>
          )}
        </Space>
      )
    }
  ];

  const calculateRequestStats = () => {
    const total = editRequests.length;
    const pending = editRequests.filter(r => r.status === 'pending').length;
    const approved = editRequests.filter(r => r.status === 'approved').length;
    const rejected = editRequests.filter(r => r.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
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

  const renderFieldValue = (fieldName, value) => {
    if (fieldName === 'capital') {
      return `₱${value?.toLocaleString() || '0'}`;
    }
    return value || '—';
  };

  return (
    <div className={`edit-request-system ${className || ''}`}>
      <Card
        title={
          <Space>
            <EditOutlined />
            <span>Edit Request System</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchEditRequestsData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setNewRequestModalVisible(true)}
            >
              New Request
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            {/* Request Statistics */}
            <Title level={4}>Request Overview</Title>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Requests"
                    value={calculateRequestStats().total}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Pending"
                    value={calculateRequestStats().pending}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Approved"
                    value={calculateRequestStats().approved}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Rejected"
                    value={calculateRequestStats().rejected}
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<CloseCircleOutlined />}
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
                  {Object.entries(EDIT_REQUEST_STATUSES).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Search requests..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col span={8}>
                <Text type="secondary">
                  {filteredRequests.length} of {editRequests.length} requests
                </Text>
              </Col>
            </Row>

            {/* Recent Requests */}
            <Title level={4}>Recent Requests</Title>
            {filteredRequests.length > 0 ? (
              <Table
                dataSource={filteredRequests}
                columns={requestColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty 
                description="No edit requests found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </TabPane>

          <TabPane tab="All Requests" key="all">
            <Table
              dataSource={filteredRequests}
              columns={requestColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Business Information" key="business-info">
            <BusinessInformation businessData={businessData} />
          </TabPane>

          <TabPane tab="Request Guidelines" key="guidelines">
            <RequestGuidelines />
          </TabPane>
        </Tabs>

        <Divider />

        {/* Information Section */}
        <Title level={4}>Understanding Edit Requests</Title>
        <Alert
          message="Edit Request Process"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Edit requests allow you to formally request changes to your business information:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Editable Fields">
                    <Text type="secondary">
                      • Business Name & Address<br/>
                      • Contact Information<br/>
                      • Business Activities<br/>
                      • Capital Information<br/>
                      • Trade Names
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Required Information">
                    <Text type="secondary">
                      • Current and new values<br/>
                      • Reason for change<br/>
                      • Supporting documents<br/>
                      • Valid identification
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Review Process">
                    <Text type="secondary">
                      • Initial validation: 1-2 days<br/>
                      • LGU review: 3-5 days<br/>
                      • Final approval: 1-2 days<br/>
                      • Total: 5-9 business days
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
          message="Need Help with Edit Requests?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you need assistance with edit requests, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Request Guide</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">FAQ</Button>
                <Button type="link" size="small">Document Requirements</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Request Detail Modal */}
      <Modal
        title="Edit Request Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Request ID" span={2}>
                {selectedRequest.id}
              </Descriptions.Item>
              <Descriptions.Item label="Field to Edit">
                <Tag color="blue">{getFieldLabel(selectedRequest.fieldName)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedRequest.status === 'approved' ? 'success' : 'error'} 
                  text={getStatusLabel(selectedRequest.status)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Date">
                {new Date(selectedRequest.submittedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedRequest.updatedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Current Value" span={2}>
                {renderFieldValue(selectedRequest.fieldName, selectedRequest.currentValue)}
              </Descriptions.Item>
              <Descriptions.Item label="Requested Value" span={2}>
                <Text strong>{renderFieldValue(selectedRequest.fieldName, selectedRequest.requestedValue)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedRequest.reason}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>Request Progress</Title>
              <Steps
                current={getRequestSteps(selectedRequest.status)}
                size="small"
                items={[
                  { title: 'Submitted', description: 'Request submitted for review' },
                  { title: 'Under Review', description: 'LGU staff reviewing request' },
                  { title: 'Decision', description: 'Final decision made' }
                ]}
              />
            </div>

            {selectedRequest.reviewNotes && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Review Notes</Title>
                <Alert
                  message={selectedRequest.status === 'approved' ? 'Request Approved' : 'Request Rejected'}
                  description={selectedRequest.reviewNotes}
                  type={selectedRequest.status === 'approved' ? 'success' : 'error'}
                  showIcon
                />
              </div>
            )}

            {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Supporting Documents</Title>
                <List
                  dataSource={selectedRequest.supportingDocuments}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<PaperClipOutlined />} />}
                        title={item.name || 'Supporting Document'}
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

      {/* New Request Modal */}
      <Modal
        title="Submit New Edit Request"
        open={newRequestModalVisible}
        onCancel={() => setNewRequestModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setNewRequestModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            htmlType="submit"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Submit Request
          </Button>
        ]}
        width={600}
      >
        <Form form={form} onFinish={handleSubmitEditRequest} layout="vertical">
          <Form.Item 
            name="fieldName"
            label="Field to Edit"
            rules={[{ required: true, message: 'Please select field to edit' }]}
          >
            <Select placeholder="Select field to edit">
              {EDITABLE_FIELDS.map(fieldName => (
                <Option key={fieldName} value={fieldName}>
                  {getFieldLabel(fieldName)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="requestedValue"
            label="New Value"
            rules={[{ required: true, message: 'Please provide new value' }]}
          >
            <Input placeholder="Enter the new value" />
          </Form.Item>
          
          <Form.Item 
            name="reason"
            label="Reason for Change"
            rules={[{ required: true, message: 'Please provide reason for change' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Explain why this change is needed..."
            />
          </Form.Item>
          
          <Form.Item label="Supporting Documents">
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

// Business Information Component
const BusinessInformation = ({ businessData }) => {
  return (
    <div>
      <Title level={4}>Current Business Information</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Basic Information" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Business Name">
                {businessData.businessName}
              </Descriptions.Item>
              <Descriptions.Item label="Trade Name">
                {businessData.tradeName}
              </Descriptions.Item>
              <Descriptions.Item label="Registered Business Name">
                {businessData.registeredBusinessName}
              </Descriptions.Item>
              <Descriptions.Item label="Business Activities">
                {businessData.businessActivities}
              </Descriptions.Item>
              <Descriptions.Item label="Capital">
                ₱{businessData.capital.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Contact Information" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Address">
                {businessData.address}
              </Descriptions.Item>
              <Descriptions.Item label="Phone Number">
                {businessData.phoneNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {businessData.email}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Person">
                {businessData.contact}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Alert
        message="Information Accuracy"
        description="Please review your current business information. If you need to make changes, submit an edit request through the 'New Request' button above."
        type="info"
        showIcon
      />
    </div>
  );
};

// Request Guidelines Component
const RequestGuidelines = () => {
  return (
    <div>
      <Title level={4}>Edit Request Guidelines</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="When to Submit Edit Requests" size="small">
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>Business Information Changes</Text>
                <div>
                  <Text type="secondary">
                    When your business details need updating in official records
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>Contact Information Updates</Text>
                <div>
                  <Text type="secondary">
                    When phone numbers, emails, or addresses change
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>Business Structure Changes</Text>
                <div>
                  <Text type="secondary">
                    When trade names or business activities change
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>Capital Adjustments</Text>
                <div>
                  <Text type="secondary">
                    When business capital increases or decreases
                  </Text>
                </div>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Request Process" size="small">
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: 'Submit Request',
                  description: 'Complete form with current and new values'
                },
                {
                  title: 'Initial Review',
                  description: 'LGU staff validates request completeness'
                },
                {
                  title: 'Detailed Review',
                  description: 'Comprehensive review of change request'
                },
                {
                  title: 'Final Decision',
                  description: 'Approval or rejection with explanation'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Document Requirements" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Title level={5}>For Name Changes</Title>
            <ul>
              <li>DTI/SEC Registration</li>
              <li>Business Permit</li>
              <li>Valid ID</li>
              <li>Affidavit of Change</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>For Address Changes</Title>
            <ul>
              <li>Proof of New Address</li>
              <li>Utility Bills</li>
              <li>Lease Agreement</li>
              <li>Barangay Clearance</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>For Activity Changes</Title>
            <ul>
              <li>Updated Business Plan</li>
              <li>Permits for New Activities</li>
              <li>Zoning Clearance</li>
              <li>Sanitary Permit</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default EditRequestSystem;
