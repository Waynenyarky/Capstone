import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Tag,
  Space,
  Timeline,
  Button,
  Tooltip,
  Badge,
  Progress,
  Alert,
  Collapse,
  List,
  Avatar,
  Divider,
  Row,
  Col
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  FileTextOutlined,
  CalendarOutlined,
  AlertOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Unified status mapping
const UNIFIED_STATUS = {
  DRAFT: 'draft',
  PREPARING: 'preparing',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  COMPLIANT: 'compliant',
  NEEDS_ATTENTION: 'needs_attention',
  EXPIRED: 'expired'
};

// Status configuration with colors, icons, and descriptions
const STATUS_CONFIG = {
  [UNIFIED_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'default',
    icon: <FileTextOutlined />,
    description: 'Application is being prepared',
    nextActions: ['Complete application form', 'Upload required documents'],
    estimatedTime: '15-30 minutes'
  },
  [UNIFIED_STATUS.PREPARING]: {
    label: 'Preparing',
    color: 'processing',
    icon: <SyncOutlined spin />,
    description: 'Application is being prepared for submission',
    nextActions: ['Review application details', 'Upload missing documents'],
    estimatedTime: '10-20 minutes'
  },
  [UNIFIED_STATUS.SUBMITTED]: {
    label: 'Submitted',
    color: 'processing',
    icon: <RocketOutlined />,
    description: 'Application has been submitted for review',
    nextActions: ['Wait for staff review', 'Prepare for possible revisions'],
    estimatedTime: '3-5 business days'
  },
  [UNIFIED_STATUS.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'processing',
    icon: <ClockCircleOutlined />,
    description: 'Application is being reviewed by LGU staff',
    nextActions: ['Respond to staff requests', 'Provide additional information'],
    estimatedTime: '5-7 business days'
  },
  [UNIFIED_STATUS.APPROVED]: {
    label: 'Approved',
    color: 'success',
    icon: <CheckCircleOutlined />,
    description: 'Application has been approved',
    nextActions: ['Download permit', 'Schedule first inspection', 'Set up payments'],
    estimatedTime: 'Immediate'
  },
  [UNIFIED_STATUS.ACTIVE]: {
    label: 'Active',
    color: 'success',
    icon: <CheckCircleOutlined />,
    description: 'Business is fully operational',
    nextActions: ['Maintain compliance', 'Renew permits on time', 'Complete inspections'],
    estimatedTime: 'Ongoing'
  },
  [UNIFIED_STATUS.COMPLIANT]: {
    label: 'Compliant',
    color: 'success',
    icon: <CheckCircleOutlined />,
    description: 'All requirements and regulations are met',
    nextActions: ['Maintain compliance', 'Monitor deadlines', 'Update documents'],
    estimatedTime: 'Ongoing'
  },
  [UNIFIED_STATUS.NEEDS_ATTENTION]: {
    label: 'Needs Attention',
    color: 'warning',
    icon: <ExclamationCircleOutlined />,
    description: 'Action required to proceed',
    nextActions: ['Address identified issues', 'Submit required documents', 'Respond to notices'],
    estimatedTime: '1-3 days'
  },
  [UNIFIED_STATUS.EXPIRED]: {
    label: 'Expired',
    color: 'error',
    icon: <WarningOutlined />,
    description: 'Permit or registration has expired',
    nextActions: ['Renew immediately', 'Pay penalties', 'Update documentation'],
    estimatedTime: 'Immediate action required'
  }
};

// Status progression order
const STATUS_PROGRESSION = [
  UNIFIED_STATUS.DRAFT,
  UNIFIED_STATUS.PREPARING,
  UNIFIED_STATUS.SUBMITTED,
  UNIFIED_STATUS.UNDER_REVIEW,
  UNIFIED_STATUS.APPROVED,
  UNIFIED_STATUS.ACTIVE,
  UNIFIED_STATUS.COMPLIANT
];

