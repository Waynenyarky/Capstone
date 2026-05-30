import { useState, useEffect } from 'react';
import { Card, Table, Button, Alert, Tag, Modal, Descriptions, Space, Typography, message } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getBusinessConflicts, resolveConflict } from '../../services/businessConflictService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const BusinessConflictResolver = () => {
  const { businesses } = useBusiness();
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);

  useEffect(() => {
    const fetchConflicts = async () => {
      setLoading(true);
      try {
        const conflictData = await getBusinessConflicts(businesses.map(b => b.id));
        setConflicts(conflictData?.conflicts || []);
      } catch (error) {
        message.error('Failed to fetch business conflicts.');
      } finally {
        setLoading(false);
      }
    };
    if (businesses.length > 1) {
      fetchConflicts();
    }
  }, [businesses]);

  const handleResolveConflict = async (conflictId, resolution) => {
    try {
      await resolveConflict(conflictId, resolution);
      message.success('Conflict resolved successfully.');
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      setResolutionModalVisible(false);
      setSelectedConflict(null);
    } catch (error) {
      message.error('Failed to resolve conflict.');
    }
  };

  const getConflictTypeColor = (type) => {
    const colors = {
      'Overlapping Address': 'red',
      'Similar Name': 'orange',
      'Shared Contact': 'gold',
      'Duplicate Registration': 'volcano',
      'Payment Conflict': 'purple'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Conflict Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={getConflictTypeColor(type)}>{type}</Tag>,
    },
    {
      title: 'Businesses Involved',
      key: 'businesses',
      render: (_, record) => (
        <Space>
          <Text strong>{record.business1.name}</Text>
          <Text>vs</Text>
          <Text strong>{record.business2.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => <Tag color={severity === 'High' ? 'red' : severity === 'Medium' ? 'orange' : 'green'}>{severity}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" onClick={() => { setSelectedConflict(record); setResolutionModalVisible(true); }}>
          Resolve
        </Button>
      ),
    },
  ];

  return (
    <Card loading={loading} title="Business Conflict Resolver">
      {businesses.length <= 1 ? (
        <Alert
          message="No Conflicts"
          description="You need at least two businesses to have potential conflicts."
          type="info"
          showIcon
        />
      ) : conflicts.length === 0 ? (
        <Alert
          message="No Conflicts Detected"
          description="Your businesses do not have any known conflicts."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      ) : (
        <>
          <Alert
            message="Conflicts Detected"
            description={`We found ${conflicts.length} potential conflict(s) that need your attention.`}
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
          <Table dataSource={conflicts} columns={columns} rowKey="id" />
        </>
      )}
      <Modal
        title={`Resolve Conflict: ${selectedConflict?.type}`}
        visible={resolutionModalVisible}
        onCancel={() => setResolutionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setResolutionModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="auto-resolve" type="primary" onClick={() => handleResolveConflict(selectedConflict?.id, 'auto')}>
            Auto-Resolve
          </Button>,
        ]}
      >
        {selectedConflict && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Business 1">{selectedConflict.business1.name}</Descriptions.Item>
            <Descriptions.Item label="Business 2">{selectedConflict.business2.name}</Descriptions.Item>
            <Descriptions.Item label="Conflict Type">{selectedConflict.type}</Descriptions.Item>
            <Descriptions.Item label="Description">{selectedConflict.description}</Descriptions.Item>
            <Descriptions.Item label="Suggested Resolution">{selectedConflict.suggestion}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default BusinessConflictResolver;
