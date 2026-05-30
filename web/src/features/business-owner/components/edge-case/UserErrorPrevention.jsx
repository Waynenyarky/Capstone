import { useState, useEffect } from 'react';
import { Card, List, Button, Alert, Modal, Form, Input, Checkbox, Space, Typography, message, Tooltip } from 'antd';
import { QuestionCircleOutlined, ExclamationCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { getUserErrorPatterns, preventError, undoAction } from '../../services/userErrorService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const UserErrorPrevention = () => {
  const { business } = useBusiness();
  const [errorPatterns, setErrorPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preventionModalVisible, setPreventionModalVisible] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (business?.id) {
      const fetchErrorPatterns = async () => {
        setLoading(true);
        try {
          const patterns = await getUserErrorPatterns(business.id);
          setErrorPatterns(patterns?.patterns || []);
        } catch (error) {
          message.error('Failed to fetch user error patterns.');
        } finally {
          setLoading(false);
        }
      };
      fetchErrorPatterns();
    }
  }, [business]);

  const handlePreventError = async (values) => {
    try {
      await preventError(selectedPattern.id, values);
      message.success('Error prevention settings updated.');
      setPreventionModalVisible(false);
      setSelectedPattern(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update error prevention settings.');
    }
  };

  const handleUndoAction = async (actionId) => {
    try {
      await undoAction(actionId);
      message.success('Action undone successfully.');
    } catch (error) {
      message.error('Failed to undo action.');
    }
  };

  const getPatternTypeColor = (type) => {
    const colors = {
      'Data Entry': 'blue',
      'Navigation': 'green',
      'Submission': 'orange',
      'Deletion': 'red',
      'Payment': 'purple'
    };
    return colors[type] || 'default';
  };

  return (
    <Card loading={loading} title="User Error Prevention">
      {errorPatterns.length === 0 ? (
        <Alert
          message="No Error Patterns"
          description="No common user errors have been detected for your business."
          type="info"
          showIcon
        />
      ) : (
        <>
          <Alert
            message="Error Patterns Detected"
            description="We've identified some common error patterns. Enable prevention to avoid mistakes."
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
          <List
            itemLayout="vertical"
            dataSource={errorPatterns}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    key="configure"
                    type="primary"
                    onClick={() => { setSelectedPattern(item); setPreventionModalVisible(true); }}
                  >
                    Configure
                  </Button>,
                  item.lastAction && (
                    <Tooltip title="Undo last action">
                      <Button icon={<UndoOutlined />} onClick={() => handleUndoAction(item.lastAction.id)}>
                        Undo
                      </Button>
                    </Tooltip>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={<QuestionCircleOutlined style={{ fontSize: '24px', color: getPatternTypeColor(item.type) }} />}
                  title={
                    <Space>
                      <Text strong>{item.type}</Text>
                      <Tag color={getPatternTypeColor(item.type)}>{item.frequency}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{item.description}</Text>
                      <br />
                      <Text type="secondary">Last Occurred: {item.lastOccurred}</Text>
                      {item.suggestion && (
                        <div>
                          <br />
                          <Text type="secondary">Suggestion: {item.suggestion}</Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
      <Modal
        title={`Configure Prevention for ${selectedPattern?.type}`}
        visible={preventionModalVisible}
        onCancel={() => setPreventionModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handlePreventError} layout="vertical">
          <Form.Item name="enableConfirmation" valuePropName="checked">
            <Checkbox>Enable confirmation dialog for this action</Checkbox>
          </Form.Item>
          <Form.Item name="enableWarning" valuePropName="checked">
            <Checkbox>Show warning before performing this action</Checkbox>
          </Form.Item>
          <Form.Item name="enableUndo" valuePropName="checked">
            <Checkbox>Enable undo functionality for this action</Checkbox>
          </Form.Item>
          <Form.Item name="customMessage" label="Custom Warning Message">
            <Input.TextArea rows={3} placeholder="Enter a custom warning message for this action" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Save Settings</Button>
              <Button onClick={() => setPreventionModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserErrorPrevention;
