import { useState, useEffect } from 'react';
import { Card, List, Button, Alert, Progress, Tag, Modal, Form, Input, Select, Space, Typography, message, Timeline } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getOccupationalPermits, getLabExamResults, scheduleLabExam } from '../../services/occupationalPermitService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Option } = Select;

const OccupationalPermit = () => {
  const { business } = useBusiness();
  const [permits, setPermits] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schedulingModalVisible, setSchedulingModalVisible] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (business?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [permitsData, labData] = await Promise.all([
            getOccupationalPermits(business.id),
            getLabExamResults(business.id)
          ]);
          setPermits(permitsData?.permits || []);
          setLabResults(labData?.results || []);
        } catch (error) {
          message.error('Failed to fetch occupational permit data.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [business]);

  const handleScheduleExam = async (values) => {
    try {
      await scheduleLabExam(selectedPermit.id, values);
      message.success('Lab exam scheduled successfully.');
      setSchedulingModalVisible(false);
      setSelectedPermit(null);
      form.resetFields();
      // Refresh permits data
      if (business?.id) {
        const permitsData = await getOccupationalPermits(business.id);
        setPermits(permitsData?.permits || []);
      }
    } catch (error) {
      message.error('Failed to schedule lab exam.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'default',
      'In Progress': 'processing',
      'Pending Exam': 'warning',
      'Exam Scheduled': 'blue',
      'Completed': 'success',
      'Failed': 'error',
      'Expired': 'error'
    };
    return colors[status] || 'default';
  };

  const getExamStatusColor = (status) => {
    const colors = {
      'Passed': 'green',
      'Failed': 'red',
      'Pending': 'orange',
      'Scheduled': 'blue'
    };
    return colors[status] || 'default';
  };

  return (
    <Card loading={loading} title="Occupational Permit Management">
      <Title level={4}>Your Occupational Permits</Title>
      <List
        itemLayout="vertical"
        dataSource={permits}
        renderItem={permit => (
          <List.Item
            actions={[
              permit.status === 'Pending Exam' && (
                <Button
                  key="schedule"
                  type="primary"
                  onClick={() => { setSelectedPermit(permit); setSchedulingModalVisible(true); }}
                >
                  Schedule Exam
                </Button>
              )
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: '24px' }} />}
              title={
                <Space>
                  <Text strong>{permit.type}</Text>
                  <Tag color={getStatusColor(permit.status)}>{permit.status}</Tag>
                </Space>
              }
              description={
                <div>
                  <Text>{permit.description}</Text>
                  <br />
                  <Text type="secondary">Permit ID: {permit.permitId}</Text>
                  <br />
                  <Text type="secondary">Valid Until: {permit.validUntil}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={permit.progress}
                      size="small"
                      status={getStatusColor(permit.status)}
                      format={() => `${permit.completedRequirements}/${permit.totalRequirements} Requirements`}
                    />
                  </div>
                </div>
              }
            />
            {permit.requirements && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Requirements Progress</Title>
                <Timeline>
                  {permit.requirements.map((req, index) => (
                    <Timeline.Item
                      key={index}
                      color={req.completed ? 'green' : 'gray'}
                      dot={req.completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    >
                      <Text strong>{req.name}</Text>
                      <br />
                      <Text type="secondary">{req.description}</Text>
                      {req.examDate && (
                        <div>
                          <Tag color="blue">Exam: {req.examDate}</Tag>
                        </div>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </List.Item>
        )}
      />

      <Title level={4} style={{ marginTop: 32 }}>Lab Exam Results</Title>
      {labResults.length === 0 ? (
        <Alert
          message="No Lab Results"
          description="You have no lab exam results on record."
          type="info"
          showIcon
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={labResults}
          renderItem={result => (
            <List.Item>
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: '24px' }} />}
                title={
                  <Space>
                    <Text strong>{result.examType}</Text>
                    <Tag color={getExamStatusColor(result.status)}>{result.status}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text>Exam Date: {result.examDate}</Text>
                    <br />
                    <Text type="secondary">Result: {result.score}%</Text>
                    {result.certificateUrl && (
                      <div>
                        <Button type="link" href={result.certificateUrl} target="_blank">
                          View Certificate
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title={`Schedule Lab Exam for ${selectedPermit?.type}`}
        visible={schedulingModalVisible}
        onCancel={() => setSchedulingModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleScheduleExam} layout="vertical">
          <Form.Item name="examDate" label="Preferred Exam Date" rules={[{ required: true, message: 'Please select a date' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="examTime" label="Preferred Time" rules={[{ required: true, message: 'Please select a time' }]}>
            <Select placeholder="Select a time slot">
              <Option value="09:00">9:00 AM</Option>
              <Option value="11:00">11:00 AM</Option>
              <Option value="14:00">2:00 PM</Option>
              <Option value="16:00">4:00 PM</Option>
            </Select>
          </Form.Item>
          <Form.Item name="location" label="Preferred Location" rules={[{ required: true, message: 'Please select a location' }]}>
            <Select placeholder="Select a testing center">
              <Option value="main">Main Testing Center</Option>
              <Option value="north">North Branch</Option>
              <Option value="south">South Branch</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea rows={3} placeholder="Any special requirements or notes" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Schedule Exam</Button>
              <Button onClick={() => setSchedulingModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default OccupationalPermit;
