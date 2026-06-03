import { useState, useEffect } from 'react';
import {
  Card,
  Progress,
  Button,
  Timeline,
  Badge,
  Alert,
  Space,
  Typography,
  Divider,
  List,
  Tooltip,
  Modal,
  Upload,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Item } = Timeline;

const RequirementsChecklist = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState(null);
  const [postRequirements, setPostRequirements] = useState([]);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  const { getBusinessProfile, getPostRequirements, submitCompliance } = useBusiness();

  useEffect(() => {
    fetchRequirementsData();
  }, [businessId]);

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      // Get business profile with requirements checklist
      const profileData = await getBusinessProfile(businessId);
      setRequirements(profileData?.requirementsChecklist || {});
      
      // Get post-requirements
      const postReqData = await getPostRequirements({ businessId });
      setPostRequirements(postReqData?.requirements || []);
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
      message.error('Failed to load requirements data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!requirements) return 0;
    
    const steps = [
      requirements.confirmed,
      requirements.pdfDownloaded,
      // Add other requirement steps as needed
    ].filter(Boolean);
    
    return Math.round((steps.length / 2) * 100); // Assuming 2 main steps
  };

  const handlePDFDownload = async () => {
    try {
      // Simulate PDF download
      message.success('Requirements PDF downloaded successfully');
      // In real implementation, this would trigger actual PDF download
      fetchRequirementsData(); // Refresh data
    } catch (error) {
      message.error('Failed to download PDF');
    }
  };

  const handleConfirmRequirements = async () => {
    try {
      // Simulate requirement confirmation
      message.success('Requirements confirmed successfully');
      fetchRequirementsData(); // Refresh data
    } catch (error) {
      message.error('Failed to confirm requirements');
    }
  };

  const handleDocumentUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Simulate document upload
      message.success('Document uploaded successfully');
      setUploadModalVisible(false);
      fetchRequirementsData(); // Refresh data
    } catch (error) {
      message.error('Failed to upload document');
    }
  };

  const getRequirementStatus = (requirement) => {
    const statusColors = {
      pending: 'orange',
      submitted: 'blue',
      verified: 'green',
      non_compliant: 'red',
      overdue: 'red'
    };
    
    return {
      status: requirement.status || 'pending',
      color: statusColors[requirement.status] || 'default',
      icon: requirement.status === 'verified' ? <CheckCircleOutlined /> : 
             requirement.status === 'overdue' ? <ExclamationCircleOutlined /> : 
             <ClockCircleOutlined />
    };
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  return (
    <div className={`requirements-checklist ${className || ''}`}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Requirements Checklist</span>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Download Requirements PDF">
              <Button 
                icon={<DownloadOutlined />}
                onClick={handlePDFDownload}
                disabled={requirements?.pdfDownloaded}
              >
                Download PDF
              </Button>
            </Tooltip>
            <Tooltip title="Confirm Requirements">
              <Button 
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirmRequirements}
                disabled={requirements?.confirmed}
              >
                Confirm
              </Button>
            </Tooltip>
          </Space>
        }
        loading={loading}
      >
        {/* Progress Overview */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>Overall Progress</Text>
            <Text>{calculateProgress()}%</Text>
          </div>
          <Progress 
            percent={calculateProgress()} 
            status={calculateProgress() === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#52c41a',
            }}
          />
        </div>

        {/* Main Requirements Timeline */}
        <Title level={4}>Main Requirements</Title>
        <Timeline>
          <Item
            dot={requirements?.confirmed ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined />}
            color={requirements?.confirmed ? 'green' : 'blue'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Requirements Confirmation</Text>
                <Badge 
                  status={requirements?.confirmed ? 'success' : 'processing'} 
                  text={requirements?.confirmed ? 'Completed' : 'Pending'} 
                />
              </div>
              <Paragraph type="secondary" style={{ margin: '4px 0' }}>
                Review and confirm all business requirements
              </Paragraph>
              {requirements?.confirmedAt && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Completed: {new Date(requirements.confirmedAt).toLocaleDateString()}
                </Text>
              )}
            </div>
          </Item>

          <Item
            dot={requirements?.pdfDownloaded ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined />}
            color={requirements?.pdfDownloaded ? 'green' : 'blue'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Download Requirements PDF</Text>
                <Badge 
                  status={requirements?.pdfDownloaded ? 'success' : 'processing'} 
                  text={requirements?.pdfDownloaded ? 'Downloaded' : 'Pending'} 
                />
              </div>
              <Paragraph type="secondary" style={{ margin: '4px 0' }}>
                Download the complete requirements document for your records
              </Paragraph>
              {requirements?.pdfDownloadedAt && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Downloaded: {new Date(requirements.pdfDownloadedAt).toLocaleDateString()}
                </Text>
              )}
            </div>
          </Item>
        </Timeline>

        <Divider />

        {/* Post-Requirements */}
        <Title level={4}>Additional Requirements</Title>
        {postRequirements.length > 0 ? (
          <List
            dataSource={postRequirements}
            renderItem={(requirement) => {
              const statusInfo = getRequirementStatus(requirement);
              const overdue = isOverdue(requirement.dueDate);
              
              return (
                <List.Item
                  actions={[
                    <Button 
                      key="upload"
                      icon={<UploadOutlined />}
                      size="small"
                      onClick={() => {
                        setSelectedRequirement(requirement);
                        setUploadModalVisible(true);
                      }}
                    >
                      Upload
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={statusInfo.icon}
                    title={
                      <Space>
                        <span>{requirement.title}</span>
                        <Badge color={statusInfo.color} text={statusInfo.status} />
                        {overdue && <Badge color="red" text="Overdue" />}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph type="secondary" style={{ margin: '4px 0' }}>
                          {requirement.description}
                        </Paragraph>
                        {requirement.dueDate && (
                          <Space>
                            <CalendarOutlined />
                            <Text type={overdue ? 'danger' : 'secondary'}>
                              Due: {new Date(requirement.dueDate).toLocaleDateString()}
                            </Text>
                          </Space>
                        )}
                        {requirement.submittedDocuments?.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">
                              Submitted: {requirement.submittedDocuments.length} documents
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Alert
            message="No Additional Requirements"
            description="You have no additional requirements at this time."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        )}

        {/* Help Section */}
        <Alert
          message="Need Help?"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                If you have questions about any requirements, please contact our support team or visit the business center.
              </Paragraph>
              <Space>
                <Button type="link" size="small">View Requirements Guide</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">FAQ</Button>
              </Space>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Compliance Documents"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRequirement && (
          <div>
            <Alert
              message={selectedRequirement.title}
              description={selectedRequirement.description}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Upload.Dragger
              name="file"
              multiple
              beforeUpload={() => false} // Prevent automatic upload
              onChange={(info) => {
                const { file } = info;
                handleDocumentUpload(file);
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                Click or drag files here to upload compliance documents
              </p>
              <p className="ant-upload-hint">
                Support for PDF, JPG, PNG files. Maximum file size: 5MB.
              </p>
            </Upload.Dragger>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequirementsChecklist;
