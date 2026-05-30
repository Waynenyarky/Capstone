import { useState, useEffect } from 'react';
import {
  Card,
  Progress,
  Button,
  Badge,
  Alert,
  Space,
  Typography,
  Divider,
  Timeline,
  Upload,
  Modal,
  Form,
  Input,
  message,
  Tooltip,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Item } = Timeline;
const { TextArea } = Input;

const MultiAgencyTracker = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [agencyData, setAgencyData] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [form] = Form.useForm();
  
  const { getBusinessProfile, updateAgencyRegistration } = useBusiness();

  useEffect(() => {
    fetchAgencyData();
  }, [businessId]);

  const fetchAgencyData = async () => {
    setLoading(true);
    try {
      const profileData = await getBusinessProfile(businessId);
      setAgencyData(profileData?.otherAgencyRegistrations || {});
    } catch (error) {
      console.error('Failed to fetch agency data:', error);
      message.error('Failed to load agency registration data');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!agencyData) return 0;
    
    const agencies = ['sss', 'philhealth', 'pagibig'];
    const registeredCount = agencies.filter(agency => agencyData[agency]?.registered).length;
    return Math.round((registeredCount / agencies.length) * 100);
  };

  const getAgencyStatus = (agencyData) => {
    if (!agencyData) return { status: 'pending', color: 'default', icon: <ClockCircleOutlined /> };
    
    if (agencyData.registered) {
      return { 
        status: 'registered', 
        color: 'success', 
        icon: <CheckCircleOutlined /> 
      };
    }
    
    return { 
      status: 'pending', 
      color: 'processing', 
      icon: <ClockCircleOutlined /> 
    };
  };

  const handleUploadDocument = (agency) => {
    setSelectedAgency(agency);
    setUploadModalVisible(true);
  };

  const handleDocumentUpload = async (values) => {
    try {
      // Simulate document upload and registration update
      message.success(`${selectedAgency.toUpperCase()} registration updated successfully`);
      setUploadModalVisible(false);
      form.resetFields();
      fetchAgencyData(); // Refresh data
    } catch (error) {
      message.error('Failed to upload document');
    }
  };

  const getAgencyIcon = (agency) => {
    const icons = {
      sss: <UserOutlined />,
      philhealth: <SafetyCertificateOutlined />,
      pagibig: <BankOutlined />
    };
    return icons[agency] || <FileTextOutlined />;
  };

  const getAgencyName = (agency) => {
    const names = {
      sss: 'Social Security System (SSS)',
      philhealth: 'PhilHealth',
      pagibig: 'Pag-IBIG'
    };
    return names[agency] || agency.toUpperCase();
  };

  const getAgencyDescription = (agency) => {
    const descriptions = {
      sss: 'Social Security System registration for employee benefits and coverage',
      philhealth: 'PhilHealth registration for health insurance coverage',
      pagibig: 'Pag-IBIG registration for housing and savings programs'
    };
    return descriptions[agency] || 'Agency registration requirement';
  };

  const agencies = ['sss', 'philhealth', 'pagibig'];

  return (
    <div className={`multi-agency-tracker ${className || ''}`}>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>Multi-Agency Registration Tracker</span>
          </Space>
        }
        extra={
          <Tooltip title="Track your SSS, PhilHealth, and Pag-IBIG registrations">
            <Button icon={<InfoCircleOutlined />} size="small">
              Help
            </Button>
          </Tooltip>
        }
        loading={loading}
      >
        {/* Overall Progress */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Overall Progress"
                value={calculateOverallProgress()}
                suffix="%"
                valueStyle={{ color: calculateOverallProgress() === 100 ? '#52c41a' : '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Registered Agencies"
                value={agencies.filter(agency => agencyData?.[agency]?.registered).length}
                suffix={`/ ${agencies.length}`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Has Employees"
                value={agencyData?.hasEmployees ? 'Yes' : 'No'}
                valueStyle={{ color: agencyData?.hasEmployees ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Progress Bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>Registration Progress</Text>
            <Text>{calculateOverallProgress()}%</Text>
          </div>
          <Progress 
            percent={calculateOverallProgress()} 
            status={calculateOverallProgress() === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#52c41a',
            }}
          />
        </div>

        {/* Agency Registration Timeline */}
        <Title level={4}>Agency Registration Status</Title>
        <Timeline>
          {agencies.map((agency) => {
            const agencyInfo = agencyData?.[agency] || {};
            const statusInfo = getAgencyStatus(agencyInfo);
            
            return (
              <Item
                key={agency}
                dot={statusInfo.icon}
                color={statusInfo.color}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      {getAgencyIcon(agency)}
                      <Text strong>{getAgencyName(agency)}</Text>
                      <Badge 
                        color={statusInfo.color} 
                        text={statusInfo.status === 'registered' ? 'Registered' : 'Pending'} 
                      />
                    </Space>
                    <Button 
                      size="small"
                      icon={<UploadOutlined />}
                      onClick={() => handleUploadDocument(agency)}
                      disabled={agencyInfo.registered}
                    >
                      {agencyInfo.registered ? 'View' : 'Register'}
                    </Button>
                  </div>
                  
                  <Paragraph type="secondary" style={{ margin: '4px 0' }}>
                    {getAgencyDescription(agency)}
                  </Paragraph>
                  
                  {agencyInfo.registered && agencyInfo.proofUrl && (
                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text type="secondary">Proof document submitted</Text>
                        <Button type="link" size="small">View Document</Button>
                      </Space>
                    </div>
                  )}
                  
                  {!agencyInfo.registered && (
                    <Alert
                      message="Registration Required"
                      description={`You need to register with ${getAgencyName(agency)} to complete your business compliance.`}
                      type="warning"
                      showIcon
                      size="small"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              </Item>
            );
          })}
        </Timeline>

        <Divider />

        {/* Compliance Information */}
        <Title level={4}>Compliance Information</Title>
        <Alert
          message="Multi-Agency Compliance"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                If your business has employees, you are required to register with SSS, PhilHealth, and Pag-IBIG. 
                This ensures your employees receive proper social security, health, and housing benefits.
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="SSS">
                    <Text type="secondary">
                      • Employee social security<br/>
                      • Retirement benefits<br/>
                      • Disability coverage
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="PhilHealth">
                    <Text type="secondary">
                      • Health insurance<br/>
                      • Medical benefits<br/>
                      • Hospital coverage
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Pag-IBIG">
                    <Text type="secondary">
                      • Housing loans<br/>
                      • Savings programs<br/>
                      • Retirement savings
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
          message="Need Help with Registration?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                Our team can help you with multi-agency registration requirements and procedures.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Registration Guide</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">FAQ</Button>
                <Button type="link" size="small">Schedule Appointment</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title={`Register ${selectedAgency ? getAgencyName(selectedAgency) : ''}`}
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setSelectedAgency(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedAgency && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleDocumentUpload}
          >
            <Alert
              message={getAgencyName(selectedAgency)}
              description={getAgencyDescription(selectedAgency)}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name="registrationNumber"
              label="Registration Number"
              rules={[{ required: true, message: 'Please enter registration number' }]}
            >
              <Input placeholder="Enter your registration number" />
            </Form.Item>
            
            <Form.Item
              name="registrationDate"
              label="Registration Date"
              rules={[{ required: true, message: 'Please select registration date' }]}
            >
              <Input type="date" />
            </Form.Item>
            
            <Form.Item
              name="proofDocument"
              label="Proof Document"
              rules={[{ required: true, message: 'Please upload proof document' }]}
            >
              <Upload.Dragger
                name="file"
                multiple={false}
                beforeUpload={() => false}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">
                  Click or drag file here to upload proof document
                </p>
                <p className="ant-upload-hint">
                  Support for PDF, JPG, PNG files. Maximum file size: 5MB.
                </p>
              </Upload.Dragger>
            </Form.Item>
            
            <Form.Item
              name="notes"
              label="Additional Notes"
            >
              <TextArea rows={3} placeholder="Any additional information or notes" />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit Registration
                </Button>
                <Button onClick={() => setUploadModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default MultiAgencyTracker;
