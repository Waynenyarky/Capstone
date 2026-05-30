import { useState, useEffect } from 'react';
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
  Switch,
  message,
  Tabs,
  List,
  Avatar,
  DatePicker,
  Collapse,
  Popconfirm,
  Drawer
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  SyncOutlined,
  FileSearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  ToolOutlined,
  ScheduleOutlined,
  GlobalOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { 
  getCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  toggleCronJob,
  runCronJob,
  getCronJobHistory,
  getCronJobStats,
  getCronJobLogs,
  CRON_JOB_TYPES,
  CRON_JOB_STATUSES,
  CRON_FREQUENCIES,
  getCronJobTypeLabel,
  getCronJobStatusLabel,
  getCronFrequencyLabel
} from '@/features/admin/services/cronJobService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const AutomatedCronJobDashboard = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cronJobs, setCronJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [editJobModalVisible, setEditJobModalVisible] = useState(false);
  const [logsDrawerVisible, setLogsDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [jobStats, setJobStats] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [jobLogs, setJobLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchCronJobs();
    fetchJobStats();
  }, []);

  const fetchCronJobs = async () => {
    setLoading(true);
    try {
      const jobsData = await getCronJobs();
      setCronJobs(jobsData?.jobs || []);
    } catch (error) {
      console.error('Failed to fetch cron jobs:', error);
      message.error('Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobStats = async () => {
    try {
      const statsData = await getCronJobStats();
      setJobStats(statsData);
    } catch (error) {
      console.error('Failed to fetch job stats:', error);
    }
  };

  const fetchJobHistory = async (jobId) => {
    try {
      const historyData = await getCronJobHistory(jobId);
      setJobHistory(historyData?.history || []);
    } catch (error) {
      console.error('Failed to fetch job history:', error);
    }
  };

  const fetchJobLogs = async (jobId) => {
    try {
      const logsData = await getCronJobLogs(jobId);
      setJobLogs(logsData?.logs || []);
    } catch (error) {
      console.error('Failed to fetch job logs:', error);
    }
  };

  const handleCreateJob = async (values) => {
    setSubmitting(true);
    try {
      await createCronJob(values);
      message.success('Cron job created successfully');
      setNewJobModalVisible(false);
      form.resetFields();
      fetchCronJobs();
      fetchJobStats();
    } catch (error) {
      message.error('Failed to create cron job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateJob = async (values) => {
    setSubmitting(true);
    try {
      await updateCronJob(selectedJob.id, values);
      message.success('Cron job updated successfully');
      setEditJobModalVisible(false);
      editForm.resetFields();
      fetchCronJobs();
      fetchJobStats();
    } catch (error) {
      message.error('Failed to update cron job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteCronJob(jobId);
      message.success('Cron job deleted successfully');
      fetchCronJobs();
      fetchJobStats();
    } catch (error) {
      message.error('Failed to delete cron job');
    }
  };

  const handleToggleJob = async (jobId, enabled) => {
    try {
      await toggleCronJob(jobId, enabled);
      message.success(`Cron job ${enabled ? 'enabled' : 'disabled'} successfully`);
      fetchCronJobs();
      fetchJobStats();
    } catch (error) {
      message.error('Failed to toggle cron job');
    }
  };

  const handleRunJob = async (jobId) => {
    try {
      await runCronJob(jobId);
      message.success('Cron job executed successfully');
      fetchCronJobs();
    } catch (error) {
      message.error('Failed to run cron job');
    }
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setDetailModalVisible(true);
    fetchJobHistory(job.id);
  };

  const handleViewLogs = (job) => {
    setSelectedJob(job);
    setLogsDrawerVisible(true);
    fetchJobLogs(job.id);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    editForm.setFieldsValue(job);
    setEditJobModalVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      [CRON_JOB_STATUSES.ACTIVE]: '#52c41a',
      [CRON_JOB_STATUSES.INACTIVE]: '#8c8c8c',
      [CRON_JOB_STATUSES.RUNNING]: '#1890ff',
      [CRON_JOB_STATUSES.FAILED]: '#f5222d',
      [CRON_JOB_STATUSES.COMPLETED]: '#52c41a'
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusIcon = (status) => {
    const icons = {
      [CRON_JOB_STATUSES.ACTIVE]: <CheckCircleOutlined />,
      [CRON_JOB_STATUSES.INACTIVE]: <PauseCircleOutlined />,
      [CRON_JOB_STATUSES.RUNNING]: <SyncOutlined spin />,
      [CRON_JOB_STATUSES.FAILED]: <CloseCircleOutlined />,
      [CRON_JOB_STATUSES.COMPLETED]: <CheckCircleOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const getTypeIcon = (type) => {
    const icons = {
      [CRON_JOB_TYPES.BACKUP]: <DatabaseOutlined />,
      [CRON_JOB_TYPES.CLEANUP]: <ToolOutlined />,
      [CRON_JOB_TYPES.NOTIFICATION]: <GlobalOutlined />,
      [CRON_JOB_TYPES.REPORT]: <BarChartOutlined />,
      [CRON_JOB_TYPES.SYNC]: <SyncOutlined />,
      [CRON_JOB_TYPES.MAINTENANCE]: <SettingOutlined />,
      [CRON_JOB_TYPES.MONITORING]: <MonitorOutlined />
    };
    return icons[type] || <ScheduleOutlined />;
  };

  const filteredJobs = cronJobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || job.status === filterStatus;
    const matchesType = !filterType || job.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const cronJobColumns = [
    {
      title: 'Job Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          {getTypeIcon(record.type)}
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue">{getCronJobTypeLabel(type)}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <div>
          <Badge 
            status={status === CRON_JOB_STATUSES.ACTIVE ? 'success' : 
                   status === CRON_JOB_STATUSES.RUNNING ? 'processing' : 
                   status === CRON_JOB_STATUSES.FAILED ? 'error' : 'default'} 
            text={getCronJobStatusLabel(status)}
          />
        </div>
      )
    },
    {
      title: 'Schedule',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (frequency) => (
        <Text type="secondary">{getCronFrequencyLabel(frequency)}</Text>
      )
    },
    {
      title: 'Last Run',
      dataIndex: 'lastRun',
      key: 'lastRun',
      render: (date) => (
        <Text type="secondary">
          {date ? new Date(date).toLocaleString() : 'Never'}
        </Text>
      )
    },
    {
      title: 'Next Run',
      dataIndex: 'nextRun',
      key: 'nextRun',
      render: (date) => (
        <Text type="secondary">
          {date ? new Date(date).toLocaleString() : 'N/A'}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="View Logs">
            <Button 
              size="small" 
              icon={<FileTextOutlined />}
              onClick={() => handleViewLogs(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditJob(record)}
            />
          </Tooltip>
          <Tooltip title="Run Now">
            <Button 
              size="small" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleRunJob(record.id)}
              disabled={record.status === CRON_JOB_STATUSES.RUNNING}
            />
          </Tooltip>
          <Tooltip title={record.status === CRON_JOB_STATUSES.ACTIVE ? 'Disable' : 'Enable'}>
            <Switch
              size="small"
              checked={record.status === CRON_JOB_STATUSES.ACTIVE}
              onChange={(checked) => handleToggleJob(record.id, checked)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this cron job?"
              onConfirm={() => handleDeleteJob(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                size="small" 
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  const calculateStats = () => {
    const total = cronJobs.length;
    const active = cronJobs.filter(j => j.status === CRON_JOB_STATUSES.ACTIVE).length;
    const inactive = cronJobs.filter(j => j.status === CRON_JOB_STATUSES.INACTIVE).length;
    const running = cronJobs.filter(j => j.status === CRON_JOB_STATUSES.RUNNING).length;
    const failed = cronJobs.filter(j => j.status === CRON_JOB_STATUSES.FAILED).length;
    
    return { total, active, inactive, running, failed };
  };

  return (
    <div className={`automated-cron-job-dashboard ${className || ''}`}>
      <Card
        title={
          <Space>
            <ScheduleOutlined />
            <span>Automated Cron Job Dashboard</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchCronJobs}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setNewJobModalVisible(true)}
            >
              New Job
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            <Title level={4}>Job Overview</Title>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Jobs"
                    value={calculateStats().total}
                    prefix={<ScheduleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Active"
                    value={calculateStats().active}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Running"
                    value={calculateStats().running}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<SyncOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Failed"
                    value={calculateStats().failed}
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Title level={4}>Job Management</Title>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<FileSearchOutlined />}
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Filter by status"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Select.Option value={CRON_JOB_STATUSES.ACTIVE}>Active</Select.Option>
                  <Select.Option value={CRON_JOB_STATUSES.INACTIVE}>Inactive</Select.Option>
                  <Select.Option value={CRON_JOB_STATUSES.RUNNING}>Running</Select.Option>
                  <Select.Option value={CRON_JOB_STATUSES.FAILED}>Failed</Select.Option>
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Filter by type"
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Select.Option value={CRON_JOB_TYPES.BACKUP}>Backup</Select.Option>
                  <Select.Option value={CRON_JOB_TYPES.CLEANUP}>Cleanup</Select.Option>
                  <Select.Option value={CRON_JOB_TYPES.NOTIFICATION}>Notification</Select.Option>
                  <Select.Option value={CRON_JOB_TYPES.REPORT}>Report</Select.Option>
                  <Select.Option value={CRON_JOB_TYPES.SYNC}>Sync</Select.Option>
                  <Select.Option value={CRON_JOB_TYPES.MAINTENANCE}>Maintenance</Select.Option>
                  <Select.Option value={CRON_JOB_TYPES.MONITORING}>Monitoring</Select.Option>
                </Select>
              </Col>
            </Row>

            {filteredJobs.length > 0 ? (
              <Table
                dataSource={filteredJobs}
                columns={cronJobColumns}
                rowKey="id"
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: filteredJobs.length,
                  onChange: setCurrentPage,
                  onShowSizeChange: (_, size) => setPageSize(size)
                }}
                size="small"
              />
            ) : (
              <Empty 
                description="No cron jobs found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </TabPane>

          <TabPane tab="Job Types" key="types">
            <JobTypesGuide />
          </TabPane>

          <TabPane tab="System Health" key="health">
            <SystemHealth />
          </TabPane>
        </Tabs>

        <Divider />

        <Title level={4}>Understanding Cron Jobs</Title>
        <Alert
          message="Cron Job Management Overview"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                Automated cron jobs handle scheduled system tasks:
              </Paragraph>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Job Types">
                    <Text type="secondary">
                      • Backup jobs for data protection<br/>
                      • Cleanup jobs for maintenance<br/>
                      • Notification jobs for alerts<br/>
                      • Report jobs for analytics
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Scheduling">
                    <Text type="secondary">
                      • Flexible cron expressions<br/>
                      • Multiple frequency options<br/>
                      • Manual execution support<br/>
                      • Real-time status tracking
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Monitoring">
                    <Text type="secondary">
                      • Execution history tracking<br/>
                      • Detailed logging system<br/>
                      • Performance metrics<br/>
                      • Error reporting
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

        <Alert
          message="Need Help with Cron Jobs?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you need assistance with cron jobs, our documentation is available.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Job Types Guide</Button>
                <Button type="link" size="small">Scheduling Help</Button>
                <Button type="link" size="small">Troubleshooting</Button>
                <Button type="link" size="small">API Documentation</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Job Detail Modal */}
      <Modal
        title="Job Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedJob && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Job Name" span={2}>
                {selectedJob.name}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{getCronJobTypeLabel(selectedJob.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedJob.status === CRON_JOB_STATUSES.ACTIVE ? 'success' : 'error'} 
                  text={getCronJobStatusLabel(selectedJob.status)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Schedule">
                {getCronFrequencyLabel(selectedJob.frequency)}
              </Descriptions.Item>
              <Descriptions.Item label="Last Run">
                {selectedJob.lastRun ? new Date(selectedJob.lastRun).toLocaleString() : 'Never'}
              </Descriptions.Item>
              <Descriptions.Item label="Next Run">
                {selectedJob.nextRun ? new Date(selectedJob.nextRun).toLocaleString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedJob.description}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>Execution History</Title>
              <Timeline>
                {jobHistory.slice(0, 5).map((history, index) => (
                  <Timeline.Item
                    key={index}
                    color={history.status === 'success' ? 'green' : 'red'}
                  >
                    <Text strong>{new Date(history.timestamp).toLocaleString()}</Text>
                    <div>
                      <Text type="secondary">
                        Status: {history.status} | Duration: {history.duration}ms
                      </Text>
                    </div>
                    {history.message && (
                      <div>
                        <Text type="secondary">{history.message}</Text>
                      </div>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>

      {/* New Job Modal */}
      <Modal
        title="Create New Cron Job"
        open={newJobModalVisible}
        onCancel={() => setNewJobModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setNewJobModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Create Job
          </Button>
        ]}
        width={600}
      >
        <Form form={form} onFinish={handleCreateJob} layout="vertical">
          <Form.Item 
            name="name"
            label="Job Name"
            rules={[{ required: true, message: 'Please enter job name' }]}
          >
            <Input placeholder="Enter job name" />
          </Form.Item>
          
          <Form.Item 
            name="type"
            label="Job Type"
            rules={[{ required: true, message: 'Please select job type' }]}
          >
            <Select placeholder="Select job type">
              <Select.Option value={CRON_JOB_TYPES.BACKUP}>Backup</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.CLEANUP}>Cleanup</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.NOTIFICATION}>Notification</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.REPORT}>Report</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.SYNC}>Sync</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.MAINTENANCE}>Maintenance</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.MONITORING}>Monitoring</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="frequency"
            label="Schedule Frequency"
            rules={[{ required: true, message: 'Please select frequency' }]}
          >
            <Select placeholder="Select frequency">
              <Select.Option value={CRON_FREQUENCIES.EVERY_MINUTE}>Every Minute</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_5_MINUTES}>Every 5 Minutes</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_15_MINUTES}>Every 15 Minutes</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_30_MINUTES}>Every 30 Minutes</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.HOURLY}>Hourly</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_2_HOURS}>Every 2 Hours</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_6_HOURS}>Every 6 Hours</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.DAILY}>Daily</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.WEEKLY}>Weekly</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.MONTHLY}>Monthly</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.YEARLY}>Yearly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter job description" />
          </Form.Item>

          <Form.Item 
            name="command"
            label="Command/Script"
            rules={[{ required: true, message: 'Please enter command or script' }]}
          >
            <TextArea rows={4} placeholder="Enter command or script to execute" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        title="Edit Cron Job"
        open={editJobModalVisible}
        onCancel={() => setEditJobModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditJobModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            onClick={() => editForm.submit()}
            loading={submitting}
          >
            Update Job
          </Button>
        ]}
        width={600}
      >
        <Form form={editForm} onFinish={handleUpdateJob} layout="vertical">
          <Form.Item 
            name="name"
            label="Job Name"
            rules={[{ required: true, message: 'Please enter job name' }]}
          >
            <Input placeholder="Enter job name" />
          </Form.Item>
          
          <Form.Item 
            name="type"
            label="Job Type"
            rules={[{ required: true, message: 'Please select job type' }]}
          >
            <Select placeholder="Select job type">
              <Select.Option value={CRON_JOB_TYPES.BACKUP}>Backup</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.CLEANUP}>Cleanup</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.NOTIFICATION}>Notification</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.REPORT}>Report</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.SYNC}>Sync</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.MAINTENANCE}>Maintenance</Select.Option>
              <Select.Option value={CRON_JOB_TYPES.MONITORING}>Monitoring</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="frequency"
            label="Schedule Frequency"
            rules={[{ required: true, message: 'Please select frequency' }]}
          >
            <Select placeholder="Select frequency">
              <Select.Option value={CRON_FREQUENCIES.EVERY_MINUTE}>Every Minute</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_5_MINUTES}>Every 5 Minutes</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_15_MINUTES}>Every 15 Minutes</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_30_MINUTES}>Every 30 Minutes</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.HOURLY}>Hourly</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_2_HOURS}>Every 2 Hours</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.EVERY_6_HOURS}>Every 6 Hours</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.DAILY}>Daily</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.WEEKLY}>Weekly</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.MONTHLY}>Monthly</Select.Option>
              <Select.Option value={CRON_FREQUENCIES.YEARLY}>Yearly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter job description" />
          </Form.Item>

          <Form.Item 
            name="command"
            label="Command/Script"
            rules={[{ required: true, message: 'Please enter command or script' }]}
          >
            <TextArea rows={4} placeholder="Enter command or script to execute" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Logs Drawer */}
      <Drawer
        title={`Job Logs - ${selectedJob?.name}`}
        placement="right"
        onClose={() => setLogsDrawerVisible(false)}
        open={logsDrawerVisible}
        width={800}
      >
        <List
          dataSource={jobLogs}
          renderItem={(log) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={
                  <Space>
                    <Text>{new Date(log.timestamp).toLocaleString()}</Text>
                    <Tag color={log.level === 'error' ? 'red' : log.level === 'warning' ? 'orange' : 'blue'}>
                      {log.level}
                    </Tag>
                  </Space>
                }
                description={log.message}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

// Job Types Guide Component
const JobTypesGuide = () => {
  return (
    <div>
      <Title level={4}>Cron Job Types Guide</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Backup Jobs" size="small">
            <Space direction="vertical">
              <Text strong>Database Backups</Text>
              <Text type="secondary">Automated database backups with compression</Text>
              <Text strong>File System Backups</Text>
              <Text type="secondary">Complete file system snapshots</Text>
              <Text strong>Configuration Backups</Text>
              <Text type="secondary">System configuration preservation</Text>
            </Space>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Cleanup Jobs" size="small">
            <Space direction="vertical">
              <Text strong>Log Cleanup</Text>
              <Text type="secondary">Remove old log files automatically</Text>
              <Text strong>Cache Cleanup</Text>
              <Text type="secondary">Clear temporary files and cache</Text>
              <Text strong>Session Cleanup</Text>
              <Text type="secondary">Remove expired user sessions</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Notification Jobs" size="small">
            <Space direction="vertical">
              <Text strong>Email Notifications</Text>
              <Text type="secondary">Send scheduled email alerts</Text>
              <Text strong>System Alerts</Text>
              <Text type="secondary">Monitor and alert on system issues</Text>
              <Text strong>Report Generation</Text>
              <Text type="secondary">Generate and distribute reports</Text>
            </Space>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Maintenance Jobs" size="small">
            <Space direction="vertical">
              <Text strong>System Updates</Text>
              <Text type="secondary">Apply system patches and updates</Text>
              <Text strong>Performance Optimization</Text>
              <Text type="secondary">Optimize database and system performance</Text>
              <Text strong>Security Scans</Text>
              <Text type="secondary">Run security vulnerability scans</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Scheduling Best Practices" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Title level={5}>Frequency Guidelines</Title>
            <ul>
              <li>Backup jobs: Daily or weekly</li>
              <li>Cleanup jobs: Daily or hourly</li>
              <li>Notifications: As needed</li>
              <li>Reports: Weekly or monthly</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Performance Considerations</Title>
            <ul>
              <li>Avoid peak hours for heavy jobs</li>
              <li>Monitor resource usage</li>
              <li>Set appropriate timeouts</li>
              <li>Implement error handling</li>
            </ul>
          </Col>
          <Col span={8}>
            <Title level={5}>Security Best Practices</Title>
            <ul>
              <li>Limit job permissions</li>
              <li>Validate input parameters</li>
              <li>Secure sensitive data</li>
              <li>Audit job executions</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

// System Health Component
const SystemHealth = () => {
  return (
    <div>
      <Title level={4}>System Health Monitoring</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="Job Execution Status" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Success Rate</Text>
                <Text strong style={{ color: '#52c41a' }}>98.5%</Text>
              </div>
              <Progress percent={98.5} status="success" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Average Duration</Text>
                <Text strong>2.3s</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Total Executions</Text>
                <Text strong>1,247</Text>
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="Resource Usage" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>CPU Usage</Text>
                <Text strong style={{ color: '#1890ff' }}>45%</Text>
              </div>
              <Progress percent={45} status="active" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Memory Usage</Text>
                <Text strong style={{ color: '#faad14' }}>67%</Text>
              </div>
              <Progress percent={67} status="active" />
            </Space>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="System Metrics" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Uptime</Text>
                <Text strong>99.9%</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Response Time</Text>
                <Text strong>120ms</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Error Rate</Text>
                <Text strong style={{ color: '#52c41a' }}>0.1%</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Recent System Events" size="small">
        <Timeline>
          <Timeline.Item color="green">
            <Text strong>Backup Completed</Text>
            <div>
              <Text type="secondary">Database backup completed successfully - 2 minutes ago</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item color="blue">
            <Text strong>Cleanup Executed</Text>
            <div>
              <Text type="secondary">Log cleanup job executed - 15 minutes ago</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item color="orange">
            <Text strong>High Memory Usage</Text>
            <div>
              <Text type="secondary">Memory usage exceeded threshold - 1 hour ago</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item color="green">
            <Text strong>Report Generated</Text>
            <div>
              <Text type="secondary">Weekly analytics report generated - 2 hours ago</Text>
            </div>
          </Timeline.Item>
        </Timeline>
      </Card>
    </div>
  );
};

export default AutomatedCronJobDashboard;
