import { useState, useEffect } from 'react';
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import {
  Card,
  Steps,
  Timeline,
  Tag,
  Progress,
  Alert,
  Empty,
  Button,
  Badge,
  Descriptions,
  Space,
  Typography,
  Collapse
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  UserOutlined,
  FileSearchOutlined,
  WarningOutlined
} from '@ant-design/icons';
import BusinessOwnerLayout from '../BusinessOwnerLayout';
import { useBusiness } from '@/hooks/useBusiness';
import { getClearanceStatus, getClearanceTimeline } from '../../services/clearanceService';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Agency icon mapping
const agencyIcons = {
  BARANGAY: <HomeOutlined />,
  ZONING: <EnvironmentOutlined />,
  SANITARY: <SafetyCertificateOutlined />,
  FIRE_SAFETY: <FireOutlined />,
  BFP: <FireOutlined />,
  TREASURY: <BankOutlined />,
  MAYORS_OFFICE: <UserOutlined />
};

// Agency name mapping
const agencyNames = {
  BARANGAY: 'Barangay Office',
  ZONING: 'Zoning & Planning',
  SANITARY: 'Sanitary/Health Office',
  FIRE_SAFETY: 'Fire Safety (BFP)',
  BFP: 'Bureau of Fire Protection',
  TREASURY: 'Treasury Office',
  MAYORS_OFFICE: "Mayor's Office"
};

// Status color mapping
const statusColors = {
  PENDING: 'default',
  UNDER_REVIEW: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  WAIVED: 'warning',
  CONDITIONAL: 'warning'
};

// Status icon mapping
const statusIcons = {
  PENDING: <ClockCircleOutlined />,
  UNDER_REVIEW: <FileSearchOutlined />,
  APPROVED: <CheckCircleOutlined />,
  REJECTED: <CloseCircleOutlined />,
  WAIVED: <CheckCircleOutlined />,
  CONDITIONAL: <WarningOutlined />
};

