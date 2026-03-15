import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Alert,
  Badge,
  Tabs,
  Timeline,
  Spin,
  Empty,
  Tooltip,
  message,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import StaffLayout from '@/features/staffs/components/StaffLayout';
import {
  getAgencyQueue,
  startAgencyReview,
  approveAgencyClearance,
  rejectAgencyClearance,
  raiseDeficiency,
  resolveDeficiency,
  AGENCY_NAMES,
  STATUS_COLORS,
  STATUS_LABELS
} from '@/features/business-owner/services/clearanceService';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const AgencyDashboard = ({ agency = 'ZONING' }) => {
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState([]);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [deficiencyModalVisible, setDeficiencyModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchAgencyQueue();
  }, [agency]);

  const fetchAgencyQueue = async () => {
    setLoading(true);
    try {
      const response = await getAgencyQueue(agency, { status: 'all', page: 1, limit: 50 });
      setQueueData(response.items || []);
      
      // Calculate stats
      const data = response.items || [];
      setStats({
        pending: data.filter(item => item.status === 'PENDING').length,
        underReview: data.filter(item => item.status === 'UNDER_REVIEW').length,
        approved: data.filter(item => item.status === 'APPROVED').length,
        rejected: data.filter(item => item.status === 'REJECTED').length
      });
    } catch (error) {
      console.error('Failed to fetch agency queue:', error);
      message.error('Failed to load clearance queue');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async (record) => {
    try {
      await startAgencyReview(agency, {
        businessId: record.businessId,
        clearanceId: record.clearanceId
      });
      message.success('Review started');
      fetchAgencyQueue();
      setDetailModalVisible(false);
    } catch (error) {
      message.error('Failed to start review');
    }
  };

  const handleApprove = async (values) => {
    try {
      await approveAgencyClearance(agency, {
        businessId: selectedClearance.businessId,
        clearanceId: selectedClearance.clearanceId,
        notes: values.notes,
        certificateNumber: values.certificateNumber
      });
      message.success('Clearance approved');
      setReviewModalVisible(false);
      form.resetFields();
      fetchAgencyQueue();
    } catch (error) {
      message.error('Failed to approve clearance');
    }
  };

  const handleReject = async (values) => {
    try {
      await rejectAgencyClearance(agency, {
        businessId: selectedClearance.businessId,
        clearanceId: selectedClearance.clearanceId,
        reason: values.reason
      });
      message.success('Clearance rejected');
      setReviewModalVisible(false);
      form.resetFields();
      fetchAgencyQueue();
    } catch (error) {
      message.error('Failed to reject clearance');
    }
  };

  const handleRaiseDeficiency = async (values) => {
    try {
      await raiseDeficiency(agency, {
        businessId: selectedClearance.businessId,
        clearanceId: selectedClearance.clearanceId,
        description: values.description,
        requiredDocuments: values.requiredDocuments?.split(',').map(d => d.trim()) || []
      });
      message.success('Deficiency raised');
      setDeficiencyModalVisible(false);
      form.resetFields();
      fetchAgencyQueue();
    } catch (error) {
      message.error('Failed to raise deficiency');
    }
  };

  const getStatusTag = (status) => (
    <Tag color={STATUS_COLORS[status]} icon={getStatusIcon(status)}>
      {STATUS_LABELS[status]}
    </Tag>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleOutlined />;
      case 'REJECTED':
        return <CloseCircleOutlined />;
      case 'UNDER_REVIEW':
        return <FileSearchOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (text) => <code>{text}</code>
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.queuePosition && (
            <Badge count={`#${record.queuePosition}`} style={{ backgroundColor: '#1890ff' }} />
          )}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedClearance(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'PENDING' && (
            <Tooltip title="Start Review">
              <Button
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={() => handleStartReview(record)}
              >
                Review
              </Button>
            </Tooltip>
          )}
          {record.status === 'UNDER_REVIEW' && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setSelectedClearance(record);
                    setReviewModalVisible(true);
                  }}
                >
                  Approve
                </Button>
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setSelectedClearance(record);
                    form.setFieldsValue({ action: 'reject' });
                    setReviewModalVisible(true);
                  }}
                >
                  Reject
                </Button>
              </Tooltip>
              <Tooltip title="Raise Deficiency">
                <Button
                  icon={<WarningOutlined />}
                  onClick={() => {
                    setSelectedClearance(record);
                    setDeficiencyModalVisible(true);
                  }}
                >
                  Deficiency
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <StaffLayout>
      <div style={{ padding: '24px' }}>
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={3}>
              <SafetyCertificateOutlined /> {AGENCY_NAMES[agency]} Dashboard
            </Title>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Pending"
                  value={stats.pending}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Under Review"
                  value={stats.underReview}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<FileSearchOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Approved"
                  value={stats.approved}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Rejected"
                  value={stats.rejected}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
          </Space>
        </Card>

        <Tabs defaultActiveKey="pending">
          <TabPane tab="Pending" key="pending">
            <Table
              dataSource={queueData.filter(item => item.status === 'PENDING')}
              columns={columns}
              rowKey="clearanceId"
              loading={loading}
            />
          </TabPane>
          <TabPane tab="Under Review" key="under_review">
            <Table
              dataSource={queueData.filter(item => item.status === 'UNDER_REVIEW')}
              columns={columns}
              rowKey="clearanceId"
              loading={loading}
            />
          </TabPane>
          <TabPane tab="All" key="all">
            <Table
              dataSource={queueData}
              columns={columns}
              rowKey="clearanceId"
              loading={loading}
            />
          </TabPane>
        </Tabs>

        {/* Detail Modal */}
        <Modal
          title="Clearance Details"
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>
          ]}
          width={700}
        >
          {selectedClearance && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Reference Number">
                <code>{selectedClearance.referenceNumber}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Business Name">
                {selectedClearance.businessName}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedClearance.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {selectedClearance.submittedAt
                  ? new Date(selectedClearance.submittedAt).toLocaleString()
                  : '-'}
              </Descriptions.Item>
              {selectedClearance.queuePosition && (
                <Descriptions.Item label="Queue Position">
                  #{selectedClearance.queuePosition}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Review/Approve/Reject Modal */}
        <Modal
          title="Review Clearance"
          visible={reviewModalVisible}
          onCancel={() => {
            setReviewModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleApprove}>
            <Form.Item name="action" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="certificateNumber"
              label="Certificate Number"
              rules={[{ required: true, message: 'Please enter certificate number' }]}
            >
              <Input placeholder="e.g., CLR-2024-001" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={4} placeholder="Add any notes about this clearance..." />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                  Approve
                </Button>
                <Button danger onClick={() => form.submit(handleReject)} icon={<CloseOutlined />}>
                  Reject
                </Button>
                <Button onClick={() => {
                  setReviewModalVisible(false);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Deficiency Modal */}
        <Modal
          title="Raise Deficiency"
          visible={deficiencyModalVisible}
          onCancel={() => {
            setDeficiencyModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleRaiseDeficiency}>
            <Alert
              message="Raise Deficiency"
              description="Describe what needs to be corrected or provided by the applicant."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please describe the deficiency' }]}
            >
              <TextArea rows={4} placeholder="Describe what needs to be corrected..." />
            </Form.Item>
            <Form.Item name="requiredDocuments" label="Required Documents (comma separated)">
              <Input placeholder="e.g., Updated zoning plan, Fire safety certificate" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<WarningOutlined />}>
                  Raise Deficiency
                </Button>
                <Button onClick={() => {
                  setDeficiencyModalVisible(false);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </StaffLayout>
  );
};

export default AgencyDashboard;
