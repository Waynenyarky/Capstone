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
  Transfer
} from 'antd';
import {
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
  BranchesOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  HomeOutlined,
  CarOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  FireOutlined,
  HealthCheckOutlined,
  BuildingOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  getGeneralPermits,
  createGeneralPermit,
  updateGeneralPermit,
  getOccupationalPermits,
  createOccupationalPermit,
  updateOccupationalPermit,
  PERMIT_STATUSES,
  getPermitStatusLabel
} from '@/features/business-owner/services/permitsService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Panel } = Collapse;

const RegulatoryPermitsSystem = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalPermits, setGeneralPermits] = useState([]);
  const [occupationalPermits, setOccupationalPermits] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newPermitModalVisible, setNewPermitModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [permitType, setPermitType] = useState('general');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchPermitsData();
  }, [businessId]);

  const fetchPermitsData = async () => {
    setLoading(true);
    try {
      const [generalData, occupationalData] = await Promise.all([
        getGeneralPermits({ status: filterStatus }),
        getOccupationalPermits()
      ]);
      setGeneralPermits(generalData?.permits || []);
      setOccupationalPermits(occupationalData?.permits || []);
    } catch (error) {
      console.error('Failed to fetch permits data:', error);
      message.error('Failed to load permits data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGeneralPermit = async (values) => {
    setSubmitting(true);
    try {
      const permitData = {
        permitCategory: values.permitCategory,
        requirements: values.requirements || [],
        businessPlateNo: values.businessPlateNo
      };

      await createGeneralPermit(permitData);
      message.success('General permit application submitted successfully');
      setNewPermitModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchPermitsData(); // Refresh data
    } catch (error) {
      message.error('Failed to submit permit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOccupationalPermit = async (values) => {
    setSubmitting(true);
    try {
      const permitData = {
        firstName: values.firstName,
        lastName: values.lastName,
        businessPlateNo: values.businessPlateNo,
        gender: values.gender,
        civilStatus: values.civilStatus,
        dateOfBirth: values.dateOfBirth,
        address: values.address,
        education: values.education,
        employer: values.employer,
        company: values.company,
        position: values.position,
        type: values.type
      };

      await createOccupationalPermit(permitData);
      message.success('Occupational permit application submitted successfully');
      setNewPermitModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchPermitsData(); // Refresh data
    } catch (error) {
      message.error('Failed to submit permit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (permit) => {
    setSelectedPermit(permit);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: '#1890ff',
      pending: '#faad14',
      approved: '#52c41a',
      rejected: '#f5222d'
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusIcon = (status) => {
    const icons = {
      submitted: <ClockCircleOutlined />,
      pending: <ExclamationCircleOutlined />,
      approved: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getPermitProgress = (status) => {
    const progress = {
      submitted: 25,
      pending: 50,
      approved: 100,
      rejected: 75
    };
    return progress[status] || 0;
  };

  const getPermitSteps = (status) => {
    const currentStep = {
      submitted: 0,
      pending: 1,
      approved: 2,
      rejected: 2
    };
    return currentStep[status] || 0;
  };

  const generalPermitColumns = [
    {
      title: 'Permit ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <Text code>{id}</Text>
      )
    },
    {
      title: 'Category',
      dataIndex: 'permitCategory',
      key: 'permitCategory',
      render: (category) => (
        <Tag color="blue">{category}</Tag>
      )
    },
    {
      title: 'Business Plate',
      dataIndex: 'businessPlateNo',
      key: 'businessPlateNo',
      render: (plate) => (
        <Text strong>{plate || '—'}</Text>
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
            text={getPermitStatusLabel(status)}
          />
          <div style={{ marginTop: 4 }}>
            <Progress 
              percent={getPermitProgress(status)} 
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
              onClick={() => message.info('You can withdraw this application')}
            >
              Withdraw
            </Button>
          )}
        </Space>
      )
    }
  ];

  const occupationalPermitColumns = [
    {
      title: 'Permit ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (
        <Text code>{id}</Text>
      )
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Text strong>{record.firstName} {record.lastName}</Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="green">{type}</Tag>
      )
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (position) => (
        <Text>{position || '—'}</Text>
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
            text={getPermitStatusLabel(status)}
          />
          <div style={{ marginTop: 4 }}>
            <Progress 
              percent={getPermitProgress(status)} 
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
              onClick={() => message.info('You can withdraw this application')}
            >
              Withdraw
            </Button>
          )}
        </Space>
      )
    }
  ];

  const calculatePermitStats = () => {
    const allPermits = [...generalPermits, ...occupationalPermits];
    const total = allPermits.length;
    const submitted = allPermits.filter(p => p.status === 'submitted').length;
    const pending = allPermits.filter(p => p.status === 'pending').length;
    const approved = allPermits.filter(p => p.status === 'approved').length;
    const rejected = allPermits.filter(p => p.status === 'rejected').length;
    
    return { total, submitted, pending, approved, rejected };
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

  const permitCategories = [
    { value: 'business', label: 'Business Permit', icon: <ShopOutlined /> },
    { value: 'building', label: 'Building Permit', icon: <BuildingOutlined /> },
    { value: 'health', label: 'Health Permit', icon: <HealthCheckOutlined /> },
    { value: 'fire', label: 'Fire Safety Permit', icon: <FireOutlined /> },
    { value: 'environmental', label: 'Environmental Permit', icon: <EnvironmentOutlined /> },
    { value: 'zoning', label: 'Zoning Permit', icon: <HomeOutlined /> },
    { value: 'occupational', label: 'Occupational Permit', icon: <SafetyCertificateOutlined /> }
  ];

  const permitRequirements = {
    business: [
      'Business Registration Certificate',
      'DTI/SEC Registration',
      'Barangay Clearance',
      'Sanitary Permit',
      'Fire Safety Certificate',
      'Zoning Clearance'
    ],
    building: [
      'Building Plans',
      'Architectural Drawings',
      'Structural Analysis',
      'Electrical Plans',
      'Plumbing Plans',
      'Fire Protection Plans'
    ],
    health: [
      'Health Certificate',
      'Sanitary Permit',
      'Food Handler\'s Permit',
      'Water Analysis Report',
      'Waste Management Plan'
    ],
    fire: [
      'Fire Safety Assessment',
      'Fire Extinguisher Certificates',
      'Emergency Exit Plans',
      'Fire Drill Records'
    ],
    environmental: [
      'Environmental Impact Assessment',
      'Waste Management Plan',
      'Pollution Control Certificate',
      'Environmental Compliance Certificate'
    ],
    zoning: [
      'Zoning Map',
      'Land Use Certificate',
      'Location Plan',
      'Site Development Plan'
    ]
  };

  return (
    <div className={`regulatory-permits-system ${className || ''}`}>
      <Card
        title={
          <Space>
            <BranchesOutlined />
            <span>Regulatory Permits System</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchPermitsData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setNewPermitModalVisible(true)}
            >
              New Application
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            {/* Permit Statistics */}
            <Title level={4}>Permit Overview</Title>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Applications"
                    value={calculatePermitStats().total}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Pending Review"
                    value={calculatePermitStats().pending}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Approved"
                    value={calculatePermitStats().approved}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Rejected"
                    value={calculatePermitStats().rejected}
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
                  {Object.entries(PERMIT_STATUSES).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Input
                  placeholder="Search permits..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col span={8}>
                <Text type="secondary">
                  {generalPermits.length + occupationalPermits.length} total permits
                </Text>
              </Col>
            </Row>

            {/* Recent Applications */}
            <Title level={4}>Recent Applications</Title>
            <Collapse defaultActiveKey={['general']}>
              <Panel header="General Permits" key="general">
                {generalPermits.length > 0 ? (
                  <Table
                    dataSource={generalPermits}
                    columns={generalPermitColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                ) : (
                  <Empty 
                    description="No general permits found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Panel>
              <Panel header="Occupational Permits" key="occupational">
                {occupationalPermits.length > 0 ? (
                  <Table
                    dataSource={occupationalPermits}
                    columns={occupationalPermitColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                ) : (
                  <Empty 
                    description="No occupational permits found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Panel>
            </Collapse>
          </TabPane>

          <TabPane tab="General Permits" key="general">
            <Table
              dataSource={generalPermits}
              columns={generalPermitColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Occupational Permits" key="occupational">
            <Table
              dataSource={occupationalPermits}
              columns={occupationalPermitColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>

          <TabPane tab="Permit Categories" key="categories">
            <PermitCategoriesGuide categories={permitCategories} requirements={permitRequirements} />
          </TabPane>

          <TabPane tab="Application Guide" key="guide">
            <ApplicationGuide />
          </TabPane>
        </Tabs>

        <Divider />

        {/* Information Section */}
        <Title level={4}>Understanding Regulatory Permits</Title>
        <Alert
          message="Permit Application Process"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Regulatory permits ensure compliance with local government requirements:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Permit Types">
                    <Text type="secondary">
                      • Business Operating Permits<br/>
                      • Building Construction Permits<br/>
                      • Health and Safety Permits<br/>
                      • Environmental Compliance<br/>
                      • Fire Safety Certificates
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Application Requirements">
                    <Text type="secondary">
                      • Valid Business Registration<br/>
                      • Complete Documentation<br/>
                      • Technical Specifications<br/>
                      • Compliance Certificates<br/>
                      • Inspection Reports
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Processing Timeline">
                    <Text type="secondary">
                      • Initial Review: 3-5 days<br/>
                      • Technical Evaluation: 7-10 days<br/>
                      • Site Inspection: 5-7 days<br/>
                      • Final Approval: 3-5 days<br/>
                      • Total: 18-27 business days
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
          message="Need Help with Permit Applications?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you need assistance with permit applications, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Application Guide</Button>
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

      {/* Permit Detail Modal */}
      <Modal
        title="Permit Application Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedPermit && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Application ID" span={2}>
                {selectedPermit.id}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">
                  {selectedPermit.permitCategory ? 'General Permit' : 'Occupational Permit'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedPermit.status === 'approved' ? 'success' : 'error'} 
                  text={getPermitStatusLabel(selectedPermit.status)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Submitted Date">
                {new Date(selectedPermit.submittedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedPermit.updatedAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>Application Progress</Title>
              <Steps
                current={getPermitSteps(selectedPermit.status)}
                size="small"
                items={[
                  { title: 'Submitted', description: 'Application submitted for review' },
                  { title: 'Under Review', description: 'LGU staff reviewing application' },
                  { title: 'Decision', description: 'Final decision made' }
                ]}
              />
            </div>

            {selectedPermit.reviewNotes && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Review Notes</Title>
                <Alert
                  message={selectedPermit.status === 'approved' ? 'Application Approved' : 'Application Rejected'}
                  description={selectedPermit.reviewNotes}
                  type={selectedPermit.status === 'approved' ? 'success' : 'error'}
                  showIcon
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New Application Modal */}
      <Modal
        title="Submit New Permit Application"
        open={newPermitModalVisible}
        onCancel={() => setNewPermitModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setNewPermitModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            htmlType="submit"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Submit Application
          </Button>
        ]}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="permitType"
            label="Permit Type"
            rules={[{ required: true, message: 'Please select permit type' }]}
          >
            <Radio.Group value={permitType} onChange={(e) => setPermitType(e.target.value)}>
              <Radio.Button value="general">General Permit</Radio.Button>
              <Radio.Button value="occupational">Occupational Permit</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {permitType === 'general' ? (
            <GeneralPermitForm 
              form={form} 
              categories={permitCategories} 
              requirements={permitRequirements}
              onSubmit={handleSubmitGeneralPermit}
              uploadProps={uploadProps}
            />
          ) : (
            <OccupationalPermitForm 
              form={form} 
              onSubmit={handleSubmitOccupationalPermit}
              uploadProps={uploadProps}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

// General Permit Form Component
const GeneralPermitForm = ({ form, categories, requirements, onSubmit, uploadProps }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  return (
    <div>
      <Form.Item 
        name="permitCategory"
        label="Permit Category"
        rules={[{ required: true, message: 'Please select permit category' }]}
      >
        <Select 
          placeholder="Select permit category"
          onChange={setSelectedCategory}
        >
          {categories.map(cat => (
            <Option key={cat.value} value={cat.value}>
              <Space>
                {cat.icon}
                {cat.label}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item 
        name="businessPlateNo"
        label="Business Plate Number (Optional)"
      >
        <Input placeholder="Enter business plate number" />
      </Form.Item>
      
      {selectedCategory && requirements[selectedCategory] && (
        <Form.Item label="Required Documents">
          <div style={{ marginBottom: 16 }}>
            <Text strong>Required Documents:</Text>
            <ul style={{ marginTop: 8 }}>
              {requirements[selectedCategory].map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag files to upload</p>
            <p className="ant-upload-hint">Upload required documents</p>
          </Dragger>
        </Form.Item>
      )}
    </div>
  );
};

// Occupational Permit Form Component
const OccupationalPermitForm = ({ form, onSubmit, uploadProps }) => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender">
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="civilStatus" label="Civil Status">
            <Select placeholder="Select civil status">
              <Option value="single">Single</Option>
              <Option value="married">Married</Option>
              <Option value="widowed">Widowed</Option>
              <Option value="separated">Separated</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item name="dateOfBirth" label="Date of Birth">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name="address" label="Address">
        <TextArea rows={2} placeholder="Enter complete address" />
      </Form.Item>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="education" label="Education">
            <Input placeholder="Enter educational background" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="type" label="Employment Type">
            <Select placeholder="Select employment type">
              <Option value="employed">Employed</Option>
              <Option value="self_employed">Self-Employed</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="employer" label="Employer/Company">
            <Input placeholder="Enter employer or company name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="position" label="Position">
            <Input placeholder="Enter position or job title" />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item 
        name="businessPlateNo"
        label="Business Plate Number (Optional)"
      >
        <Input placeholder="Enter business plate number" />
      </Form.Item>
      
      <Form.Item label="Supporting Documents">
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to upload</p>
          <p className="ant-upload-hint">Upload medical certificates, IDs, and other documents</p>
        </Dragger>
      </Form.Item>
    </div>
  );
};

// Permit Categories Guide Component
const PermitCategoriesGuide = ({ categories, requirements }) => {
  return (
    <div>
      <Title level={4}>Permit Categories Guide</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {categories.map(category => (
          <Col span={8} key={category.value} style={{ marginBottom: 16 }}>
            <Card 
              size="small" 
              title={
                <Space>
                  {category.icon}
                  {category.label}
                </Space>
              }
            >
              <div style={{ marginBottom: 12 }}>
                <Text strong>Required Documents:</Text>
                <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                  {requirements[category.value]?.slice(0, 3).map((req, index) => (
                    <li key={index} style={{ fontSize: '12px' }}>{req}</li>
                  ))}
                  {requirements[category.value]?.length > 3 && (
                    <li style={{ fontSize: '12px', fontStyle: 'italic' }}>
                      ...and {requirements[category.value].length - 3} more
                    </li>
                  )}
                </ul>
              </div>
              <Button size="small" type="link">View Details</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// Application Guide Component
const ApplicationGuide = () => {
  return (
    <div>
      <Title level={4}>Permit Application Guide</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Application Process" size="small">
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>Document Preparation</Text>
                <div>
                  <Text type="secondary">
                    Gather all required documents and certificates
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>Submit Application</Text>
                <div>
                  <Text type="secondary">
                    Complete online application form and upload documents
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>Application Review</Text>
                <div>
                  <Text type="secondary">
                    LGU staff review application for completeness
                  </Text>
                </div>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>Inspection & Assessment</Text>
                <div>
                  <Text type="secondary">
                    Site inspection and technical evaluation
                  </Text>
                </div>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Processing Times" size="small">
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: 'Initial Review',
                  description: '3-5 business days'
                },
                {
                  title: 'Technical Evaluation',
                  description: '7-10 business days'
                },
                {
                  title: 'Site Inspection',
                  description: '5-7 business days'
                },
                {
                  title: 'Final Decision',
                  description: '3-5 business days'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Common Requirements" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Title level={5}>Business Documents</Title>
            <ul>
              <li>Business Registration Certificate</li>
              <li>DTI/SEC Registration</li>
              <li>Barangay Clearance</li>
              <li>Tax Clearance Certificate</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Technical Documents</Title>
            <ul>
              <li>Building Plans</li>
              <li>Safety Certificates</li>
              <li>Environmental Compliance</li>
              <li>Fire Safety Assessment</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Personal Documents</Title>
            <ul>
              <li>Valid Government ID</li>
              <li>Medical Certificate</li>
              <li>NBI Clearance</li>
              <li>Barangay Clearance</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RegulatoryPermitsSystem;
