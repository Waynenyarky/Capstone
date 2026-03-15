import React, { useState, useEffect } from 'react';
import {
  Card,
  Calendar,
  Badge,
  Button,
  Modal,
  Form,
  Select,
  TimePicker,
  Alert,
  Spin,
  Empty,
  Tag,
  Space,
  Typography,
  List,
  message,
  Divider,
  Descriptions,
  Row,
  Col
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ScheduleOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import BusinessOwnerLayout from '../BusinessOwnerLayout';
import { useBusiness } from '@/hooks/useBusiness';
import {
  getAvailableSlots,
  bookSlot,
  cancelBooking,
  getUpcomingInspections,
  getInspectionHistory,
  checkPrerequisites
} from '../../services/inspectionSchedulingService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const InspectionCalendar = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [upcomingInspections, setUpcomingInspections] = useState([]);
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [prerequisites, setPrerequisites] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form] = Form.useForm();

  const businessId = business?.businessId || business?._id;

  useEffect(() => {
    if (businessId) {
      loadData();
    }
  }, [businessId, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check prerequisites
      const prereq = await checkPrerequisites(businessId);
      setPrerequisites(prereq);

      if (prereq.canSchedule) {
        // Load available slots for next 30 days
        const startDate = dayjs().format('YYYY-MM-DD');
        const endDate = dayjs().add(30, 'days').format('YYYY-MM-DD');
        const slots = await getAvailableSlots(startDate, endDate);
        setAvailableSlots(slots);
      }

      // Load upcoming inspections
      const upcoming = await getUpcomingInspections(businessId);
      setUpcomingInspections(upcoming);

      // Load history
      const history = await getInspectionHistory(businessId);
      setInspectionHistory(history);
    } catch (error) {
      console.error('Failed to load inspection data:', error);
      message.error('Failed to load inspection calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (values) => {
    try {
      const result = await bookSlot(
        selectedSlot.slotId,
        businessId,
        values.inspectionType,
        values.notes
      );
      
      message.success(`Inspection scheduled for ${dayjs(result.date).format('MMMM D, YYYY')} at ${result.startTime}`);
      setBookingModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('Failed to book slot:', error);
      message.error(error.message || 'Failed to book inspection');
    }
  };

  const handleCancel = async (inspection) => {
    if (!inspection.canCancel) {
      message.error('Cannot cancel - less than 24 hours before inspection');
      return;
    }

    try {
      await cancelBooking(inspection.slotId, 'Cancelled by business owner');
      message.success('Inspection cancelled successfully');
      loadData();
    } catch (error) {
      console.error('Failed to cancel:', error);
      message.error(error.message || 'Failed to cancel inspection');
    }
  };

  const getDateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const slotsForDate = availableSlots.filter(
      slot => dayjs(slot.date).format('YYYY-MM-DD') === dateStr
    );

    const upcomingForDate = upcomingInspections.filter(
      inspection => dayjs(inspection.date).format('YYYY-MM-DD') === dateStr
    );

    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {upcomingForDate.map(inspection => (
          <li key={inspection.slotId}>
            <Badge
              status="processing"
              text={<Tag color="blue">{inspection.startTime} Inspection</Tag>}
            />
          </li>
        ))}
        {slotsForDate.length > 0 && upcomingForDate.length === 0 && (
          <li>
            <Badge
              status="success"
              text={<Tag color="green">{slotsForDate.length} slots available</Tag>}
            />
          </li>
        )}
      </ul>
    );
  };

  const onDateSelect = (date) => {
    setSelectedDate(date);
    const dateStr = date.format('YYYY-MM-DD');
    const slotsForDate = availableSlots.filter(
      slot => dayjs(slot.date).format('YYYY-MM-DD') === dateStr
    );

    if (slotsForDate.length > 0) {
      setBookingModalVisible(true);
    }
  };

  if (loading) {
    return (
      <BusinessOwnerLayout pageTitle="Schedule Inspection" pageIcon={<CalendarOutlined />}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
          <p>Loading inspection calendar...</p>
        </div>
      </BusinessOwnerLayout>
    );
  }

  return (
    <BusinessOwnerLayout pageTitle="Schedule Inspection" pageIcon={<CalendarOutlined />}>
      <div style={{ padding: '24px' }}>
        {/* Prerequisites Check */}
        {prerequisites && !prerequisites.canSchedule && (
          <Alert
            message="Prerequisites Not Met"
            description={
              <div>
                <p>You cannot schedule an inspection yet. Please complete the following requirements:</p>
                <ul>
                  {prerequisites.missingRequirements.map(req => (
                    <li key={req}>
                      {req === 'hasClearances' && 'Complete all agency clearances'}
                      {req === 'hasPaidFees' && 'Pay all required fees'}
                      {req === 'hasValidPermit' && 'Have an active or approved permit application'}
                    </li>
                  ))}
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Upcoming Inspections */}
        {upcomingInspections.length > 0 && (
          <Card title="Upcoming Inspections" style={{ marginBottom: 24 }}>
            <List
              dataSource={upcomingInspections}
              renderItem={inspection => (
                <List.Item
                  actions={[
                    <Button
                      danger
                      size="small"
                      disabled={!inspection.canCancel}
                      onClick={() => handleCancel(inspection)}
                    >
                      Cancel
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<ScheduleOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        <Text strong>{dayjs(inspection.date).format('MMMM D, YYYY')}</Text>
                        <Tag color="blue">{inspection.startTime} - {inspection.endTime}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>
                          <UserOutlined /> Inspector: {inspection.inspector?.firstName} {inspection.inspector?.lastName}
                        </Text>
                        <Text>
                          <EnvironmentOutlined /> {inspection.location?.address}
                        </Text>
                        {inspection.notes && (
                          <Text type="secondary">Notes: {inspection.notes}</Text>
                        )}
                        {!inspection.canCancel && (
                          <Text type="warning">
                            <InfoCircleOutlined /> Cannot cancel - less than 24 hours before inspection
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Calendar */}
        <Card
          title="Select a Date to Schedule Inspection"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>
          }
        >
          {prerequisites?.canSchedule ? (
            <Calendar
              cellRender={getDateCellRender}
              onSelect={onDateSelect}
              disabledDate={(current) => {
                // Disable past dates and dates without available slots
                const isPast = current && current < dayjs().startOf('day');
                const dateStr = current?.format('YYYY-MM-DD');
                const hasSlots = availableSlots.some(
                  slot => dayjs(slot.date).format('YYYY-MM-DD') === dateStr
                );
                return isPast || !hasSlots;
              }}
            />
          ) : (
            <Empty description="Complete prerequisites to view available slots" />
          )}
        </Card>

        {/* Inspection History */}
        {inspectionHistory.length > 0 && (
          <Card title="Inspection History" style={{ marginTop: 24 }}>
            <List
              dataSource={inspectionHistory}
              renderItem={inspection => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      inspection.status === 'COMPLETED' ? (
                        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                      )
                    }
                    title={
                      <Space>
                        <Text strong>{dayjs(inspection.date).format('MMMM D, YYYY')}</Text>
                        <Tag color={inspection.completion?.status === 'PASS' ? 'green' : 'red'}>
                          {inspection.completion?.status}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>Inspector: {inspection.inspector?.firstName} {inspection.inspector?.lastName}</Text>
                        {inspection.completion?.findings && (
                          <Text type="secondary">Findings: {inspection.completion.findings}</Text>
                        )}
                        {inspection.completion?.violations?.length > 0 && (
                          <Text type="danger">
                            Violations found: {inspection.completion.violations.length}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Booking Modal */}
        <Modal
          title={`Book Inspection for ${selectedDate.format('MMMM D, YYYY')}`}
          visible={bookingModalVisible}
          onCancel={() => {
            setBookingModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleBookSlot}>
            <Form.Item
              name="slotId"
              label="Available Time Slots"
              rules={[{ required: true, message: 'Please select a time slot' }]}
            >
              <Select placeholder="Select a time">
                {availableSlots
                  .filter(slot => dayjs(slot.date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD'))
                  .map(slot => (
                    <Option key={slot.slotId} value={slot.slotId}>
                      {slot.startTime} - {slot.endTime}
                      {slot.inspectorName && ` (Inspector: ${slot.inspectorName})`}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="inspectionType"
              label="Inspection Type"
              rules={[{ required: true, message: 'Please select inspection type' }]}
            >
              <Select placeholder="Select inspection type">
                <Option value="INITIAL">Initial Inspection</Option>
                <Option value="RENEWAL">Renewal Inspection</Option>
                <Option value="COMPLIANCE">Compliance Check</Option>
                <Option value="FOLLOW_UP">Follow-up Inspection</Option>
              </Select>
            </Form.Item>

            <Form.Item name="notes" label="Additional Notes">
              <Input.TextArea rows={3} placeholder="Any special instructions or notes for the inspector..." />
            </Form.Item>

            <Alert
              message="Cancellation Policy"
              description="You can cancel or reschedule your inspection up to 24 hours before the scheduled time."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Book Inspection
                </Button>
                <Button onClick={() => {
                  setBookingModalVisible(false);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </BusinessOwnerLayout>
  );
};

export default InspectionCalendar;
