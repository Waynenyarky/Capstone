import { useState, useEffect } from 'react';
import { Card, Badge, Button, Space, Typography, Progress, Tooltip } from 'antd';
import { 
  LockOutlined, 
  UnlockOutlined, 
  StarOutlined, 
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text } = Typography;

const FeatureExposure = ({ business, user, onFeatureUnlock }) => {
  const { updateBusinessProfile } = useBusiness();
  const [unlockedFeatures, setUnlockedFeatures] = useState([]);
  const [featureProgress, setFeatureProgress] = useState({});

  // Define features with unlock conditions
  const features = [
    {
      id: 'documents',
      name: 'Document Management',
      description: 'Access and manage business documents',
      icon: <LockOutlined />,
      unlockedIcon: <UnlockOutlined />,
      badge: 'Essential',
      badgeColor: '#52c41a',
      unlockCondition: () => true, // Always available
      priority: 1,
      tab: 'documents'
    },
    {
      id: 'payments',
      name: 'Payment Management',
      description: 'Process payments and manage fees',
      icon: <LockOutlined />,
      unlockedIcon: <UnlockOutlined />,
      badge: 'Essential',
      badgeColor: '#52c41a',
      unlockCondition: () => true, // Always available
      priority: 2,
      tab: 'payments'
    },
    {
      id: 'inspections',
      name: 'Inspection Scheduling',
      description: 'Schedule and track inspections',
      icon: <LockOutlined />,
      unlockedIcon: <UnlockOutlined />,
      badge: 'Essential',
      badgeColor: '#52c41a',
      unlockCondition: () => true, // Always available
      priority: 3,
      tab: 'inspections'
    },
    {
      id: 'notifications',
      name: 'Smart Notifications',
      description: 'Receive important alerts and reminders',
      icon: <LockOutlined />,
      unlockedIcon: <UnlockOutlined />,
      badge: 'Recommended',
      badgeColor: '#1890ff',
      unlockCondition: () => business?.hasSeenOnboarding,
      priority: 4,
      tab: 'notifications'
    },
    {
      id: 'analytics',
      name: 'Business Analytics',
      description: 'View business insights and reports',
      icon: <LockOutlined />,
      unlockedIcon: <StarOutlined />,
      badge: 'Advanced',
      badgeColor: '#722ed1',
      unlockCondition: () => business?.totalPayments > 0,
      priority: 5,
      tab: 'analytics'
    },
    {
      id: 'bulk_operations',
      name: 'Bulk Operations',
      description: 'Manage multiple businesses efficiently',
      icon: <LockOutlined />,
      unlockedIcon: <ThunderboltOutlined />,
      badge: 'Premium',
      badgeColor: '#eb2f96',
      unlockCondition: () => user?.businesses?.length > 1,
      priority: 6,
      tab: 'bulk'
    },
    {
      id: 'advanced_compliance',
      name: 'Advanced Compliance',
      description: 'Comprehensive compliance tracking',
      icon: <LockOutlined />,
      unlockedIcon: <CrownOutlined />,
      badge: 'Premium',
      badgeColor: '#eb2f96',
      unlockCondition: () => business?.inspectionsCompleted > 3,
      priority: 7,
      tab: 'compliance'
    },
    {
      id: 'api_access',
      name: 'API Access',
      description: 'Integrate with external systems',
      icon: <LockOutlined />,
      unlockedIcon: <RocketOutlined />,
      badge: 'Enterprise',
      badgeColor: '#f5222d',
      unlockCondition: () => user?.subscriptionTier === 'enterprise',
      priority: 8,
      tab: 'api'
    }
  ];

  useEffect(() => {
    // Check which features are unlocked
    const unlocked = features.filter(feature => feature.unlockCondition());
    setUnlockedFeatures(unlocked.map(f => f.id));

    // Calculate progress for each feature
    const progress = {};
    features.forEach(feature => {
      if (feature.unlockCondition()) {
        progress[feature.id] = 100;
      } else {
        // Calculate partial progress based on conditions
        let progressValue = 0;
        if (feature.id === 'notifications' && business?.hasSeenOnboarding) {
          progressValue = 100;
        } else if (feature.id === 'analytics' && business?.totalPayments > 0) {
          progressValue = 100;
        } else if (feature.id === 'bulk_operations' && user?.businesses?.length > 0) {
          progressValue = (user.businesses.length / 2) * 100; // Progress towards multi-business
        } else if (feature.id === 'advanced_compliance' && business?.inspectionsCompleted > 0) {
          progressValue = (business.inspectionsCompleted / 3) * 100;
        } else if (feature.id === 'api_access' && user?.subscriptionTier) {
          progressValue = user.subscriptionTier === 'enterprise' ? 100 : 50;
        }
        progress[feature.id] = Math.min(progressValue, 99); // Never show 100% until fully unlocked
      }
    });
    setFeatureProgress(progress);
  }, [business, user, features]);

  const handleFeatureUnlock = async (featureId) => {
    try {
      await onFeatureUnlock?.(featureId);
      setUnlockedFeatures(prev => [...prev, featureId]);
    } catch (error) {
      console.error('Error unlocking feature:', error);
    }
  };

  const getFeatureIcon = (feature) => {
    if (unlockedFeatures.includes(feature.id)) {
      return feature.unlockedIcon || <UnlockOutlined />;
    }
    return feature.icon;
  };

  const getFeatureStatus = (feature) => {
    if (unlockedFeatures.includes(feature.id)) {
      return 'unlocked';
    }
    if (featureProgress[feature.id] > 0) {
      return 'progress';
    }
    return 'locked';
  };

  const sortedFeatures = features.sort((a, b) => a.priority - b.priority);

  return (
    <div className="feature-exposure">
      <Title level={4}>Feature Discovery</Title>
      <Text type="secondary">
        Unlock powerful features as you grow your business
      </Text>

      <div className="features-grid" style={{ marginTop: '20px' }}>
        {sortedFeatures.map(feature => {
          const status = getFeatureStatus(feature);
          const progress = featureProgress[feature.id] || 0;
          
          return (
            <Card
              key={feature.id}
              size="small"
              className={`feature-card ${status}`}
              style={{
                marginBottom: '16px',
                opacity: status === 'locked' ? 0.6 : 1,
                border: status === 'unlocked' ? '2px solid #52c41a' : '1px solid #d9d9d9'
              }}
              actions={
                status === 'locked' ? [
                  <Tooltip title="Complete more actions to unlock this feature">
                    <Button type="primary" disabled icon={<LockOutlined />}>
                      Locked
                    </Button>
                  </Tooltip>
                ] : status === 'progress' ? [
                  <Button 
                    type="primary" 
                    onClick={() => handleFeatureUnlock(feature.id)}
                    icon={<UnlockOutlined />}
                  >
                    Unlock Now
                  </Button>
                ] : [
                  <Button type="primary" ghost icon={<UnlockOutlined />}>
                    Unlocked
                  </Button>
                ]
              }
            >
              <Card.Meta
                avatar={
                  <div style={{ fontSize: '24px', color: status === 'unlocked' ? '#52c41a' : '#8c8c8c' }}>
                    {getFeatureIcon(feature)}
                  </div>
                }
                title={
                  <Space>
                    {feature.name}
                    <Badge 
                      count={feature.badge} 
                      style={{ 
                        backgroundColor: feature.badgeColor,
                        fontSize: '10px'
                      }} 
                    />
                    {status === 'unlocked' && <Badge status="success" />}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">{feature.description}</Text>
                    {status === 'progress' && (
                      <div style={{ marginTop: '8px' }}>
                        <Progress 
                          percent={progress} 
                          size="small" 
                          status="active"
                          showInfo={false}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {progress}% complete
                        </Text>
                      </div>
                    )}
                    {status === 'locked' && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Complete onboarding to unlock
                        </Text>
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          );
        })}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space direction="vertical">
          <Text type="secondary">
            <FireOutlined /> Complete actions to unlock advanced features
          </Text>
          <Progress 
            percent={(unlockedFeatures.length / features.length) * 100}
            format={() => `${unlockedFeatures.length} of ${features.length} features unlocked`}
          />
        </Space>
      </div>
    </div>
  );
};

export default FeatureExposure;
