import { useState, useEffect } from 'react';
import { Card, Button, Badge, List, Space, Typography, message, Drawer, Tabs, Row, Col } from 'antd';
import {
  MenuOutlined,
  BellOutlined,
  HomeOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  UserOutlined,
  WifiOutlined,
  DisconnectOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { getMobileDashboardData, syncOfflineData } from '../../services/offlineService';
import { registerForPushNotifications, getPushNotifications } from '../../services/notificationService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const MobileDashboard = () => {
  const { business } = useBusiness();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getMobileDashboardData(business?.id);
        setDashboardData(data);
      } catch (error) {
        message.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Setup push notifications
    setupPushNotifications();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [business]);

  const setupPushNotifications = async () => {
    try {
      await registerForPushNotifications(business?.id);
      const pushNotifications = await getPushNotifications(business?.id);
      setNotifications(pushNotifications?.notifications || []);
    } catch (error) {
      console.log('Push notifications not available');
    }
  };

  const syncData = async () => {
    try {
      await syncOfflineData(business?.id);
      message.success('Data synced successfully');
      // Refresh dashboard data
      const data = await getMobileDashboardData(business?.id);
      setDashboardData(data);
    } catch (error) {
      message.error('Failed to sync data');
    }
  };

  const handleQuickAction = (action) => {
    message.info(`${action} action triggered`);
  };

  const renderOverview = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card size="small" onClick={() => handleQuickAction('View Permits')} style={{ cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={5}>Permits</Title>
                <Badge count={dashboardData?.activePermits || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" onClick={() => handleQuickAction('View Payments')} style={{ cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <CreditCardOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={5}>Payments</Title>
                <Badge count={dashboardData?.pendingPayments || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" onClick={() => handleQuickAction('View Inspections')} style={{ cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: '32px', color: '#faad14' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={5}>Inspections</Title>
                <Badge count={dashboardData?.upcomingInspections || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" onClick={() => handleQuickAction('View Compliance')} style={{ cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: '32px', color: '#f5222d' }} />
              <div style={{ marginTop: 8 }}>
                <Title level={5}>Compliance</Title>
                <Badge count={dashboardData?.complianceIssues || 0} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Recent Activity" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={dashboardData?.recentActivity || []}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <List
        dataSource={notifications}
        renderItem={notification => (
          <List.Item>
            <List.Item.Meta
              avatar={<NotificationOutlined />}
              title={notification.title}
              description={notification.message}
            />
          </List.Item>
        )}
      />
    </div>
  );

  const renderQuickActions = () => (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          block
          size="large"
          icon={<FileTextOutlined />}
          onClick={() => handleQuickAction('New Permit Application')}
        >
          New Permit Application
        </Button>
        <Button
          block
          size="large"
          icon={<CreditCardOutlined />}
          onClick={() => handleQuickAction('Make Payment')}
        >
          Make Payment
        </Button>
        <Button
          block
          size="large"
          icon={<CalendarOutlined />}
          onClick={() => handleQuickAction('Schedule Inspection')}
        >
          Schedule Inspection
        </Button>
        <Button
          block
          size="large"
          icon={<UserOutlined />}
          onClick={() => handleQuickAction('Update Profile')}
        >
          Update Profile
        </Button>
      </Space>
    </div>
  );

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Button
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          size="large"
        />
        <Title level={4} style={{ margin: 0 }}>
          {business?.businessName || 'Dashboard'}
        </Title>
        <Space>
          {isOnline ? (
            <WifiOutlined style={{ color: '#52c41a' }} />
          ) : (
            <DisconnectOutlined style={{ color: '#f5222d' }} />
          )}
          <Badge count={notifications.length}>
            <BellOutlined style={{ fontSize: '20px' }} />
          </Badge>
        </Space>
      </div>

      {/* Connection Status */}
      {!isOnline && (
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fff7e6' }}>
          <Text type="secondary">You're offline. Some features may be limited.</Text>
        </Card>
      )}

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          {renderOverview()}
        </TabPane>
        <TabPane tab="Notifications" key="notifications">
          {renderNotifications()}
        </TabPane>
        <TabPane tab="Quick Actions" key="actions">
          {renderQuickActions()}
        </TabPane>
      </Tabs>

      {/* Navigation Drawer */}
      <Drawer
        title="Navigation"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={[
            { icon: <HomeOutlined />, title: 'Home', key: 'home' },
            { icon: <FileTextOutlined />, title: 'Permits', key: 'permits' },
            { icon: <CreditCardOutlined />, title: 'Payments', key: 'payments' },
            { icon: <CalendarOutlined />, title: 'Inspections', key: 'inspections' },
            { icon: <UserOutlined />, title: 'Profile', key: 'profile' },
            { icon: <BellOutlined />, title: 'Notifications', key: 'notifications' },
          ]}
          renderItem={item => (
            <List.Item
              onClick={() => {
                handleQuickAction(item.title);
                setDrawerVisible(false);
              }}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

export default MobileDashboard;
