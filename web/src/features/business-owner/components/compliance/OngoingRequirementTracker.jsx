import React, { useState, useEffect } from 'react';
import { Card, List, Button, Calendar, Modal, Form, Input, Select, Upload, Tag, Progress, Space, Typography, message, Alert } from 'antd';
import { CalendarOutlined, UploadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getOngoingRequirements, updateRequirement, getRequirementHistory } from '../../services/complianceMonitoringService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Option } = Select;

const OngoingRequirementTracker = () => {
  const { business } = useBusiness();
  const [requirements, setRequirements] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (business?.id) {
      const fetchRequirements = async () => {
        setLoading(true);
        try {
          const requirementsData = await getOngoingRequirements(business.id);
          setRequirements(requirementsData?.requirements || []);
        } catch (error) {
          message.error('Failed to fetch ongoing requirements.');
        } finally {
          setLoading(false);
        }
      };
      fetchRequirements();
    }
  }, [business]);

  const handleUpdateRequirement = async (values) => {
    try {
      await updateRequirement(selectedRequirement.id, values);
      message.success('Requirement updated successfully.');
      setUpdateModalVisible(false);
      setSelectedRequirement(null);
      form.resetFields();
      // Refresh requirements
      if (business?.id) {
        const requirementsData = await getOngoingRequirements(business.id);
        setRequirements(requirementsData?.requirements || []);
      }
    } catch (error) {
      message.error('Failed to update requirement.');
    }
  };

  const handleViewHistory = async (requirementId) => {
    try {
      const historyData = await getRequirementHistory(requirementId);
      setHistory(historyData?.history || []);
      setHistoryModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch requirement history.');
    }
  };

  const getFrequencyColor = (frequency) => {
    const colors = {
      'Daily': 'red',
      'Weekly': 'orange',
      'Monthly': 'gold',
      'Quarterly': 'green',
      'Annually': 'blue'
    };
    return colors[frequency] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Compliant': 'green',
      'Pending': 'orange',
      'Overdue': 'red',
      'Upcoming': 'blue'
    };
    return colors[status] || 'default';
  };

  return (
    <Card loading={loading} title="Ongoing Requirement Tracker">
      {requirements.length === 0 ? (
        <Alert
          message="No Ongoing Requirements"
          description="You have no ongoing compliance requirements at this time."
          type="info"
          showIcon
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={requirements}
          renderItem={requirement => (
            <List.Item
              actions={[
                <Button key="update" type="primary" onClick={() => { setSelectedRequirement(requirement); setUpdateModalVisible(true); }}>
                  Update
                </Button>,
                <Button key="history" onClick={() => handleViewHistory(requirement.id)}>
                  History
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<CalendarOutlined style={{ fontSize: '24px' }} />}
                title={
                  <Space>
                    <Text strong>{requirement.name}</Text>
                    <Tag color={getFrequencyColor(requirement.frequency)}>{requirement.frequency}</Tag>
                    <Tag color={getStatusColor(requirement.status)}>{requirement.status}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text>{requirement.description}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={requirement.completionRate}
                        size="small"
                        status={getStatusColor(requirement.status)}
                        format={() => `${requirement.completedCount}/${requirement.totalCount} completed`}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Next Due: {requirement.nextDueDate}</Text>
                      <br />
                      <Text type="secondary">Last Completed: {requirement.lastCompletedDate}</Text>
                    </div>
                  </div>
                }
              />
              {requirement.documents && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>Required Documents</Title>
                  <List
                    size="small"
                    dataSource={requirement.documents}
                    renderItem={doc => (
                      <List.Item>
                        <Space>
                          <CheckCircleOutlined style={{ color: doc.submitted ? 'green' : 'gray' }} />
                          <Text>{doc.name}</Text>
                          {doc.submitted ? (
                            <Tag color="green">Submitted</Tag>
                          ) : (
                            <Tag color="orange">Pending</Tag>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </List.Item>
          )}
        />
      )}

      <Modal
        title={`Update Requirement: ${selectedRequirement?.name}`}
        visible={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleUpdateRequirement} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
            <Select placeholder="Select status">
              <Option value="Compliant">Compliant</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Overdue">Overdue</Option>
              <Option value="Upcoming">Upcoming</Option>
            </Select>
          </Form.Item>
          <Form.Item name="completionDate" label="Completion Date">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Add any notes about this requirement" />
          </Form.Item>
          <Form.Item name="documents" label="Supporting Documents">
            <Upload.Dragger name="documents" multiple>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag files to upload</p>
              <p className="ant-upload-hint">Upload supporting documents</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Update Requirement</Button>
              <Button onClick={() => setUpdateModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Requirement History: ${selectedRequirement?.name}`}
        visible={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <List
          dataSource={history}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{item.action}</Text>
                    <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text>{item.description}</Text>
                    <br />
                    <Text type="secondary">Date: {item.date}</Text>
                    <br />
                    <Text type="secondary">Updated by: {item.updatedBy}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
};

export default OngoingRequirementTracker;
