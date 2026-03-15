import React, { useState, useEffect } from 'react';
import { Card, List, Button, Alert, Tag, Modal, Progress, Space, Typography, message } from 'antd';
import { SyncOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getConcurrentActions, cancelAction } from '../../services/concurrentActionService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const ConcurrentActionManager = () => {
  const { business } = useBusiness();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (business?.id) {
      const fetchActions = async () => {
        setLoading(true);
        try {
          const actionData = await getConcurrentActions(business.id);
          setActions(actionData?.actions || []);
        } catch (error) {
          message.error('Failed to fetch concurrent actions.');
        } finally {
          setLoading(false);
        }
      };
      fetchActions();
    }
  }, [business]);

  const handleCancelAction = async (actionId) => {
    setCancelling(actionId);
    try {
      await cancelAction(actionId);
      message.success('Action cancelled successfully.');
      setActions(prev => prev.filter(a => a.id !== actionId));
    } catch (error) {
      message.error('Failed to cancel action.');
    } finally {
      setCancelling(null);
    }
  };

  const getActionStatusColor = (status) => {
    const colors = {
      'Pending': 'processing',
      'In Progress': 'active',
      'Completed': 'success',
      'Failed': 'exception',
      'Conflict': 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Card loading={loading} title="Concurrent Action Manager">
      {actions.length === 0 ? (
        <Alert
          message="No Concurrent Actions"
          description="You have no actions running in parallel."
          type="info"
          showIcon
        />
      ) : (
        <>
          <Alert
            message="Active Actions Detected"
            description="You have multiple actions running. Be aware of potential conflicts."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
          <List
            itemLayout="vertical"
            dataSource={actions}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    key="cancel"
                    danger
                    loading={cancelling === item.id}
                    onClick={() => handleCancelAction(item.id)}
                    disabled={item.status === 'Completed' || item.status === 'Failed'}
                  >
                    Cancel
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<SyncOutlined spin={item.status === 'In Progress'} style={{ fontSize: '24px' }} />}
                  title={
                    <Space>
                      <Text strong>{item.type}</Text>
                      <Tag color={getActionStatusColor(item.status)}>{item.status}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{item.description}</Text>
                      <br />
                      <Text type="secondary">Started: {item.startTime}</Text>
                      {item.progress && (
                        <Progress percent={item.progress} status={getActionStatusColor(item.status)} style={{ marginTop: 8 }} />
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Card>
  );
};

export default ConcurrentActionManager;
