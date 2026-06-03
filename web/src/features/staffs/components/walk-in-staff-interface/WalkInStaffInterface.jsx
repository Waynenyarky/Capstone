import { useState, useEffect } from 'react';
import { Card, Tabs, Typography, message, Row, Col, Statistic, Table, Button, Space, Tag, Tooltip, Popconfirm, Input } from 'antd';
import { SolutionOutlined, TeamOutlined, ProfileOutlined, UserOutlined, ClockCircleOutlined, ScheduleOutlined, PlayCircleOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  getWalkInAppointments,
  getWalkInQueue,
  getWalkInStats,
  serveWalkIn,
  markAsNoShow,
  completeWalkInAppointment,
  checkInWalkInAppointment,
  cancelWalkInAppointment,
  searchCitizens
} from '../../services/walkInService';

const { Title } = Typography;

const WalkInStaffInterface = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [citizenSearch, setCitizenSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleServe = async (id) => {
    try {
      await serveWalkIn(id);
      message.success('Visitor is now being served.');
      fetchAllData();
    } catch (error) {
      message.error('Failed to serve visitor.');
    }
  };

  const handleNoShow = async (id) => {
    try {
      await markAsNoShow(id);
      message.warning('Visitor marked as no-show.');
      fetchAllData();
    } catch (error) {
      message.error('Failed to mark as no-show.');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeWalkInAppointment(id);
      message.success('Service completed.');
      fetchAllData();
    } catch (error) {
      message.error('Failed to complete service.');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await checkInWalkInAppointment(id);
      message.success('Appointment checked in.');
      fetchAllData();
    } catch (error) {
      message.error('Failed to check in appointment.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelWalkInAppointment(id);
      message.warning('Appointment cancelled.');
      fetchAllData();
    } catch (error) {
      message.error('Failed to cancel appointment.');
    }
  };

  const handleSearch = async (value) => {
    setLoading(true);
    try {
      const results = await searchCitizens({ query: value });
      setSearchResults(results?.citizens || []);
    } catch (error) {
      message.error('Failed to search for citizens.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsData, queueData, appointmentsData] = await Promise.all([
        getWalkInStats(),
        getWalkInQueue(),
        getWalkInAppointments(),
      ]);
      setStats(statsData);
      setQueue(queueData?.queue || []);
      setAppointments(appointmentsData?.appointments || []);
    } catch (error) {
      console.error('Failed to fetch walk-in data:', error);
      message.error('Failed to load walk-in data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const tabItems = [
    {
      key: 'overview',
      label: (
        <>
          <ProfileOutlined /> Overview
        </>
      ),
      children: (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Today's Visitors"
                value={stats?.today?.visitors || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg. Wait Time"
                value={stats?.today?.avgWaitTime || 0}
                suffix="mins"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Services Rendered"
                value={stats?.today?.servicesRendered || 0}
                prefix={<SolutionOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Appointments"
                value={stats?.pendingAppointments || 0}
                prefix={<ScheduleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'queue',
      label: (
        <>
          <TeamOutlined /> Queue Management
        </>
      ),
      children: (
        <Table
          dataSource={queue}
          rowKey="id"
          loading={loading}
          columns={[
            { title: 'Queue #', dataIndex: 'queueNumber', key: 'queueNumber' },
            { title: 'Citizen Name', dataIndex: 'citizenName', key: 'citizenName' },
            { 
              title: 'Service',
              dataIndex: 'serviceType',
              key: 'serviceType',
              render: (service) => <Tag color="blue">{service}</Tag>
            },
            { title: 'Arrival Time', dataIndex: 'arrivalTime', key: 'arrivalTime', render: (time) => new Date(time).toLocaleTimeString() },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={status === 'waiting' ? 'orange' : 'blue'}>{status}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Tooltip title="Serve Visitor">
                    <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => handleServe(record.id)}>
                      Serve
                    </Button>
                  </Tooltip>
                  <Tooltip title="Mark as No-Show">
                    <Button icon={<StopOutlined />} danger onClick={() => handleNoShow(record.id)}>
                      No-Show
                    </Button>
                  </Tooltip>
                   <Tooltip title="Complete Service">
                    <Button icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>
                      Complete
                    </Button>
                  </Tooltip>
                </Space>
              )
            }
          ]}
        />
      )
    },
    {
      key: 'appointments',
      label: (
        <>
          <SolutionOutlined /> Appointments
        </>
      ),
      children: (
        <Table
          dataSource={appointments}
          rowKey="id"
          loading={loading}
          columns={[
            { title: 'Appointment ID', dataIndex: 'id', key: 'id' },
            { title: 'Citizen Name', dataIndex: 'citizenName', key: 'citizenName' },
            {
              title: 'Service',
              dataIndex: 'serviceType',
              key: 'serviceType',
              render: (service) => <Tag color="purple">{service}</Tag>
            },
            { title: 'Scheduled Time', dataIndex: 'scheduledTime', key: 'scheduledTime', render: (time) => new Date(time).toLocaleString() },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={status === 'scheduled' ? 'blue' : 'green'}>{status}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Tooltip title="Check-In Visitor">
                    <Button icon={<CheckCircleOutlined />} type="primary" onClick={() => handleCheckIn(record.id)}>
                      Check-In
                    </Button>
                  </Tooltip>
                  <Tooltip title="Cancel Appointment">
                    <Popconfirm title="Are you sure?" onConfirm={() => handleCancel(record.id)}>
                      <Button icon={<StopOutlined />} danger>
                        Cancel
                      </Button>
                    </Popconfirm>
                  </Tooltip>
                </Space>
              )
            }
          ]}
        />
      )
    },
    {
      key: 'lookup',
      label: (
        <>
          <UserOutlined /> Citizen Lookup
        </>
      ),
      children: (
        <div>
          <Input.Search
            placeholder="Search by name, email, or phone"
            onSearch={handleSearch}
            style={{ marginBottom: 16 }}
            enterButton
            loading={loading}
          />
          <Table
            dataSource={searchResults}
            rowKey="id"
            loading={loading}
            columns={[
              { title: 'Citizen ID', dataIndex: 'id', key: 'id' },
              { title: 'Name', dataIndex: 'name', key: 'name' },
              { title: 'Email', dataIndex: 'email', key: 'email' },
              { title: 'Phone', dataIndex: 'phone', key: 'phone' },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Button onClick={() => { /* View citizen details */ }}>View Details</Button>
                )
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <Card>
      <Title level={2}><SolutionOutlined /> Walk-In Staff Interface</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Card>
  );
};

export default WalkInStaffInterface;
