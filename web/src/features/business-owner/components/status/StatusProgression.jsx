import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Steps,
  Button,
  Space,
  Alert,
  Progress,
  Timeline,
  Tag,
  Tooltip,
  Row,
  Col,
  List,
  Avatar,
  Divider
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  FileTextOutlined,
  SyncOutlined,
  CalendarOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Status progression configuration
const STATUS_PROGRESSION_STEPS = [
  {
    key: 'draft',
    title: 'Draft Application',
    description: 'Start your business application',
    icon: <FileTextOutlined />,
    color: '#d9d9d9',
    estimatedDuration: '15-30 min',
    requirements: ['Basic business information', 'Owner details'],
    blockers: [],
    nextActions: ['Complete application form']
  },
  {
    key: 'preparing',
    title: 'Preparing Documents',
    description: 'Gather and upload required documents',
    icon: <SyncOutlined spin />,
    color: '#1890ff',
    estimatedDuration: '10-20 min',
    requirements: ['Business permit application', 'Valid IDs', 'Proof of address'],
    blockers: ['Missing documents', 'Invalid file formats'],
    nextActions: ['Upload missing documents', 'Verify file formats']
  },
  {
    key: 'submitted',
    title: 'Application Submitted',
    description: 'Your application is under review',
    icon: <RocketOutlined />,
    color: '#52c41a',
    estimatedDuration: '3-5 business days',
    requirements: ['Complete application', 'All documents uploaded'],
    blockers: ['Incomplete application', 'Missing requirements'],
    nextActions: ['Wait for staff review', 'Prepare for possible revisions']
  },
  {
    key: 'under_review',
    title: 'Under Review',
    description: 'LGU staff is reviewing your application',
    icon: <ClockCircleOutlined />,
    color: '#faad14',
    estimatedDuration: '5-7 business days',
    requirements: ['Application in review queue'],
    blockers: ['High volume of applications', 'Additional information needed'],
    nextActions: ['Respond to staff requests', 'Provide additional information']
  },
  {
    key: 'approved',
    title: 'Application Approved',
    description: 'Your application has been approved',
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    estimatedDuration: 'Immediate',
    requirements: ['Application meets all requirements'],
    blockers: [],
    nextActions: ['Download permit', 'Schedule first inspection', 'Set up payments']
  },
  {
    key: 'active',
    title: 'Business Active',
    description: 'Your business is fully operational',
    icon: <PlayCircleOutlined />,
    color: '#52c41a',
    estimatedDuration: 'Ongoing',
    requirements: ['Permit issued', 'Initial inspection completed'],
    blockers: ['Pending inspections', 'Unpaid fees'],
    nextActions: ['Maintain compliance', 'Complete inspections', 'Pay fees on time']
  },
  {
    key: 'compliant',
    title: 'Fully Compliant',
    description: 'All requirements and regulations are met',
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    estimatedDuration: 'Ongoing',
    requirements: ['All inspections passed', 'All fees paid', 'All documents current'],
    blockers: ['Overdue inspections', 'Unpaid penalties', 'Expired documents'],
    nextActions: ['Maintain compliance', 'Monitor deadlines', 'Update documents']
  }
];

