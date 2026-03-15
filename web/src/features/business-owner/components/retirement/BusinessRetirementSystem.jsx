import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Button,
  Alert,
  Space,
  Typography,
  Divider,
  Form,
  Input,
  Upload,
  Modal,
  Progress,
  Timeline,
  Tag,
  Descriptions,
  Row,
  Col,
  Empty,
  message,
  Tooltip
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ToolOutlined,
  BankOutlined,
  FileSearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  submitRetirement,
  RETIREMENT_STATUSES,
  getStatusLabel,
  getStatusColor
} from '@/features/business-owner/services/retirementService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

const BusinessRetirementSystem = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [retirementData, setRetirementData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchRetirementData();
  }, [businessId]);

  const fetchRetirementData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch existing retirement data
      // For now, we'll simulate the data structure
      setRetirementData({
        status: null, // No retirement initiated yet
        applicationDate: null,
        verificationDate: null,
        confirmationDate: null,
        requirements: {
          taxClearance: false,
          permitClearance: false,
          employeeClearance: false,
          utilityClearance: false
        }
      });
    } catch (error) {
      console.error('Failed to fetch retirement data:', error);
      message.error('Failed to load retirement data');
    } finally {
      setLoading(false);
    }
  };

  const getRetirementSteps = () => [
    {
      title: 'Eligibility Check',
      description: 'Verify retirement requirements',
      icon: <FileSearchOutlined />
    },
    {
      title: 'Document Preparation',
      description: 'Prepare required documents',
      icon: <FileTextOutlined />
    },
    {
      title: 'Submit Application',
      description: 'File retirement application',
      icon: <UploadOutlined />
    },
    {
      title: 'Inspector Verification',
      description: 'Business inspection verification',
      icon: <UserOutlined />
    },
    {
      title: 'Final Approval',
      description: 'LGU officer confirmation',
      icon: <CheckCircleOutlined />
    }
  ];

  const getStepStatus = (stepIndex) => {
    if (!retirementData) return 'wait';
    
    if (retirementData.status === 'confirmed') {
      return stepIndex < 5 ? 'finish' : 'finish';
    }
    
    if (retirementData.status === 'inspector_verified') {
      return stepIndex < 4 ? 'finish' : stepIndex === 4 ? 'process' : 'wait';
    }
    
    if (retirementData.status === 'requested') {
      return stepIndex < 3 ? 'finish' : stepIndex === 3 ? 'process' : 'wait';
    }
    
    return stepIndex === currentStep ? 'process' : 'wait';
  };

  const calculateProgress = () => {
    if (!retirementData) return 0;
    
    const statusProgress = {
      null: 0,
      requested: 60,
      inspector_verified: 80,
      confirmed: 100,
      rejected: 0
    };
    
    return statusProgress[retirementData.status] || 0;
  };

  const handleRetirementSubmit = async (values) => {
    try {
      setLoading(true);
      await submitRetirement(businessId, values);
      setSubmittedData(values);
      setConfirmModalVisible(true);
      message.success('Retirement application submitted successfully');
      fetchRetirementData(); // Refresh data
    } catch (error) {
      message.error('Failed to submit retirement application');
    } finally {
      setLoading(false);
    }
  };

  const getEligibilityStatus = () => {
    // Simulate eligibility check
    return {
      eligible: true,
      reasons: [
        'Business has been operational for more than 1 year',
        'All tax obligations are up to date',
        'No pending violations or penalties',
        'All employee benefits have been settled'
      ],
      blockers: []
    };
  };

  const getRequiredDocuments = () => [
    {
      title: 'Retirement Application Letter',
      description: 'Formal letter requesting business retirement',
      required: true
    },
    {
      title: 'Sworn Statement of Gross Sales',
      description: 'Notarized statement of business gross sales',
      required: true
    },
    {
      title: 'Tax Clearance Certificate',
      description: 'Proof that all taxes are paid',
      required: true
    },
    {
      title: 'Business Permit Clearance',
      description: 'Clearance from business permit office',
      required: true
    },
    {
      title: 'Employee Clearance',
      description: 'Proof that all employee obligations are settled',
      required: false
    },
    {
      title: 'Utility Clearance',
      description: 'Clearance from utility companies',
      required: false
    }
  ];

  const getRetirementTimeline = () => {
    if (!retirementData || !retirementData.applicationDate) {
      return [];
    }

    const timeline = [];
    
    if (retirementData.applicationDate) {
      timeline.push({
        time: new Date(retirementData.applicationDate).toLocaleDateString(),
        title: 'Application Submitted',
        description: 'Retirement application was submitted',
        status: 'completed'
      });
    }
    
    if (retirementData.verificationDate) {
      timeline.push({
        time: new Date(retirementData.verificationDate).toLocaleDateString(),
        title: 'Inspector Verification',
        description: 'Business inspection completed',
        status: 'completed'
      });
    }
    
    if (retirementData.confirmationDate) {
      timeline.push({
        time: new Date(retirementData.confirmation).toLocaleDateString(),
        title: 'Retirement Confirmed',
        description: 'Business retirement officially confirmed',
        status: 'completed'
      });
    }
    
    return timeline;
  };

  const eligibility = getEligibilityStatus();
  const documents = getRequiredDocuments();
  const timeline = getRetirementTimeline();

  return (
    <div className={`business-retirement-system ${className || ''}`}>
      <Card
        title={
          <Space>
            <ToolOutlined />
            <span>Business Retirement System</span>
          </Space>
        }
        extra={
          <Tooltip title="Guide for business closure process">
            <Button icon={<InfoCircleOutlined />} size="small">
              Help
            </Button>
          </Tooltip>
        }
        loading={loading}
      >
        {/* Retirement Status Overview */}
        {retirementData?.status ? (
          <div style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Tag color={getStatusColor(retirementData.status)} style={{ fontSize: 16, padding: '4px 12px' }}>
                      {getStatusLabel(retirementData.status)}
                    </Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Current Status</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Progress 
                      type="circle" 
                      percent={calculateProgress()} 
                      size={60}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#52c41a',
                      }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Progress</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {retirementData.applicationDate ? 
                        new Date(retirementData.applicationDate).toLocaleDateString() : 
                        'Not Started'
                      }
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Application Date</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <Alert
            message="No Retirement Application"
            description="You haven't initiated a retirement application yet. Follow the steps below to start the process."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Retirement Process Steps */}
        <Title level={4}>Retirement Process</Title>
        <Steps
          current={retirementData?.status ? 
            (retirementData.status === 'confirmed' ? 4 : 
             retirementData.status === 'inspector_verified' ? 3 : 
             retirementData.status === 'requested' ? 2 : 0) : 
            currentStep
          }
          style={{ marginBottom: 32 }}
        >
          {getRetirementSteps().map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={getStepStatus(index)}
            />
          ))}
        </Steps>

        {/* Current Step Content */}
        <Divider />
        
        {!retirementData?.status && (
          <div>
            <Title level={4}>Step 1: Eligibility Check</Title>
            
            <Alert
              message={eligibility.eligible ? "Eligible for Retirement" : "Not Eligible"}
              description={
                <div>
                  {eligibility.eligible ? (
                    <div>
                      <Paragraph>Your business meets the requirements for retirement:</Paragraph>
                      <ul>
                        {eligibility.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <Paragraph>Your business has the following issues that need to be resolved:</Paragraph>
                      <ul>
                        {eligibility.blockers.map((blocker, index) => (
                          <li key={index}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              }
              type={eligibility.eligible ? "success" : "error"}
              showIcon
              style={{ marginBottom: 24 }}
            />

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setCurrentStep(1)}
                disabled={!eligibility.eligible}
              >
                Continue to Document Preparation
              </Button>
            </div>
          </div>
        )}

        {!retirementData?.status && currentStep === 1 && (
          <div>
            <Title level={4}>Step 2: Document Preparation</Title>
            
            <Alert
              message="Required Documents"
              description="Please prepare the following documents for your retirement application:"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <div style={{ marginBottom: 24 }}>
              {documents.map((doc, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{doc.title}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{doc.description}</Text>
                      </div>
                    </div>
                    <Tag color={doc.required ? 'red' : 'blue'}>
                      {doc.required ? 'Required' : 'Optional'}
                    </Tag>
                  </div>
                </Card>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => setCurrentStep(2)}
                >
                  Continue to Application
                </Button>
              </Space>
            </div>
          </div>
        )}

        {!retirementData?.status && currentStep === 2 && (
          <div>
            <Title level={4}>Step 3: Submit Application</Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleRetirementSubmit}
              style={{ maxWidth: 600 }}
            >
              <Form.Item
                name="applicationLetter"
                label="Application Letter"
                rules={[{ required: true, message: 'Please provide application letter' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Enter your retirement application letter..."
                />
              </Form.Item>
              
              <Form.Item
                name="swornStatementGrossSales"
                label="Sworn Statement of Gross Sales"
                rules={[{ required: true, message: 'Please provide gross sales amount' }]}
              >
                <Input 
                  type="number" 
                  placeholder="Enter gross sales amount"
                  addonBefore="₱"
                />
              </Form.Item>
              
              <Form.Item
                name="supportingDocuments"
                label="Supporting Documents"
              >
                <Upload.Dragger
                  name="files"
                  multiple
                  beforeUpload={() => false}
                  showUploadList={false}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag files here to upload supporting documents
                  </p>
                  <p className="ant-upload-hint">
                    Upload tax clearance, permit clearance, and other required documents
                  </p>
                </Upload.Dragger>
              </Form.Item>
              
              <Form.Item
                name="reason"
                label="Reason for Retirement"
                rules={[{ required: true, message: 'Please provide reason for retirement' }]}
              >
                <TextArea 
                  rows={3} 
                  placeholder="Explain why you are retiring the business..."
                />
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    size="large"
                  >
                    Submit Application
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* Retirement Timeline */}
        {timeline.length > 0 && (
          <div>
            <Divider />
            <Title level={4}>Application Timeline</Title>
            <Timeline>
              {timeline.map((item, index) => (
                <Timeline.Item
                  key={index}
                  dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  color="green"
                >
                  <div>
                    <Text strong>{item.title}</Text>
                    <div>
                      <Text type="secondary">{item.time}</Text>
                    </div>
                    <div>
                      <Text type="secondary">{item.description}</Text>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}

        {/* Important Information */}
        <Divider />
        <Title level={4}>Important Information</Title>
        <Alert
          message="Business Retirement Process"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Before proceeding with business retirement, please consider the following:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Financial">
                    <Text type="secondary">
                      • Settle all outstanding debts<br/>
                      • Clear tax obligations<br/>
                      • Close bank accounts<br/>
                      • Finalize employee payments
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Legal">
                    <Text type="secondary">
                      • Secure all permits<br/>
                      • Update business records<br/>
                      • Notify authorities<br/>
                      • File final reports
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Operational">
                    <Text type="secondary">
                      • Inform customers<br/>
                      • Return rented equipment<br/>
                      • Cancel subscriptions<br/>
                      • Secure premises
                    </Text>
                  </Card>
                </Col>
              </Row>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Help Section */}
        <Alert
          message="Need Help with Retirement?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                Our team can guide you through the business retirement process and ensure all requirements are met.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Retirement Guide</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">Schedule Consultation</Button>
                <Button type="link" size="small">FAQ</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title="Application Submitted Successfully"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setConfirmModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {submittedData && (
          <div>
            <Alert
              message="Retirement Application Submitted"
              description="Your retirement application has been successfully submitted and is now under review."
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Application Date">
                {new Date().toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="yellow">Under Review</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Next Steps">
                An inspector will be assigned to verify your business closure within 5-7 business days.
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BusinessRetirementSystem;
