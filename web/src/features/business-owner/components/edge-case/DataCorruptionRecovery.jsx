import { useState, useEffect } from 'react';
import { Card, List, Button, Alert, Modal, Form, Input, Select, Space, Typography, message } from 'antd';
import { ExclamationCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { getDataCorruptionEvents, restoreBackup, validateIntegrity } from '../../services/dataRecoveryService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Option } = Select;

const DataCorruptionRecovery = () => {
  const { business } = useBusiness();
  const [corruptionEvents, setCorruptionEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (business?.id) {
      const fetchCorruptionEvents = async () => {
        setLoading(true);
        try {
          const events = await getDataCorruptionEvents(business.id);
          setCorruptionEvents(events?.events || []);
        } catch (error) {
          message.error('Failed to fetch corruption events.');
        } finally {
          setLoading(false);
        }
      };
      fetchCorruptionEvents();
    }
  }, [business]);

  const handleValidateIntegrity = async () => {
    setValidating(true);
    try {
      const result = await validateIntegrity(business.id);
      if (result.valid) {
        message.success('Data integrity is valid.');
      } else {
        message.warning('Data integrity issues found. Please review the recovery options.');
      }
    } catch (error) {
      message.error('Failed to validate data integrity.');
    } finally {
      setValidating(false);
    }
  };

  const handleRestoreBackup = async (values) => {
    setRestoring(selectedEvent.id);
    try {
      await restoreBackup(selectedEvent.id, values);
      message.success('Data restored successfully from backup.');
      setRecoveryModalVisible(false);
      setSelectedEvent(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to restore data from backup.');
    } finally {
      setRestoring(null);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red',
      'Critical': 'purple'
    };
    return colors[severity] || 'default';
  };

  return (
    <Card loading={loading} title="Data Corruption Recovery">
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<SafetyOutlined />} loading={validating} onClick={handleValidateIntegrity}>
          Validate Data Integrity
        </Button>
      </Space>
      {corruptionEvents.length === 0 ? (
        <Alert
          message="No Corruption Events"
          description="Your data integrity is sound with no detected corruption events."
          type="success"
          showIcon
        />
      ) : (
        <>
          <Alert
            message="Corruption Events Detected"
            description={`We found ${corruptionEvents.length} corruption event(s) that may require recovery.`}
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
          <List
            itemLayout="vertical"
            dataSource={corruptionEvents}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    key="restore"
                    type="primary"
                    onClick={() => { setSelectedEvent(item); setRecoveryModalVisible(true); }}
                    loading={restoring === item.id}
                  >
                    Restore
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<ExclamationCircleOutlined style={{ fontSize: '24px', color: 'red' }} />}
                  title={
                    <Space>
                      <Text strong>{item.type}</Text>
                      <Tag color={getSeverityColor(item.severity)}>{item.severity}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{item.description}</Text>
                      <br />
                      <Text type="secondary">Detected: {item.detectedAt}</Text>
                      <br />
                      <Text type="secondary">Affected Data: {item.affectedData}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
      <Modal
        title={`Restore Data for ${selectedEvent?.type}`}
        visible={recoveryModalVisible}
        onCancel={() => setRecoveryModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleRestoreBackup} layout="vertical">
          <Form.Item name="backupPoint" label="Select Backup Point" rules={[{ required: true, message: 'Please select a backup point' }]}>
            <Select placeholder="Select a backup point">
              <Option value="latest">Latest Backup</Option>
              <Option value="24h">24 Hours Ago</Option>
              <Option value="7d">7 Days Ago</Option>
              <Option value="30d">30 Days Ago</Option>
            </Select>
          </Form.Item>
          <Form.Item name="confirmation" label="Confirmation" rules={[{ required: true, message: 'Please type CONFIRM to proceed' }]}>
            <Input placeholder="Type CONFIRM to proceed with restoration" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={restoring}>
                Restore Data
              </Button>
              <Button onClick={() => setRecoveryModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DataCorruptionRecovery;
