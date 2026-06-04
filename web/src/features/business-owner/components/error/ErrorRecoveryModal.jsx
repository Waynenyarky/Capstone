import { useState, useEffect } from 'react';
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import {
  Modal,
  Button,
  Space,
  Typography,
  Steps,
  Alert,
  Progress,
  List,
  Tag,
  Result,
  Badge
} from 'antd';
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  SyncOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const ErrorRecoveryModal = ({ 
  visible, 
  onClose, 
  error, 
  onRetry, 
  onContactSupport,
  onGoHome 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [selectedRecoveryOption, setSelectedRecoveryOption] = useState(null);

  // Recovery options based on error type
  const recoveryOptions = [
    {
      id: 'auto_retry',
      title: 'Automatic Retry',
      description: 'Automatically retry the failed operation',
      icon: <SyncOutlined />,
      color: '#1890ff',
      steps: ['Analyzing error', 'Preparing retry', 'Executing retry', 'Verifying result'],
      estimatedTime: '30 seconds',
      successRate: 0.8
    },
    {
      id: 'manual_retry',
      title: 'Manual Retry',
      description: 'Manually retry with your input',
      icon: <ReloadOutlined />,
      color: '#52c41a',
      steps: ['Review error details', 'Provide input', 'Execute retry', 'Verify result'],
      estimatedTime: '2 minutes',
      successRate: 0.9
    },
    {
      id: 'alternative_method',
      title: 'Alternative Method',
      description: 'Try a different approach',
      icon: <ArrowRightOutlined />,
      color: '#faad14',
      steps: ['Identify alternatives', 'Select method', 'Execute alternative', 'Verify result'],
      estimatedTime: '3 minutes',
      successRate: 0.7
    },
    {
      id: 'contact_support',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: <PhoneOutlined />,
      color: '#722ed1',
      steps: ['Document issue', 'Contact support', 'Wait for response', 'Follow instructions'],
      estimatedTime: '15 minutes',
      successRate: 0.95
    }
  ];

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setRecoveryProgress(0);
      setIsRecovering(false);
      setRecoveryResult(null);
      setSelectedRecoveryOption(null);
    }
  }, [visible]);

  const getErrorCategory = (error) => {
    if (!error) return 'unknown';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('validation') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('memory') || message.includes('stack')) {
      return 'memory';
    }
    
    return 'general';
  };

  const getRecommendedRecovery = (errorCategory) => {
    const recommendations = {
      network: 'auto_retry',
      permission: 'contact_support',
      validation: 'manual_retry',
      timeout: 'auto_retry',
      memory: 'alternative_method',
      general: 'auto_retry',
      unknown: 'manual_retry'
    };
    
    return recommendations[errorCategory] || 'auto_retry';
  };

  const errorCategory = getErrorCategory(error);
  const recommendedRecoveryOption = getRecommendedRecovery(errorCategory);

  const handleRecoveryOptionSelect = (option) => {
    setSelectedRecoveryOption(option);
    setCurrentStep(1);
  };

  const handleStartRecovery = async () => {
    if (!selectedRecoveryOption) return;
    
    setIsRecovering(true);
    setRecoveryProgress(0);
    
    const option = recoveryOptions.find(opt => opt.id === selectedRecoveryOption);
    
    try {
      // Simulate recovery process
      for (let i = 0; i < option.steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRecoveryProgress(((i + 1) / option.steps.length) * 100);
      }
      
      // Simulate success/failure based on success rate
      const success = Math.random() < option.successRate;
      
      setRecoveryResult({
        success,
        message: success 
          ? 'Recovery completed successfully!' 
          : 'Recovery failed. Please try another option.',
        timestamp: new Date().toISOString()
      });
      
      setCurrentStep(2);

    } catch {
      setRecoveryResult({
        success: false,
        message: 'Recovery process encountered an error.',
        timestamp: new Date().toISOString()
      });
      setCurrentStep(2);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRetry = () => {
    onRetry?.();
    onClose();
  };

  const handleContactSupport = () => {
    onContactSupport?.();
    onClose();
  };

  const handleGoHome = () => {
    onGoHome?.();
    onClose();
  };

  const renderErrorAnalysis = () => {
    return (
      <div>
        <Alert
          message="Error Detected"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>{error?.message || 'An unexpected error occurred.'}</Text>
              <Space>
                <Tag color="warning">Category: {errorCategory}</Tag>
                <Tag color="blue">Recommended: {recommendedRecoveryOption.title}</Tag>
              </Space>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Title level={4}>Recovery Options</Title>
        <List
          dataSource={recoveryOptions}
          renderItem={(option) => (
            <List.Item
              actions={[
                <Button
                  type={option.id === recommendedRecoveryOption ? 'primary' : 'default'}
                  icon={option.icon}
                  onClick={() => handleRecoveryOptionSelect(option.id)}
                  key={option.id}
                >
                  {option.id === recommendedRecoveryOption ? 'Recommended' : 'Select'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Badge color={option.color} />}
                title={
                  <Space>
                    {option.title}
                    {option.id === recommendedRecoveryOption && (
                      <Tag color="green">Recommended</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>{option.description}</Text>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined /> {option.estimatedTime}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Success rate: {(option.successRate * 100).toFixed(0)}%
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  const renderRecoveryProcess = () => {
    const option = recoveryOptions.find(opt => opt.id === selectedRecoveryOption);

    return (
      <div>
        <Title level={4}>
          <Space>
            {option.icon}
            {option.title}
          </Space>
        </Title>

        <Paragraph type="secondary">
          {option.description}
        </Paragraph>

        <Steps
          current={isRecovering ? Math.floor((recoveryProgress / 100) * option.steps.length) : option.steps.length}
          size="small"
          style={{ marginBottom: '24px' }}
        >
          {option.steps.map((step, index) => (
            <Step
              key={index}
              title={step}
              icon={isRecovering && index === Math.floor((recoveryProgress / 100) * option.steps.length) ?
                <SyncOutlined spin /> : undefined}
            />
          ))}
        </Steps>

        {isRecovering ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LottieSpinner size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Recovering... {recoveryProgress.toFixed(0)}%</Text>
              <Progress
                percent={recoveryProgress}
                status="active"
                style={{ marginTop: '8px' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Space direction="vertical">
              <Text>Ready to start recovery process</Text>
              <Button
                type="primary"
                size="large"
                icon={option.icon}
                onClick={handleStartRecovery}
              >
                Start Recovery
              </Button>
            </Space>
          </div>
        )}
      </div>
    );
  };

  const renderRecoveryResult = () => {
    if (!recoveryResult) return null;

    return (
      <Result
        status={recoveryResult.success ? 'success' : 'error'}
        title={recoveryResult.success ? 'Recovery Successful' : 'Recovery Failed'}
        subTitle={recoveryResult.message}
        extra={[
          recoveryResult.success ? [
            <Button type="primary" key="retry" onClick={handleRetry}>
              Continue
            </Button>,
            <Button key="close" onClick={onClose}>
              Close
            </Button>
          ] : [
            <Button type="primary" key="retry" onClick={() => setCurrentStep(0)}>
              Try Another Option
            </Button>,
            <Button key="support" onClick={handleContactSupport}>
              Contact Support
            </Button>,
            <Button key="home" onClick={handleGoHome}>
              Go to Dashboard
            </Button>
          ]
        ]}
      />
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderErrorAnalysis();
      case 1:
        return renderRecoveryProcess();
      case 2:
        return renderRecoveryResult();
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined />
          <span>Error Recovery</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        currentStep === 0 ? [
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
          <Button key="retry" icon={<ReloadOutlined />} onClick={handleRetry}>
            Simple Retry
          </Button>,
          <Button key="support" icon={<PhoneOutlined />} onClick={handleContactSupport}>
            Contact Support
          </Button>
        ] : currentStep === 1 ? [
          <Button key="back" onClick={() => setCurrentStep(0)}>
            Back
          </Button>,
          <Button 
            key="cancel" 
            onClick={onClose}
            disabled={isRecovering}
          >
            Cancel
          </Button>
        ] : null
      }
    >
      <div style={{ minHeight: '400px' }}>
        {renderStepContent()}
      </div>
    </Modal>
  );
};

export default ErrorRecoveryModal;
