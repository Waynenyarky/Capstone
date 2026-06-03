import { useState, useEffect } from 'react';
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Badge,
  Timeline,
  Descriptions,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Empty,
  Typography,
  Tabs,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import BusinessOwnerLayout from '../BusinessOwnerLayout';
import { useBusiness } from '@/hooks/useBusiness';
import {
  getViolations,
  submitCompliance,
  appealViolation
} from '../services/violationService';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ViolationTracker = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [form] = Form.useForm();

  const businessId = business?.businessId || business?._id;

  useEffect(() => {
    if (businessId) {
      loadViolations();
    }
  }, [businessId]);

  const loadViolations = async () => {
    setLoading(true);
    try {
      const data = await getViolations(businessId);
      setViolations(data);
    } catch (error) {
      console.error('Failed to load violations:', error);
      message.error('Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCompliance = async (values) => {
    try {
      await submitCompliance(selectedViolation.violationId, {
        correctiveActions: values.correctiveActions,
        documents: values.documents?.map(file => file.response?.url) || []
      });
      
      message.success('Compliance submitted successfully');
      setComplianceModalVisible(false);
      form.resetFields();
      loadViolations();
    } catch (error) {
      console.error('Failed to submit compliance:', error);
      message.error('Failed to submit compliance');
    }
  };

  const handleAppeal = async (values) => {
    try {
      await appealViolation(selectedViolation.violationId, {
        reason: values.reason,
        supportingDocuments: values.documents?.map(file => file.response?.url) || []
      });
      
      message.success('Appeal submitted successfully');
      setAppealModalVisible(false);
      form.resetFields();
      loadViolations();
    } catch (error) {
      console.error('Failed to submit appeal:', error);
      message.error('Failed to submit appeal');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      MINOR: 'yellow',
      MODERATE: 'orange',
      MAJOR: 'red',
      CRITICAL: 'purple'
    };
    return colors[severity] || 'default';
  };

  const getStatusTag = (status) => {
    const config = {
      PENDING: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' },
      COMPLIED: { color: 'success', icon: <CheckCircleOutlined />, text: 'Complied' },
      OVERDUE: { color: 'error', icon: <CloseCircleOutlined />, text: 'Overdue' },
      APPEALED: { color: 'processing', icon: <HistoryOutlined />, text: 'Under Appeal' },
      ESCALATED: { color: 'purple', icon: <ExclamationCircleOutlined />, text: 'Escalated' }
    };
    const c = config[status] || config.PENDING;
    return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
  };

  const columns = [
    {
      title: 'Violation',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Tag color={getSeverityColor(record.severity)}>{record.severity}</Tag>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: 'Issued',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date, record) => (
        <Space direction="vertical" size="small">
          <Text>{dayjs(date).format('MMM D, YYYY')}</Text>
          {record.status === 'PENDING' && (
            <Badge
              count={dayjs(date).diff(dayjs(), 'days')}
              style={{ backgroundColor: dayjs(date).diff(dayjs(), 'days') < 3 ? '#ff4d4f' : '#faad14' }}
            />
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedViolation(record);
              setDetailModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <Button
              type="primary"
              onClick={() => {
                setSelectedViolation(record);
                setComplianceModalVisible(true);
              }}
            >
              Submit Compliance
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'OVERDUE') && (
            <Button
              onClick={() => {
                setSelectedViolation(record);
                setAppealModalVisible(true);
              }}
            >
              Appeal
            </Button>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = violations.filter(v => v.status === 'PENDING').length;
  const overdueCount = violations.filter(v => v.status === 'OVERDUE').length;
  const compliedCount = violations.filter(v => v.status === 'COMPLIED').length;

  return (
    <BusinessOwnerLayout pageTitle="Violation Tracker" pageIcon={<WarningOutlined />}>
      <div style={{ padding: '24px' }}>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Violations"
                value={pendingCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Overdue"
                value={overdueCount}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Complied"
                value={compliedCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Violations"
                value={violations.length}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {overdueCount > 0 && (
          <Alert
            message={`You have ${overdueCount} overdue violation(s)`}
            description="Please address these violations immediately to avoid further penalties or enforcement actions."
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Tabs defaultActiveKey="active">
          <TabPane tab="Active Violations" key="active">
            <Card
              extra={
                <Button icon={<ReloadOutlined />} onClick={loadViolations} loading={loading}>
                  Refresh
                </Button>
              }
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <LottieSpinner />
                </div>
              ) : violations.length === 0 ? (
                <Empty description="No violations found" />
              ) : (
                <Table
                  dataSource={violations}
                  columns={columns}
                  rowKey="violationId"
                  pagination={{ pageSize: 10 }}
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Compliance History" key="history">
            <Card>
              {violations.filter(v => v.compliance?.submittedAt).length === 0 ? (
                <Empty description="No compliance submissions yet" />
              ) : (
                <Timeline mode="left">
                  {violations
                    .filter(v => v.compliance?.submittedAt)
                    .map(v => (
                      <Timeline.Item
                        key={v.violationId}
                        label={dayjs(v.compliance.submittedAt).format('MMM D, YYYY')}
                        color={v.status === 'COMPLIED' ? 'green' : 'blue'}
                      >
                        <Card size="small">
                          <Text strong>{v.type}</Text>
                          <p>{v.compliance.correctiveActions}</p>
                          {v.compliance.verifiedAt && (
                            <Tag color="success">
                              Verified on {dayjs(v.compliance.verifiedAt).format('MMM D, YYYY')}
                            </Tag>
                          )}
                        </Card>
                      </Timeline.Item>
                    ))}
                </Timeline>
              )}
            </Card>
          </TabPane>
        </Tabs>

        {/* Detail Modal */}
        <Modal
          title="Violation Details"
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>
          ]}
          width={700}
        >
          {selectedViolation && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Violation Type">{selectedViolation.type}</Descriptions.Item>
              <Descriptions.Item label="Severity">
                <Tag color={getSeverityColor(selectedViolation.severity)}>
                  {selectedViolation.severity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description">{selectedViolation.description}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(selectedViolation.status)}</Descriptions.Item>
              <Descriptions.Item label="Issued Date">
                {dayjs(selectedViolation.issuedAt).format('MMMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Deadline">
                {dayjs(selectedViolation.deadline).format('MMMM D, YYYY')}
              </Descriptions.Item>
              {selectedViolation.issuedBy && (
                <Descriptions.Item label="Issued By">
                  {selectedViolation.issuedBy.firstName} {selectedViolation.issuedBy.lastName}
                </Descriptions.Item>
              )}
              {selectedViolation.inspectionId && (
                <Descriptions.Item label="Related Inspection">
                  {selectedViolation.inspectionId}
                </Descriptions.Item>
              )}
              {selectedViolation.compliance && (
                <Descriptions.Item label="Compliance Submission">
                  <div>
                    <p><strong>Submitted:</strong> {dayjs(selectedViolation.compliance.submittedAt).format('MMMM D, YYYY')}</p>
                    <p><strong>Actions:</strong> {selectedViolation.compliance.correctiveActions}</p>
                    {selectedViolation.compliance.verifiedAt && (
                      <p><strong>Verified:</strong> {dayjs(selectedViolation.compliance.verifiedAt).format('MMMM D, YYYY')}</p>
                    )}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Compliance Modal */}
        <Modal
          title="Submit Compliance"
          visible={complianceModalVisible}
          onCancel={() => {
            setComplianceModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          {selectedViolation && (
            <>
              <Alert
                message={`Submitting compliance for: ${selectedViolation.type}`}
                description={selectedViolation.description}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form form={form} layout="vertical" onFinish={handleSubmitCompliance}>
                <Form.Item
                  name="correctiveActions"
                  label="Corrective Actions Taken"
                  rules={[{ required: true, message: 'Please describe the corrective actions' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Describe what actions you have taken to address this violation..."
                  />
                </Form.Item>
                <Form.Item
                  name="documents"
                  label="Supporting Documents"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => e?.fileList}
                >
                  <Upload
                    name="compliance"
                    action="/api/upload"
                    listType="picture"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                  >
                    <Button icon={<UploadOutlined />}>Upload Documents</Button>
                  </Upload>
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Submit Compliance
                    </Button>
                    <Button onClick={() => {
                      setComplianceModalVisible(false);
                      form.resetFields();
                    }}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </Modal>

        {/* Appeal Modal */}
        <Modal
          title="Appeal Violation"
          visible={appealModalVisible}
          onCancel={() => {
            setAppealModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          {selectedViolation && (
            <>
              <Alert
                message="Appeal Process"
                description="Submit an appeal if you believe this violation was issued in error or you have extenuating circumstances."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form form={form} layout="vertical" onFinish={handleAppeal}>
                <Form.Item
                  name="reason"
                  label="Reason for Appeal"
                  rules={[{ required: true, message: 'Please provide your reason for appeal' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Explain why you believe this violation should be reconsidered..."
                  />
                </Form.Item>
                <Form.Item
                  name="documents"
                  label="Supporting Evidence"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => e?.fileList}
                >
                  <Upload
                    name="appeal"
                    action="/api/upload"
                    listType="picture"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                  >
                    <Button icon={<UploadOutlined />}>Upload Evidence</Button>
                  </Upload>
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Submit Appeal
                    </Button>
                    <Button onClick={() => {
                      setAppealModalVisible(false);
                      form.resetFields();
                    }}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </Modal>
      </div>
    </BusinessOwnerLayout>
  );
};

export default ViolationTracker;
