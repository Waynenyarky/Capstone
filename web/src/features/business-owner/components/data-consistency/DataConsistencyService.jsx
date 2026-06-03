import { useState, useEffect } from 'react';
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import {
  Card,
  Table,
  Button,
  Alert,
  Space,
  Typography,
  Divider,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Empty,
  Badge,
  Form,
  Select,
  message,
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CloudSyncOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';
import { 
  statusReconciliationService
} from '@/features/business-owner/services/statusReconciliationService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const DataConsistencyService = ({ businessId, className }) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [consistencyData, setConsistencyData] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [systemStatuses, setSystemStatuses] = useState({});
  const [syncHistory, setSyncHistory] = useState([]);
  const [form] = Form.useForm();
  
  const { getBusinessProfile } = useBusiness();

  useEffect(() => {
    fetchConsistencyData();
  }, [businessId]);

  const fetchConsistencyData = async () => {
    setLoading(true);
    try {
      // Simulate fetching consistency data
      const mockData = {
        totalBusinesses: 150,
        consistentBusinesses: 120,
        inconsistentBusinesses: 30,
        lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        systemHealth: {
          businessRegistry: 'healthy',
          permitSystem: 'healthy',
          paymentSystem: 'warning',
          notificationSystem: 'healthy'
        },
        conflicts: [
          {
            businessId: 'BIZ-001',
            businessName: 'ABC Restaurant',
            conflicts: [
              {
                system: 'businessRegistry',
                status: 'active',
                unifiedStatus: 'active'
              },
              {
                system: 'permitSystem',
                status: 'expired',
                unifiedStatus: 'expired'
              }
            ],
            severity: 'high',
            lastDetected: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          {
            businessId: 'BIZ-002',
            businessName: 'XYZ Store',
            conflicts: [
              {
                system: 'businessRegistry',
                status: 'approved',
                unifiedStatus: 'approved'
              },
              {
                system: 'paymentSystem',
                status: 'pending',
                unifiedStatus: 'submitted'
              }
            ],
            severity: 'medium',
            lastDetected: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          }
        ]
      };
      
      setConsistencyData(mockData);
      setSyncHistory([
        {
          id: 'sync-001',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'automatic',
          status: 'completed',
          businessesProcessed: 150,
          conflictsResolved: 25,
          duration: '3m 24s'
        },
        {
          id: 'sync-002',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: 'manual',
          status: 'completed',
          businessesProcessed: 148,
          conflictsResolved: 30,
          duration: '4m 12s'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch consistency data:', error);
      message.error('Failed to load consistency data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      message.success('Data synchronization completed successfully');
      fetchConsistencyData(); // Refresh data
      setSyncModalVisible(false);
    } catch (error) {
      message.error('Failed to synchronize data');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (business) => {
    setSelectedBusiness(business);
    setDetailModalVisible(true);
    
    // Fetch detailed system statuses for this business
    const mockSystemStatuses = {
      businessRegistry: {
        status: 'active',
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        dataIntegrity: 'good',
        recordCount: 1247
      },
      permitSystem: {
        status: 'expired',
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dataIntegrity: 'warning',
        recordCount: 89
      },
      paymentSystem: {
        status: 'current',
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        dataIntegrity: 'good',
        recordCount: 456
      },
      notificationSystem: {
        status: 'active',
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        dataIntegrity: 'good',
        recordCount: 234
      }
    };
    
    setSystemStatuses(mockSystemStatuses);
  };

  const getSystemHealthColor = (health) => {
    const colors = {
      healthy: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      offline: '#d9d9d9'
    };
    return colors[health] || '#d9d9d9';
  };

  const getSystemHealthIcon = (health) => {
    const icons = {
      healthy: <CheckCircleOutlined />,
      warning: <WarningOutlined />,
      error: <ExclamationCircleOutlined />,
      offline: <ClockCircleOutlined />
    };
    return icons[health] || <ClockCircleOutlined />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      high: '#f5222d',
      medium: '#faad14',
      low: '#52c41a'
    };
    return colors[severity] || '#d9d9d9';
  };

  const getUnifiedStatusConfig = (status) => {
    return statusReconciliationService.getStatusConfig(status);
  };

  const conflictColumns = [
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.businessId}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Conflicts',
      dataIndex: 'conflicts',
      key: 'conflicts',
      render: (conflicts) => (
        <div>
          {conflicts.map((conflict, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              <Tag color={getUnifiedStatusConfig(conflict.unifiedStatus).color}>
                {conflict.system}: {conflict.status}
              </Tag>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Last Detected',
      dataIndex: 'lastDetected',
      key: 'lastDetected',
      render: (date) => (
        <Text type="secondary">
          {new Date(date).toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
          <Button 
            size="small" 
            icon={<SyncOutlined />}
            onClick={() => handleBusinessSync(record)}
          >
            Sync
          </Button>
        </Space>
      )
    }
  ];

  const syncHistoryColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => (
        <Text type="secondary">
          {new Date(date).toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'automatic' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'completed' ? 'success' : 'processing'} 
          text={status}
        />
      )
    },
    {
      title: 'Businesses Processed',
      dataIndex: 'businessesProcessed',
      key: 'businessesProcessed'
    },
    {
      title: 'Conflicts Resolved',
      dataIndex: 'conflictsResolved',
      key: 'conflictsResolved'
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration'
    }
  ];

  const handleBusinessSync = async (business) => {
    try {
      message.loading(`Synchronizing ${business.businessName}...`, 0);
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.destroy();
      message.success(`${business.businessName} synchronized successfully`);
      fetchConsistencyData();
    } catch (error) {
      message.destroy();
      message.error(`Failed to synchronize ${business.businessName}`);
    }
  };

  const calculateConsistencyScore = () => {
    if (!consistencyData) return 0;
    return Math.round((consistencyData.consistentBusinesses / consistencyData.totalBusinesses) * 100);
  };

  return (
    <div className={`data-consistency-service ${className || ''}`}>
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>Data Consistency Service</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchConsistencyData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<CloudSyncOutlined />}
              onClick={() => setSyncModalVisible(true)}
            >
              Manual Sync
            </Button>
          </Space>
        }
        loading={loading}
      >
        {/* System Health Overview */}
        <Title level={4}>System Health</Title>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Consistency Score"
                value={calculateConsistencyScore()}
                suffix="%"
                valueStyle={{ 
                  color: calculateConsistencyScore() > 90 ? '#52c41a' : 
                         calculateConsistencyScore() > 70 ? '#faad14' : '#f5222d' 
                }}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Businesses"
                value={consistencyData?.totalBusinesses || 0}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Consistent"
                value={consistencyData?.consistentBusinesses || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Conflicts"
                value={consistencyData?.inconsistentBusinesses || 0}
                valueStyle={{ color: '#f5222d' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* System Status */}
        <Title level={4}>System Status</Title>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {Object.entries(consistencyData?.systemHealth || {}).map(([system, health]) => (
            <Col span={6} key={system}>
              <Card size="small">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong style={{ textTransform: 'capitalize' }}>
                      {system.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {health}
                      </Text>
                    </div>
                  </div>
                  <div style={{ color: getSystemHealthColor(health) }}>
                    {getSystemHealthIcon(health)}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Active Conflicts */}
        <Title level={4}>Active Conflicts</Title>
        {consistencyData?.conflicts?.length > 0 ? (
          <Table
            dataSource={consistencyData.conflicts}
            columns={conflictColumns}
            rowKey="businessId"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty 
            description="No data conflicts detected"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        <Divider />

        {/* Sync History */}
        <Title level={4}>Synchronization History</Title>
        <Table
          dataSource={syncHistory}
          columns={syncHistoryColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />

        <Divider />

        {/* Information Section */}
        <Title level={4}>About Data Consistency</Title>
        <Alert
          message="Cross-System Synchronization"
          description={
            <div>
              <Paragraph style={{ marginBottom: 12 }}>
                The Data Consistency Service ensures that business information remains synchronized across all systems:
              </Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="Business Registry">
                    <Text type="secondary">
                      • Master business records<br/>
                      • Registration status<br/>
                      • Basic business information<br/>
                      • Ownership details
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Permit System">
                    <Text type="secondary">
                      • Business permits<br/>
                      • License status<br/>
                      • Inspection records<br/>
                      • Compliance status
                    </Text>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="Payment System">
                    <Text type="secondary">
                      • Fee payments<br/>
                      • Transaction records<br/>
                      • Payment status<br/>
                      • Billing history
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
          message="Need Help with Data Consistency?"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 8 }}>
                If you encounter data inconsistencies or need assistance with synchronization, our team is here to help.
              </Paragraph>
              <Space>
                <Button type="link" size="small">Sync Guide</Button>
                <Button type="link" size="small">Troubleshooting</Button>
                <Button type="link" size="small">Contact Support</Button>
                <Button type="link" size="small">API Documentation</Button>
              </Space>
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Business Detail Modal */}
      <Modal
        title="Business System Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="sync" 
            type="primary"
            icon={<SyncOutlined />}
            onClick={() => selectedBusiness && handleBusinessSync(selectedBusiness)}
          >
            Sync Business
          </Button>
        ]}
        width={800}
      >
        {selectedBusiness && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Business ID" span={2}>
                {selectedBusiness.businessId}
              </Descriptions.Item>
              <Descriptions.Item label="Business Name" span={2}>
                {selectedBusiness.businessName}
              </Descriptions.Item>
              <Descriptions.Item label="Last Detected" span={2}>
                {new Date(selectedBusiness.lastDetected).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5}>System Statuses</Title>
              {Object.entries(systemStatuses).map(([system, status]) => (
                <Card key={system} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ textTransform: 'capitalize' }}>
                        {system.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <div>
                        <Tag color={getUnifiedStatusConfig(status.status).color}>
                          {status.status}
                        </Tag>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          Last updated: {new Date(status.lastUpdated).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">
                        {status.recordCount} records
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Sync Modal */}
      <Modal
        title="Manual Data Synchronization"
        open={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSyncModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="sync" 
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleManualSync}
            loading={syncing}
          >
            Start Synchronization
          </Button>
        ]}
      >
        <div>
          <Alert
            message="Synchronization Process"
            description="This will synchronize all business data across all connected systems to resolve conflicts and ensure consistency."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form form={form} layout="vertical">
            <Form.Item label="Sync Scope">
              <Select defaultValue="all">
                <Option value="all">All Businesses</Option>
                <Option value="conflicts">Only Businesses with Conflicts</Option>
                <Option value="recent">Recently Updated Businesses</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Sync Strategy">
              <Select defaultValue="auto">
                <Option value="auto">Automatic Resolution</Option>
                <Option value="manual">Manual Review Required</Option>
                <Option value="preserve">Preserve Existing Data</Option>
              </Select>
            </Form.Item>
          </Form>
          
          {syncing && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <LottieSpinner size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>Synchronizing data across systems...</Text>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DataConsistencyService;