const UnifiedStatusDisplay = ({ business, showHistory = true, showActions = true }) => {
  const { updateBusinessProfile } = useBusiness();
  const [unifiedStatus, setUnifiedStatus] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simulate status reconciliation
  useEffect(() => {
    if (business) {
      reconcileStatus(business);
    }
  }, [business]);

  const reconcileStatus = (businessData) => {
    setLoading(true);
    
    // Simulate status reconciliation logic
    let reconciledStatus = UNIFIED_STATUS.DRAFT;
    const history = [];
    const detectedConflicts = [];

    // Map existing status to unified status
    if (businessData.applicationStatus === 'pending') {
      reconciledStatus = UNIFIED_STATUS.SUBMITTED;
    } else if (businessData.applicationStatus === 'approved') {
      reconciledStatus = UNIFIED_STATUS.APPROVED;
    } else if (businessData.applicationStatus === 'active') {
      reconciledStatus = UNIFIED_STATUS.ACTIVE;
    } else if (businessData.applicationStatus === 'expired') {
      reconciledStatus = UNIFIED_STATUS.EXPIRED;
    } else if (businessData.applicationStatus === 'rejected') {
      reconciledStatus = UNIFIED_STATUS.NEEDS_ATTENTION;
    }

    // Check for compliance issues
    if (businessData.pendingInspections > 0 || businessData.overduePayments > 0) {
      detectedConflicts.push({
        type: 'compliance',
        description: 'Compliance issues detected',
        severity: 'warning'
      });
      if (reconciledStatus === UNIFIED_STATUS.ACTIVE) {
        reconciledStatus = UNIFIED_STATUS.NEEDS_ATTENTION;
      }
    }

    // Generate mock history
    history.push({
      status: UNIFIED_STATUS.DRAFT,
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Application started'
    });
    
    history.push({
      status: UNIFIED_STATUS.PREPARING,
      timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Preparing application documents'
    });
    
    history.push({
      status: UNIFIED_STATUS.SUBMITTED,
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Application submitted for review'
    });

    if (reconciledStatus !== UNIFIED_STATUS.SUBMITTED) {
      history.push({
        status: UNIFIED_STATUS.UNDER_REVIEW,
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Application under review'
      });
    }

    if (reconciledStatus === UNIFIED_STATUS.APPROVED || 
        reconciledStatus === UNIFIED_STATUS.ACTIVE || 
        reconciledStatus === UNIFIED_STATUS.COMPLIANT) {
      history.push({
        status: UNIFIED_STATUS.APPROVED,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Application approved'
      });
    }

    if (reconciledStatus === UNIFIED_STATUS.ACTIVE || 
        reconciledStatus === UNIFIED_STATUS.COMPLIANT) {
      history.push({
        status: UNIFIED_STATUS.ACTIVE,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Business activated'
      });
    }

    if (reconciledStatus === UNIFIED_STATUS.COMPLIANT) {
      history.push({
        status: UNIFIED_STATUS.COMPLIANT,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'All compliance requirements met'
      });
    }

    setUnifiedStatus(reconciledStatus);
    setStatusHistory(history);
    setConflicts(detectedConflicts);
    setLoading(false);
  };

  const getStatusProgress = () => {
    const currentIndex = STATUS_PROGRESSION.indexOf(unifiedStatus);
    return currentIndex >= 0 ? ((currentIndex + 1) / STATUS_PROGRESSION.length) * 100 : 0;
  };

  const getNextStatus = () => {
    const currentIndex = STATUS_PROGRESSION.indexOf(unifiedStatus);
    return currentIndex >= 0 && currentIndex < STATUS_PROGRESSION.length - 1 
      ? STATUS_PROGRESSION[currentIndex + 1] 
      : null;
  };

  const getPreviousStatuses = () => {
    const currentIndex = STATUS_PROGRESSION.indexOf(unifiedStatus);
    return currentIndex >= 0 ? STATUS_PROGRESSION.slice(0, currentIndex) : [];
  };

  const handleStatusSync = async () => {
    setLoading(true);
    try {
      // Simulate API call to sync status
      await new Promise(resolve => setTimeout(resolve, 2000));
      reconcileStatus(business);
    } catch (error) {
      console.error('Status sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!business || loading) {
    return (
      <Card loading={true}>
        <div style={{ height: '200px' }} />
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[unifiedStatus] || STATUS_CONFIG[UNIFIED_STATUS.DRAFT];
  const nextStatus = getNextStatus();
  const progress = getStatusProgress();

  return (
    <div className="unified-status-display">
      {/* Current Status Card */}
      <Card 
        title={
          <Space>
            {statusConfig.icon}
            <span>Current Status</span>
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={handleStatusSync}
              loading={loading}
            >
              Sync
            </Button>
          </Space>
        }
        extra={
          <Tag color={statusConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
            {statusConfig.label}
          </Tag>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>{statusConfig.description}</Text>
              </div>
              
              <div>
                <Text type="secondary">Estimated completion time: {statusConfig.estimatedTime}</Text>
              </div>

              {conflicts.length > 0 && (
                <Alert
                  message="Status Conflicts Detected"
                  description={
                    <List
                      size="small"
                      dataSource={conflicts}
                      renderItem={(conflict) => (
                        <List.Item>
                          <Space>
                            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                            <Text>{conflict.description}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: '12px' }}
                />
              )}
            </Space>
          </Col>
          
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={progress}
                format={(percent) => `${Math.round(percent)}%`}
                strokeColor={statusConfig.color}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Application Progress</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Next Actions */}
      {showActions && statusConfig.nextActions.length > 0 && (
        <Card title="Next Actions" style={{ marginBottom: '16px' }}>
          <List
            dataSource={statusConfig.nextActions}
            renderItem={(action, index) => (
              <List.Item
                actions={[
                  <Button type="primary" size="small" key={`action-${index}`}>
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
                  <Avatar icon={<InfoCircleOutlined />} />
                  <Text>{action}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Status Progression */}
      <Card title="Status Progression" style={{ marginBottom: '16px' }}>
        <Timeline>
          {STATUS_PROGRESSION.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const isCompleted = getPreviousStatuses().includes(status);
            const isCurrent = status === unifiedStatus;
            const isNext = status === nextStatus;
            
            return (
              <Timeline.Item
                key={status}
                color={isCompleted ? 'green' : isCurrent ? config.color : isNext ? 'blue' : 'gray'}
                dot={isCurrent ? config.icon : null}
              >
                <div>
                  <Space>
                    <Text strong={isCurrent}>{config.label}</Text>
                    {isCompleted && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {isNext && <Text type="secondary">(Next)</Text>}
                  </Space>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {config.description}
                  </Text>
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Card>

      {/* Status History */}
      {showHistory && statusHistory.length > 0 && (
        <Card title="Status History">
          <Timeline>
            {statusHistory.map((historyItem, index) => {
              const config = STATUS_CONFIG[historyItem.status];
              return (
                <Timeline.Item
                  key={index}
                  color={config.color}
                  dot={config.icon}
                >
                  <div>
                    <Space>
                      <Text strong>{config.label}</Text>
                      <Text type="secondary">
                        {new Date(historyItem.timestamp).toLocaleDateString()}
                      </Text>
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {historyItem.description}
                    </Text>
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Card>
      )}
    </div>
  );
};

export default UnifiedStatusDisplay;
