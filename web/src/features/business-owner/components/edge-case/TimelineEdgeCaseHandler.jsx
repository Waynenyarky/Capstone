import React, { useState, useEffect } from 'react';
import { Card, List, Button, Alert, DatePicker, Modal, Form, Input, Select, Space, Typography, message } from 'antd';
import { CalendarOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getTimelineEdgeCases, submitExtensionRequest } from '../../services/timelineService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Option } = Select;

const TimelineEdgeCaseHandler = () => {
  const { business } = useBusiness();
  const [edgeCases, setEdgeCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extensionModalVisible, setExtensionModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (business?.id) {
      const fetchEdgeCases = async () => {
        setLoading(true);
        try {
          const cases = await getTimelineEdgeCases(business.id);
          setEdgeCases(cases?.edgeCases || []);
        } catch (error) {
          message.error('Failed to fetch timeline edge cases.');
        } finally {
          setLoading(false);
        }
      };
      fetchEdgeCases();
    }
  }, [business]);

  const handleExtensionRequest = async (values) => {
    try {
      await submitExtensionRequest(selectedCase.id, values);
      message.success('Extension request submitted successfully.');
      setExtensionModalVisible(false);
      setSelectedCase(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit extension request.');
    }
  };

  const getCaseTypeColor = (type) => {
    const colors = {
      'Holiday Deadline': 'blue',
      'Weekend Payment': 'green',
      'Business Closure': 'orange',
      'Emergency': 'red',
      'Grace Period': 'purple'
    };
    return colors[type] || 'default';
  };

  return (
    <Card loading={loading} title="Timeline Edge Case Handler">
      {edgeCases.length === 0 ? (
        <Alert
          message="No Edge Cases"
          description="You have no special timing scenarios that require attention."
          type="info"
          showIcon
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={edgeCases}
          renderItem={item => (
            <List.Item
              actions={[
                <Button type="primary" onClick={() => { setSelectedCase(item); setExtensionModalVisible(true); }}>
                  Request Extension
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<CalendarOutlined style={{ fontSize: '24px', color: getCaseTypeColor(item.type) }} />}
                title={
                  <Space>
                    <Text strong>{item.type}</Text>
                    <Tag color={getCaseTypeColor(item.type)}>{item.severity}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text>{item.description}</Text>
                    <br />
                    <Text type="secondary">Original Deadline: {item.originalDeadline}</Text>
                    <br />
                    <Text type="secondary">Grace Period Ends: {item.gracePeriodEnds}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      <Modal
        title={`Request Extension for ${selectedCase?.type}`}
        visible={extensionModalVisible}
        onCancel={() => setExtensionModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleExtensionRequest} layout="vertical">
          <Form.Item name="reason" label="Reason for Extension" rules={[{ required: true, message: 'Please enter a reason' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="extensionDuration" label="Extension Duration" rules={[{ required: true, message: 'Please select a duration' }]}>
            <Select placeholder="Select duration">
              <Option value="7">7 Days</Option>
              <Option value="14">14 Days</Option>
              <Option value="30">30 Days</Option>
            </Select>
          </Form.Item>
          <Form.Item name="supportingDocuments" label="Supporting Documents (Optional)">
            <Input placeholder="Document URLs or references" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Submit Request</Button>
              <Button onClick={() => setExtensionModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TimelineEdgeCaseHandler;
