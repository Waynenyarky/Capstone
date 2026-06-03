import { useState, useEffect } from 'react';
import { Modal, Steps, Button, Card, Typography, Badge, Progress, Space } from 'antd';
import { RocketOutlined, DownloadOutlined, CalendarOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../hooks/useAuth';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const ApprovalTransitionBridge = ({ business, onComplete, onSkip }) => {
  const { user } = useAuth();
  const { updateBusinessProfile } = useBusiness();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [completedActions, setCompletedActions] = useState([]);

  // Check if this is first-time approval
  const isFirstTimeApproval = business?.applicationStatus === 'approved' && !user?.hasSeenOnboarding;

  useEffect(() => {
    if (!isFirstTimeApproval) {
      setIsVisible(false);
      onComplete?.();
    }
  }, [isFirstTimeApproval, onComplete]);

  const steps = [
    {
      title: 'Welcome to Your Approved Business!',
      content: 'Congratulations! Your business has been approved. Let us guide you through your new dashboard.',
      icon: <RocketOutlined />
    },
    {
      title: 'Download Your Permit',
      content: 'Your official permit certificate is ready. Download and save it for your records.',
      icon: <DownloadOutlined />
    },
    {
      title: 'Schedule First Inspection',
      content: 'Book your first inspection to ensure compliance with local regulations.',
      icon: <CalendarOutlined />
    },
    {
      title: 'Set Up Payment Methods',
      content: 'Add payment methods for easy fee payments and renewals.',
      icon: <CreditCardOutlined />
    },
    {
      title: 'Enable Notifications',
      content: 'Stay updated with important deadlines and requirements.',
      icon: <BellOutlined />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      await updateBusinessProfile(business.id, {
        hasSeenOnboarding: true,
        onboardingCompletedAt: new Date().toISOString()
      });
      
      setIsVisible(false);
      onComplete?.();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await updateBusinessProfile(business.id, {
        hasSeenOnboarding: true,
        onboardingSkippedAt: new Date().toISOString()
      });
      
      setIsVisible(false);
      onSkip?.();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const markActionCompleted = (action) => {
    setCompletedActions(prev => [...prev, action]);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isVisible || !isFirstTimeApproval) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <RocketOutlined style={{ color: '#52c41a' }} />
          <span>Welcome to Your Business Dashboard!</span>
        </Space>
      }
      open={isVisible}
      onCancel={handleSkip}
      width={800}
      footer={[
        <Button key="skip" onClick={handleSkip}>
          Skip Tour
        </Button>,
        <Button 
          key="previous" 
          onClick={handlePrevious} 
          disabled={currentStep === 0}
        >
          Previous
        </Button>,
        <Button key="next" type="primary" onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      ]}
      closable={false}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <Progress 
          percent={progress} 
          status="active" 
          style={{ marginBottom: '30px' }}
          format={() => `${currentStep + 1} of ${steps.length}`}
        />
        
        <Steps current={currentStep} direction="vertical" size="small">
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={
                index === currentStep && (
                  <Card size="small" style={{ marginTop: '10px', backgroundColor: '#f6ffed' }}>
                    <Paragraph>{step.content}</Paragraph>
                    
                    {index === 1 && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button 
                          type="primary" 
                          icon={<DownloadOutlined />}
                          onClick={() => markActionCompleted('download_permit')}
                          disabled={completedActions.includes('download_permit')}
                        >
                          {completedActions.includes('download_permit') ? '✓ Downloaded' : 'Download Permit'}
                        </Button>
                      </Space>
                    )}
                    
                    {index === 2 && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button 
                          type="primary" 
                          icon={<CalendarOutlined />}
                          onClick={() => markActionCompleted('schedule_inspection')}
                          disabled={completedActions.includes('schedule_inspection')}
                        >
                          {completedActions.includes('schedule_inspection') ? '✓ Scheduled' : 'Schedule Inspection'}
                        </Button>
                      </Space>
                    )}
                    
                    {index === 3 && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button 
                          type="primary" 
                          icon={<CreditCardOutlined />}
                          onClick={() => markActionCompleted('setup_payments')}
                          disabled={completedActions.includes('setup_payments')}
                        >
                          {completedActions.includes('setup_payments') ? '✓ Set Up' : 'Set Up Payments'}
                        </Button>
                      </Space>
                    )}
                    
                    {index === 4 && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button 
                          type="primary" 
                          icon={<BellOutlined />}
                          onClick={() => markActionCompleted('enable_notifications')}
                          disabled={completedActions.includes('enable_notifications')}
                        >
                          {completedActions.includes('enable_notifications') ? '✓ Enabled' : 'Enable Notifications'}
                        </Button>
                      </Space>
                    )}
                  </Card>
                )
              }
              icon={step.icon}
            />
          ))}
        </Steps>
        
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Badge count="NEW" style={{ backgroundColor: '#52c41a' }}>
            <Text type="secondary">
              Discover all the features available in your business dashboard
            </Text>
          </Badge>
        </div>
      </div>
    </Modal>
  );
};

export default ApprovalTransitionBridge;