const StatusProgression = ({ business, onActionClick, compact = false }) => {
  const { businesses } = useBusiness();
  const [currentStatus, setCurrentStatus] = useState('draft');
  const [blockers, setBlockers] = useState([]);
  const [nextActions, setNextActions] = useState([]);
  const [estimatedCompletion, setEstimatedCompletion] = useState(null);

  useEffect(() => {
    if (business) {
      analyzeBusinessStatus(business);
    }
  }, [business]);

  const analyzeBusinessStatus = (businessData) => {
    // Determine current status based on business data
    let status = 'draft';
    const detectedBlockers = [];
    const actions = [];

    if (businessData.applicationStatus === 'pending') {
      status = 'submitted';
    } else if (businessData.applicationStatus === 'under_review') {
      status = 'under_review';
    } else if (businessData.applicationStatus === 'approved') {
      status = 'approved';
    } else if (businessData.applicationStatus === 'active') {
      status = 'active';
    } else if (businessData.businessStatus === 'compliant') {
      status = 'compliant';
    }

    // Check for blockers
    if (businessData.pendingInspections > 0) {
      detectedBlockers.push({
        type: 'inspection',
        description: `${businessData.pendingInspections} pending inspection(s)`,
        severity: 'warning'
      });
    }

    if (businessData.overduePayments > 0) {
      detectedBlockers.push({
        type: 'payment',
        description: `${businessData.overduePayments} overdue payment(s)`,
        severity: 'error'
      });
    }

    if (businessData.missingDocuments > 0) {
      detectedBlockers.push({
        type: 'documents',
        description: `${businessData.missingDocuments} missing document(s)`,
        severity: 'error'
      });
    }

    // Set next actions based on current status and blockers
    const currentStep = STATUS_PROGRESSION_STEPS.find(step => step.key === status);
    if (currentStep) {
      actions.push(...currentStep.nextActions);
      
      // Add blocker-specific actions
      detectedBlockers.forEach(blocker => {
        if (blocker.type === 'inspection') {
          actions.push('Schedule inspection');
        } else if (blocker.type === 'payment') {
          actions.push('Pay overdue fees');
        } else if (blocker.type === 'documents') {
          actions.push('Upload missing documents');
        }
      });
    }

    setCurrentStatus(status);
    setBlockers(detectedBlockers);
    setNextActions(actions);
    
    // Calculate estimated completion time
    calculateEstimatedCompletion(status, detectedBlockers);
  };

  const calculateEstimatedCompletion = (status, detectedBlockers) => {
    const currentStepIndex = STATUS_PROGRESSION_STEPS.findIndex(step => step.key === status);
    const remainingSteps = STATUS_PROGRESSION_STEPS.slice(currentStepIndex + 1);
    
    let totalDays = 0;
    remainingSteps.forEach(step => {
      if (step.estimatedDuration.includes('business days')) {
        const days = parseInt(step.estimatedDuration.split('-')[1]) || 5;
        totalDays += days;
      } else if (step.estimatedDuration.includes('min')) {
        // Convert minutes to days (assuming 8 working hours per day)
        const minutes = parseInt(step.estimatedDuration.split('-')[1]) || 30;
        totalDays += minutes / (8 * 60);
      }
    });

    // Add extra time for blockers
    detectedBlockers.forEach(blocker => {
      if (blocker.severity === 'error') {
        totalDays += 3; // Extra 3 days for critical blockers
      } else if (blocker.severity === 'warning') {
        totalDays += 1; // Extra 1 day for warnings
      }
    });

    setEstimatedCompletion(Math.ceil(totalDays));
  };

  const getCurrentStepIndex = () => {
    return STATUS_PROGRESSION_STEPS.findIndex(step => step.key === currentStatus);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / STATUS_PROGRESSION_STEPS.length) * 100;
  };

  const handleActionClick = (action) => {
    onActionClick?.(action, currentStatus);
  };

  if (compact) {
    return (
      <Card size="small">
        <div style={{ padding: '12px 0' }}>
          <Progress
            percent={getProgressPercentage()}
            size="small"
            status={blockers.some(b => b.severity === 'error') ? 'exception' : 'active'}
          />
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <Text strong>
              {STATUS_PROGRESSION_STEPS.find(step => step.key === currentStatus)?.title}
            </Text>
            {estimatedCompletion && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ~{estimatedCompletion} days to completion
                </Text>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="status-progression">
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>Application Progress</span>
          </Space>
        }
        extra={
          <Tag color={STATUS_PROGRESSION_STEPS.find(step => step.key === currentStatus)?.color}>
            {getProgressPercentage().toFixed(0)}% Complete
          </Tag>
        }
      >
        {/* Progress Overview */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={16}>
            <Steps
              current={getCurrentStepIndex()}
              size="small"
              direction="vertical"
            >
              {STATUS_PROGRESSION_STEPS.map((step, index) => (
                <Step
                  key={step.key}
                  title={step.title}
                  description={
                    <div>
                      <Text type="secondary">{step.description}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Est: {step.estimatedDuration}
                      </Text>
                    </div>
                  }
                  icon={step.icon}
                />
              ))}
            </Steps>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={getProgressPercentage()}
                format={(percent) => `${Math.round(percent)}%`}
                status={blockers.some(b => b.severity === 'error') ? 'exception' : 'active'}
                size={120}
              />
              <div style={{ marginTop: '12px' }}>
                <Text strong>Application Progress</Text>
                <br />
                {estimatedCompletion && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ~{estimatedCompletion} days remaining
                  </Text>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* Blockers */}
        {blockers.length > 0 && (
          <Alert
            message="Action Required"
            description={
              <List
                size="small"
                dataSource={blockers}
                renderItem={(blocker) => (
                  <List.Item>
                    <Space>
                      {blocker.severity === 'error' ? 
                        <ExclamationCircleOutlined style={{ color: '#f5222d' }} /> :
                        <WarningOutlined style={{ color: '#faad14' }} />
                      }
                      <Text>{blocker.description}</Text>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleActionClick(
                          blocker.type === 'inspection' ? 'Schedule inspection' :
                          blocker.type === 'payment' ? 'Pay fees' :
                          'Upload documents'
                        )}
                      >
                        {blocker.type === 'inspection' ? 'Schedule' :
                         blocker.type === 'payment' ? 'Pay' : 'Upload'}
                      </Button>
                    </Space>
                  </List.Item>
                )}
              />
            }
            type={blockers.some(b => b.severity === 'error') ? 'error' : 'warning'}
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* Next Actions */}
        {nextActions.length > 0 && (
          <Card title="Recommended Actions" size="small" style={{ marginBottom: '16px' }}>
            <List
              size="small"
              dataSource={nextActions}
              renderItem={(action, index) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small"
                      key={`action-${index}`}
                      onClick={() => handleActionClick(action)}
                    >
                      {action.includes('Download') ? 'Download' : 
                       action.includes('Schedule') ? 'Schedule' :
                       action.includes('Set up') ? 'Set Up' :
                       action.includes('Complete') ? 'Complete' :
                       action.includes('Upload') ? 'Upload' :
                       action.includes('Review') ? 'Review' :
                       action.includes('Wait') ? 'View Status' :
                       action.includes('Respond') ? 'Respond' :
                       action.includes('Address') ? 'Address' :
                       action.includes('Submit') ? 'Submit' :
                       action.includes('Pay') ? 'Pay' :
                       action.includes('Update') ? 'Update' :
                       action.includes('Maintain') ? 'Maintain' :
                       action.includes('Monitor') ? 'Monitor' :
                       action.includes('Renew') ? 'Renew' : 'Action'}
                    </Button>
                  ]}
                >
                  <Space>
                    <Avatar icon={<InfoCircleOutlined />} size="small" />
                    <Text>{action}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Timeline View */}
        <Card title="Status Timeline" size="small">
          <Timeline>
            {STATUS_PROGRESSION_STEPS.map((step, index) => {
              const currentIndex = getCurrentStepIndex();
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isUpcoming = index > currentIndex;
              
              return (
                <Timeline.Item
                  key={step.key}
                  color={isCompleted ? 'green' : isCurrent ? step.color : 'gray'}
                  dot={isCurrent ? step.icon : isCompleted ? <CheckCircleOutlined /> : null}
                >
                  <div>
                    <Space>
                      <Text strong={isCurrent}>{step.title}</Text>
                      {isCompleted && <Tag color="success">Completed</Tag>}
                      {isCurrent && <Tag color={step.color}>Current</Tag>}
                      {isUpcoming && <Tag>Upcoming</Tag>}
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {step.description}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Estimated: {step.estimatedDuration}
                    </Text>
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Card>
      </Card>
    </div>
  );
};

export default StatusProgression;
