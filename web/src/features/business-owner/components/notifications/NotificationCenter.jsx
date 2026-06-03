import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Input, Select, Badge, Tag, Modal, Space, Typography, message, Empty } from 'antd';
import { BellOutlined, SearchOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../services/notificationService';
import { useBusiness } from '@/hooks/useBusiness';
import { useDebounce, useMemoizedSearch, usePagination } from '../../utils/performanceHooks.jsx';

const { Title, Text } = Typography;

const NotificationCenter = () => {
  const { business } = useBusiness();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Debounced search to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized search results
  const searchedNotifications = useMemoizedSearch(
    notifications,
    ['title', 'message'],
    debouncedSearchTerm
  );

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = searchedNotifications;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => filterStatus === 'unread' ? !n.read : n.read);
    }

    return filtered;
  }, [searchedNotifications, filterType, filterStatus]);

  // Pagination for better performance with large lists
  const {
    currentPage,
    totalPages,
    paginatedData,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage
  } = usePagination(filteredNotifications, 20);

  useEffect(() => {
    if (business?.id) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const notificationsData = await getNotifications(business.id);
          setNotifications(notificationsData?.notifications || []);
        } catch (error) {
          message.error('Failed to fetch notifications.');
        } finally {
          setLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [business]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      message.success('Notification marked as read.');
    } catch (error) {
      message.error('Failed to mark notification as read.');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      message.success('Notification deleted.');
    } catch (error) {
      message.error('Failed to delete notification.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => markNotificationAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      message.success('All notifications marked as read.');
    } catch (error) {
      message.error('Failed to mark all notifications as read.');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'System': 'blue',
      'Payment': 'green',
      'Compliance': 'orange',
      'Permit': 'purple',
      'Inspection': 'red',
      'Deadline': 'gold'
    };
    return colors[type] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'red',
      'High': 'orange',
      'Medium': 'gold',
      'Low': 'green'
    };
    return colors[priority] || 'default';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space>
          <Text strong={!record.read}>{title}</Text>
          {!record.read && <Badge status="processing" />}
        </Space>
      ),
    },
    {
      title: 'Received',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!record.read && (
            <Button
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleMarkAsRead(record.id)}
            >
              Mark Read
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            onClick={() => { setSelectedNotification(record); setDetailModalVisible(true); }}
          >
            View
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteNotification(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card loading={loading} title={
      <Space>
        <BellOutlined />
        <span>Notification Center</span>
        {unreadCount > 0 && <Badge count={unreadCount} />}
      </Space>
    }>
      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Input
          placeholder="Search notifications..."
          allowClear
          style={{ width: 300 }}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
        />
        <Select
          value={filterType}
          onChange={setFilterType}
          style={{ width: 150 }}
          placeholder="Filter by type"
        >
          <Select.Option value="all">All Types</Select.Option>
          <Select.Option value="System">System</Select.Option>
          <Select.Option value="Payment">Payment</Select.Option>
          <Select.Option value="Compliance">Compliance</Select.Option>
          <Select.Option value="Permit">Permit</Select.Option>
          <Select.Option value="Inspection">Inspection</Select.Option>
          <Select.Option value="Deadline">Deadline</Select.Option>
        </Select>
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 150 }}
          placeholder="Filter by status"
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="unread">Unread</Select.Option>
          <Select.Option value="read">Read</Select.Option>
        </Select>
        {unreadCount > 0 && (
          <Button type="primary" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </Space>

      <div>
        <h4>Notifications ({filteredNotifications.length})</h4>
        {paginatedData.length === 0 ? (
          <Empty description="No notifications found" />
        ) : (
          <>
            {paginatedData.map(item => (
              <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Space>
                  <Text strong={!item.read}>{item.title}</Text>
                  {!item.read && <Badge status="processing" />}
                  <Tag color={getTypeColor(item.type)}>{item.type}</Tag>
                  <Tag color={getPriorityColor(item.priority)}>{item.priority}</Tag>
                </Space>
                <div>
                  <Text>{item.message}</Text>
                  <br />
                  <Text type="secondary">{item.receivedAt}</Text>
                </div>
                <Space style={{ marginTop: 8 }}>
                  {!item.read && (
                    <Button size="small" icon={<CheckOutlined />} onClick={() => handleMarkAsRead(item.id)}>Mark Read</Button>
                  )}
                  <Button size="small" type="primary" onClick={() => { setSelectedNotification(item); setDetailModalVisible(true); }}>View</Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteNotification(item.id)} />
                </Space>
              </div>
            ))}
            {totalPages > 1 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Space>
                  <Button disabled={!hasPrevPage} onClick={prevPage}>Previous</Button>
                  <Text>Page {currentPage} of {totalPages}</Text>
                  <Button disabled={!hasNextPage} onClick={nextPage}>Next</Button>
                </Space>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        title="Notification Details"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedNotification && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getTypeColor(selectedNotification.type)}>{selectedNotification.type}</Tag>
              <Tag color={getPriorityColor(selectedNotification.priority)}>{selectedNotification.priority}</Tag>
              {!selectedNotification.read && <Badge status="processing" text="Unread" />}
            </Space>
            <Title level={4}>{selectedNotification.title}</Title>
            <Text>{selectedNotification.message}</Text>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Received: {selectedNotification.receivedAt}</Text>
              <br />
              <Text type="secondary">Expires: {selectedNotification.expiresAt || 'Never'}</Text>
            </div>
            {selectedNotification.actionUrl && (
              <div style={{ marginTop: 16 }}>
                <Button type="primary" href={selectedNotification.actionUrl} target="_blank">
                  Take Action
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default NotificationCenter;