const ClearanceTracker = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [clearanceData, setClearanceData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (business?.businessId || business?._id) {
      fetchClearanceData();
    }
  }, [business]);

  const fetchClearanceData = async () => {
    const businessId = business?.businessId || business?._id;
    if (!businessId) return;

    setLoading(true);
    try {
      const [status, timeline] = await Promise.all([
        getClearanceStatus(businessId),
        getClearanceTimeline(businessId)
      ]);
      setClearanceData(status);
      setTimelineData(timeline);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch clearance data:', err);
      setError('Failed to load clearance information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (agencyStatus) => {
    switch (agencyStatus) {
      case 'APPROVED':
      case 'WAIVED':
        return 'finish';
      case 'UNDER_REVIEW':
        return 'process';
      case 'REJECTED':
        return 'error';
      default:
        return 'wait';
    }
  };

  const renderClearanceStepper = () => {
    if (!clearanceData?.clearances?.length) return null;

    const steps = clearanceData.clearances.map(clearance => ({
      title: agencyNames[clearance.agency] || clearance.agency,
      icon: agencyIcons[clearance.agency] || <FileTextOutlined />,
      status: getStepStatus(clearance.status),
      description: (
        <Space direction="vertical" size="small">
          <Tag color={statusColors[clearance.status]} icon={statusIcons[clearance.status]}>
            {clearance.status}
          </Tag>
          {clearance.reviewedAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {new Date(clearance.reviewedAt).toLocaleDateString()}
            </Text>
          )}
          {clearance.deficiencies > 0 && (
            <Badge count={clearance.deficiencies}>
              <Text type="warning">Deficiencies</Text>
            </Badge>
          )}
        </Space>
      )
    }));

    return (
      <Card title="Clearance Progress" style={{ marginBottom: 24 }}>
        <Steps
          direction="horizontal"
          current={steps.findIndex(s => s.status === 'process')}
          items={steps}
          responsive
        />
        <Progress
          percent={clearanceData.completionPercentage}
          status={clearanceData.overallStatus === 'HAS_REJECTION' ? 'exception' : 'active'}
          style={{ marginTop: 24 }}
        />
      </Card>
    );
  };

  const renderAgencyDetails = () => {
    if (!clearanceData?.clearances?.length) return null;

    return (
      <Collapse accordion>
        {clearanceData.clearances.map((clearance, index) => (
          <Panel
            header={
              <Space>
                {agencyIcons[clearance.agency]}
                <Text strong>{agencyNames[clearance.agency] || clearance.agency}</Text>
                <Tag color={statusColors[clearance.status]} icon={statusIcons[clearance.status]}>
                  {clearance.status}
                </Tag>
                {clearance.deficiencies > 0 && (
                  <Badge count={clearance.deficiencies} style={{ marginLeft: 8 }} />
                )}
              </Space>
            }
            key={clearance.agency}
          >
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={statusColors[clearance.status]} icon={statusIcons[clearance.status]}>
                  {clearance.status}
                </Tag>
              </Descriptions.Item>
              {clearance.submittedAt && (
                <Descriptions.Item label="Submitted">
                  {new Date(clearance.submittedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {clearance.reviewedAt && (
                <Descriptions.Item label="Reviewed">
                  {new Date(clearance.reviewedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {clearance.certificateNumber && (
                <Descriptions.Item label="Certificate Number">
                  <Text code>{clearance.certificateNumber}</Text>
                </Descriptions.Item>
              )}
              {clearance.notes && (
                <Descriptions.Item label="Notes">
                  {clearance.notes}
                </Descriptions.Item>
              )}
              {clearance.rejectionReason && (
                <Descriptions.Item label="Rejection Reason">
                  <Text type="danger">{clearance.rejectionReason}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {clearance.deficiencies > 0 && (
              <Alert
                message="Deficiencies Found"
                description={`${clearance.deficiencies} deficiency(s) need to be resolved.`}
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                action={
                  <Button size="small" type="primary">
                    View Deficiencies
                  </Button>
                }
              />
            )}
          </Panel>
        ))}
      </Collapse>
    );
  };

  const renderTimeline = () => {
    if (!timelineData?.stages?.length) return null;

    return (
      <Card title="Processing Timeline" style={{ marginBottom: 24 }}>
        <Timeline mode="left">
          {timelineData.stages.map((stage, index) => (
            <Timeline.Item
              key={index}
              color={stage.completedAt ? 'green' : 'blue'}
              label={new Date(stage.startedAt).toLocaleDateString()}
            >
              <Text strong>{stage.stage}</Text>
              {stage.agency && <Text type="secondary"> - {agencyNames[stage.agency] || stage.agency}</Text>}
              {stage.duration && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Duration: {stage.duration} hours
                  </Text>
                </div>
              )}
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  if (loading) {
    return (
      <BusinessOwnerLayout pageTitle="Clearance Tracker" pageIcon={<FileTextOutlined />}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <LottieSpinner size="large" />
          <p>Loading clearance information...</p>
        </div>
      </BusinessOwnerLayout>
    );
  }

  if (error) {
    return (
      <BusinessOwnerLayout pageTitle="Clearance Tracker" pageIcon={<FileTextOutlined />}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchClearanceData} type="primary">
              Retry
            </Button>
          }
        />
      </BusinessOwnerLayout>
    );
  }

  if (!clearanceData) {
    return (
      <BusinessOwnerLayout pageTitle="Clearance Tracker" pageIcon={<FileTextOutlined />}>
        <Empty
          description="No clearance process found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => window.location.href = '/application/new'}>
            Start New Application
          </Button>
        </Empty>
      </BusinessOwnerLayout>
    );
  }

  return (
    <BusinessOwnerLayout pageTitle="Clearance Tracker" pageIcon={<FileTextOutlined />}>
      <div style={{ padding: '24px' }}>
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={4}>Clearance Status</Title>
            <Space>
              <Text strong>Reference:</Text>
              <Text code>{clearanceData.referenceNumber}</Text>
            </Space>
            <Space>
              <Text strong>Status:</Text>
              <Tag color={clearanceData.overallStatus === 'ALL_APPROVED' ? 'success' : 'processing'}>
                {clearanceData.overallStatus}
              </Tag>
            </Space>
            <Space>
              <Text strong>Progress:</Text>
              <Text>{clearanceData.completionPercentage}% Complete</Text>
            </Space>
            {clearanceData.queuePosition && (
              <Space>
                <Text strong>Queue Position:</Text>
                <Text>#{clearanceData.queuePosition}</Text>
              </Space>
            )}
            {clearanceData.estimatedCompletionDate && (
              <Space>
                <Text strong>Est. Completion:</Text>
                <Text>{new Date(clearanceData.estimatedCompletionDate).toLocaleDateString()}</Text>
              </Space>
            )}
          </Space>
        </Card>

        {renderClearanceStepper()}
        {renderAgencyDetails()}
        {renderTimeline()}

        {clearanceData.overallStatus === 'ALL_APPROVED' && (
          <Alert
            message="All Clearances Approved!"
            description="Your application has received all required agency clearances. You can now proceed to permit issuance."
            type="success"
            showIcon
            action={
              <Button type="primary" href="/payments">
                Pay Permit Fee
              </Button>
            }
          />
        )}

        {clearanceData.overallStatus === 'HAS_REJECTION' && (
          <Alert
            message="Clearance Issues Found"
            description="One or more agencies have rejected or requested changes to your application. Please review the agency details above."
            type="error"
            showIcon
            action={
              <Button type="primary" href="/owner">
                View Application
              </Button>
            }
          />
        )}
      </div>
    </BusinessOwnerLayout>
  );
};

export default ClearanceTracker;
