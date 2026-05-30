import { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Timeline,
  Button,
  Alert,
  Space,
  Typography,
  Divider,
  List,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  getInspections, 
  getUpcomingInspections, 
  getInspectionViolations,
  acknowledgeInspection,
  getStatusLabel,
  getTypeLabel,
  getResultLabel,
  getStatusColor,
  getResultColor
} from '@/features/business-owner/services/inspectionsService';

const { Title, Text, Paragraph } = Typography;
const { Item } = Timeline;

const InspectionDashboard = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [upcomingInspections, setUpcomingInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionViolations, setInspectionViolations] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchInspectionData();
  }, [businessId]);

  const fetchInspectionData = async () => {
    setLoading(true);
    try {
      // Fetch all inspections
      const inspectionsData = await getInspections({ businessId });
      setInspections(inspectionsData?.inspections || []);
      
      // Fetch upcoming inspections
      const upcomingData = await getUpcomingInspections({ limit: 5 });
      setUpcomingInspections(upcomingData?.inspections || []);
    } catch (error) {
      console.error('Failed to fetch inspection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInspection = async (inspection) => {
    setSelectedInspection(inspection);
    setDetailModalVisible(true);
    
    // Fetch violations for this inspection
    try {
      const violationsData = await getInspectionViolations(inspection.id);
      setInspectionViolations(violationsData?.violations || []);
    } catch (error) {
      console.error('Failed to fetch violations:', error);
      setInspectionViolations([]);
    }
  };

  const handleAcknowledgeInspection = async (inspectionId) => {
    try {
      await acknowledgeInspection(inspectionId);
      message.success('Inspection acknowledged successfully');
      fetchInspectionData(); // Refresh data
    } catch (error) {
      message.error('Failed to acknowledge inspection');
    }
  };

  const getInspectionIcon = (status, result) => {
    if (status === 'completed') {
      if (result === 'passed') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      if (result === 'failed') return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      if (result === 'needs_reinspection') return <WarningOutlined style={{ color: '#faad14' }} />;
    }
    if (status === 'in_progress') return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    return <ClockCircleOutlined style={{ color: '#faad14' }} />;
  };

  const getInspectionTypeColor = (type) => {
    const colors = {
      initial: 'blue',
      renewal: 'green',
      follow_up: 'orange',
      joint: 'purple',
      compliance: 'red',
      complaint: 'magenta'
    };
    return colors[type] || 'default';
  };

  const calculateInspectionStats = () => {
    const total = inspections.length;
    const completed = inspections.filter(i => i.status === 'completed').length;
    const passed = inspections.filter(i => i.result === 'passed').length;
    const failed = inspections.filter(i => i.result === 'failed').length;
    const pending = inspections.filter(i => i.status === 'pending').length;
    
    return { total, completed, passed, failed, pending };
  };

  const stats = calculateInspectionStats();

  return (
    <div className={`inspection-dashboard ${className || ''}`}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Inspection Dashboard</span>
          </Space>
        }
        extra={
          <Button icon={<CalendarOutlined />} onClick={fetchInspectionData}>
            Refresh
          </Button>
        }
        loading={loading}
      >
        {/* Statistics Overview */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Inspections"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Completed"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Passed"
                value={stats.passed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Pending"
                value={stats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Upcoming Inspections */}
        <Title level={4}>Upcoming Inspections</Title>
        {upcomingInspections.length > 0 ? (
          <List
            dataSource={upcomingInspections}
            renderItem={(inspection) => (
              <List.Item
                actions={[
                  <Button 
                    key="view"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewInspection(inspection)}
                  >
                    View Details
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={getInspectionIcon(inspection.status, inspection.result)}
                  title={
                    <Space>
                      <span>{getTypeLabel(inspection.type)} Inspection</span>
                      <Tag color={getInspectionTypeColor(inspection.type)}>
                        {inspection.type}
                      </Tag>
                      <Badge 
                        color={getStatusColor(inspection.status)} 
                        text={getStatusLabel(inspection.status)} 
                      />
                    </Space>
                  }
                  description={
                    <div>
                      <Space direction="vertical" size="small">
                        <Text type="secondary">
                          <CalendarOutlined /> {new Date(inspection.scheduledDate).toLocaleDateString()}
                        </Text>
                        <Text type="secondary">
                          <ClockCircleOutlined /> {inspection.scheduledTime || 'Time TBD'}
                        </Text>
                        <Text type="secondary">
                          Inspector: {inspection.inspectorName || 'Assigned'}
                        </Text>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            description="No upcoming inspections scheduled"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        <Divider />

        {/* Recent Inspection History */}
        <Title level={4}>Recent Inspection History</Title>
        {inspections.length > 0 ? (
          <Timeline>
            {inspections.slice(0, 5).map((inspection) => (
              <Item
                key={inspection.id}
                dot={getInspectionIcon(inspection.status, inspection.result)}
                color={getStatusColor(inspection.status)}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <Text strong>{getTypeLabel(inspection.type)} Inspection</Text>
                      <Tag color={getInspectionTypeColor(inspection.type)}>
                        {inspection.type}
                      </Tag>
                      {inspection.status === 'completed' && (
                        <Tag color={getResultColor(inspection.result)}>
                          {getResultLabel(inspection.result)}
                        </Tag>
                      )}
                    </Space>
                    <Button 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewInspection(inspection)}
                    >
                      View
                    </Button>
                  </div>
                  
                  <Paragraph type="secondary" style={{ margin: '4px 0' }}>
                    <Space>
                      <CalendarOutlined /> {new Date(inspection.scheduledDate).toLocaleDateString()}
                      <ClockCircleOutlined /> {inspection.scheduledTime || 'Time TBD'}
                      <FileTextOutlined /> Inspector: {inspection.inspectorName || 'TBD'}
                    </Space>
                  </Paragraph>
                  
                  {inspection.status === 'completed' && inspection.result === 'failed' && (
                    <Alert
                      message="Inspection Failed"
                      description={`Violations found: ${inspection.violationCount || 0} items require attention`}
                      type="error"
                      showIcon
                      size="small"
                      style={{ marginTop: 8 }}
                    />
                  )}
                  
                  {inspection.status === 'completed' && !inspection.acknowledgedAt && (
                    <Alert
                      message="Action Required"
                      description="Please acknowledge the inspection results"
                      type="warning"
                      showIcon
                      size="small"
                      action={
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => handleAcknowledgeInspection(inspection.id)}
                        >
                          Acknowledge
                        </Button>
                      }
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              </Item>
            ))}
          </Timeline>
        ) : (
          <Empty 
            description="No inspection history available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        <Divider />

        {/* Inspection Preparation Guide */}
        <Title level={4}>Inspection Preparation</Title>
        <Alert
          message="Prepare for Your Inspection"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                To ensure a smooth inspection process, please review the following preparation checklist:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Documents">
                    <Text type="secondary">
                      • Business permit<br/>
                      • Sanitary permit<br/>
                      • Fire safety certificate<br/>
                      • Employee records
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Facility">
                    <Text type="secondary">
                      • Clean premises<br/>
                      • Proper signage<br/>
                      • Safety equipment<br/>
                      • Organized storage
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Compliance">
                    <Text type="secondary">
                      • Health standards<br/>
                      • Safety regulations<br/>
                      • Zoning compliance<br/>
                      • Operational requirements
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
          message="Need Help with Inspections?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you have questions about the inspection process or need assistance with preparation, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Inspection Guide</Button>
                <Button type="link" size="small">Contact Inspector</Button>
                <Button type="link" size="small">Schedule Consultation</Button>
                <Button type="link" size="small">FAQ</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Inspection Detail Modal */}
      <Modal
        title="Inspection Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedInspection && selectedInspection.status === 'completed' && !selectedInspection.acknowledgedAt && (
            <Button 
              key="acknowledge" 
              type="primary"
              onClick={() => handleAcknowledgeInspection(selectedInspection.id)}
            >
              Acknowledge Results
            </Button>
          )
        ]}
        width={800}
      >
        {selectedInspection && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Inspection Type">
                {getTypeLabel(selectedInspection.type)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge color={getStatusColor(selectedInspection.status)} text={getStatusLabel(selectedInspection.status)} />
              </Descriptions.Item>
              <Descriptions.Item label="Scheduled Date">
                {new Date(selectedInspection.scheduledDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Scheduled Time">
                {selectedInspection.scheduledTime || 'TBD'}
              </Descriptions.Item>
              <Descriptions.Item label="Inspector">
                {selectedInspection.inspectorName || 'TBD'}
              </Descriptions.Item>
              {selectedInspection.status === 'completed' && (
                <Descriptions.Item label="Result">
                  <Badge color={getResultColor(selectedInspection.result)} text={getResultLabel(selectedInspection.result)} />
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Location" span={2}>
                {selectedInspection.businessAddress || 'Business Address'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {selectedInspection.notes || 'No additional notes'}
              </Descriptions.Item>
            </Descriptions>

            {inspectionViolations.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Violations Found</Title>
                <List
                  dataSource={inspectionViolations}
                  renderItem={(violation) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title={violation.title}
                        description={
                          <div>
                            <Text type="secondary">{violation.description}</Text>
                            <div style={{ marginTop: 4 }}>
                              <Tag color="red">Severity: {violation.severity}</Tag>
                              <Tag color="orange">Due: {new Date(violation.dueDate).toLocaleDateString()}</Tag>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InspectionDashboard;
