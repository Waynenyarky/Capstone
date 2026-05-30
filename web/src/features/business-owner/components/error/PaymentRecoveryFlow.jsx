import { useState, useEffect } from 'react';
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import {
  Modal,
  Button,
  Space,
  Typography,
  Steps,
  Card,
  Alert,
  List,
  Tag,
  Divider,
  Result,
  Select,
  Input,
  DatePicker,
  Progress,
  Badge
} from 'antd';
import {
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentRecoveryFlow = ({ 
  visible, 
  onClose, 
  paymentError, 
  onPaymentRetry,
  onAlternativePayment,
  onContactSupport 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [recoveryMethod, setRecoveryMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});

  // Payment recovery methods
  const recoveryMethods = [
    {
      id: 'retry_same',
      title: 'Retry Same Method',
      description: 'Try the same payment method again',
      icon: <SyncOutlined />,
      color: '#1890ff',
      steps: ['Verify payment details', 'Retry transaction', 'Confirm payment'],
      estimatedTime: '2 minutes',
      successRate: 0.7,
      fee: 0
    },
    {
      id: 'alternative_card',
      title: 'Alternative Card',
      description: 'Use a different credit/debit card',
      icon: <CreditCardOutlined />,
      color: '#52c41a',
      steps: ['Enter new card details', 'Verify card', 'Process payment'],
      estimatedTime: '3 minutes',
      successRate: 0.85,
      fee: 0
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer',
      description: 'Transfer directly from your bank account',
      icon: <BankOutlined />,
      color: '#faad14',
      steps: ['Enter bank details', 'Authorize transfer', 'Confirm payment'],
      estimatedTime: '5 minutes',
      successRate: 0.9,
      fee: 15
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      description: 'Pay using GCash, PayMaya, or other mobile wallets',
      icon: <MobileOutlined />,
      color: '#722ed1',
      steps: ['Select wallet', 'Enter number', 'Confirm payment'],
      estimatedTime: '1 minute',
      successRate: 0.95,
      fee: 5
    },
    {
      id: 'office_payment',
      title: 'Pay at Office',
      description: 'Pay in person at LGU office',
      icon: <PhoneOutlined />,
      color: '#13c2c2',
      steps: ['Visit office', 'Present reference', 'Make payment'],
      estimatedTime: '30 minutes',
      successRate: 1.0,
      fee: 0
    }
  ];

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setRecoveryMethod(null);
      setIsProcessing(false);
      setRecoveryResult(null);
      setPaymentDetails({});
    }
  }, [visible]);

  const getErrorAnalysis = (error) => {
    if (!error) return { category: 'unknown', suggestions: ['retry_same', 'alternative_card'] };
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('insufficient funds')) {
      return { 
        category: 'insufficient_funds', 
        suggestions: ['alternative_card', 'bank_transfer', 'mobile_money'] 
      };
    }
    if (message.includes('card declined')) {
      return { 
        category: 'card_declined', 
        suggestions: ['alternative_card', 'bank_transfer', 'mobile_money'] 
      };
    }
    if (message.includes('network') || message.includes('timeout')) {
      return { 
        category: 'network', 
        suggestions: ['retry_same', 'alternative_card'] 
      };
    }
    if (message.includes('fraud') || message.includes('suspicious')) {
      return { 
        category: 'fraud_detection', 
        suggestions: ['bank_transfer', 'mobile_money', 'office_payment'] 
      };
    }
    
    return { 
      category: 'general', 
      suggestions: ['retry_same', 'alternative_card', 'bank_transfer'] 
    };
  };

  const errorAnalysis = getErrorAnalysis(paymentError);

  const handleRecoveryMethodSelect = (methodId) => {
    setRecoveryMethod(methodId);
    setCurrentStep(1);
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const method = recoveryMethods.find(m => m.id === recoveryMethod);
      const success = Math.random() < method.successRate;
      
      setRecoveryResult({
        success,
        message: success 
          ? `Payment completed successfully using ${method.title}!` 
          : `Payment failed. Please try another method.`,
        method: method.title,
        amount: paymentDetails.amount || 0,
        fee: method.fee,
        timestamp: new Date().toISOString()
      });
      
      setCurrentStep(3);
      
    } catch (error) {
      setRecoveryResult({
        success: false,
        message: 'Payment processing encountered an error.',
        timestamp: new Date().toISOString()
      });
      setCurrentStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderErrorAnalysis();
      case 1:
        return renderMethodSelection();
      case 2:
        return renderPaymentProcessing();
      case 3:
        return renderPaymentResult();
      default:
        return null;
    }
  };

  const renderErrorAnalysis = () => {
    return (
      <div>
        <Alert
          message="Payment Failed"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>{paymentError?.message || 'Payment processing failed.'}</Text>
              <Space>
                <Tag color="warning">Category: {errorAnalysis.category}</Tag>
                <Tag color="blue">Amount: ₱{(paymentError?.amount || 0).toLocaleString()}</Tag>
              </Space>
            </Space>
          }
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Title level={4}>Recommended Recovery Options</Title>
        <List
          dataSource={recoveryMethods.filter(method => 
            errorAnalysis.suggestions.includes(method.id)
          )}
          renderItem={(method) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  icon={method.icon}
                  onClick={() => handleRecoveryMethodSelect(method.id)}
                  key={method.id}
                >
                  Select
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Badge color={method.color} />}
                title={
                  <Space>
                    {method.title}
                    <Tag color="green">Recommended</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>{method.description}</Text>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined /> {method.estimatedTime}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Success rate: {(method.successRate * 100).toFixed(0)}%
                      </Text>
                      {method.fee > 0 && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Fee: ₱{method.fee}
                        </Text>
                      )}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />

        <Divider />

        <Title level={5}>All Payment Methods</Title>
        <List
          size="small"
          dataSource={recoveryMethods}
          renderItem={(method) => (
            <List.Item
              actions={[
                <Button
                  type={errorAnalysis.suggestions.includes(method.id) ? 'primary' : 'default'}
                  size="small"
                  onClick={() => handleRecoveryMethodSelect(method.id)}
                  key={method.id}
                >
                  {errorAnalysis.suggestions.includes(method.id) ? 'Recommended' : 'Select'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={method.icon}
                title={method.title}
                description={
                  <Space>
                    <Text type="secondary">{method.description}</Text>
                    {method.fee > 0 && (
                      <Tag color="orange">+₱{method.fee}</Tag>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  const renderMethodSelection = () => {
    const method = recoveryMethods.find(m => m.id === recoveryMethod);
    
    return (
      <div>
        <Title level={4}>
          <Space>
            {method.icon}
            {method.title}
          </Space>
        </Title>
        
        <Paragraph type="secondary">
          {method.description}
        </Paragraph>

        <Steps
          current={0}
          size="small"
          style={{ marginBottom: '24px' }}
        >
          {method.steps.map((step, index) => (
            <Step key={index} title={step} />
          ))}
        </Steps>

        <Card title="Payment Details" style={{ marginBottom: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Amount:</Text>
              <Input
                prefix={<DollarOutlined />}
                value={paymentDetails.amount || paymentError?.amount || ''}
                onChange={(e) => handlePaymentDetailsChange('amount', e.target.value)}
                placeholder="Enter amount"
                style={{ marginTop: '8px' }}
              />
            </div>

            {method.id === 'alternative_card' && (
              <div>
                <Text strong>Card Number:</Text>
                <Input
                  placeholder="1234 5678 9012 3456"
                  onChange={(e) => handlePaymentDetailsChange('cardNumber', e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>
            )}

            {method.id === 'bank_transfer' && (
              <div>
                <Text strong>Bank Account:</Text>
                <Input
                  placeholder="Account number"
                  onChange={(e) => handlePaymentDetailsChange('accountNumber', e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>
            )}

            {method.id === 'mobile_money' && (
              <div>
                <Text strong>Mobile Number:</Text>
                <Input
                  placeholder="09XX XXX XXXX"
                  onChange={(e) => handlePaymentDetailsChange('mobileNumber', e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>
            )}

            {method.fee > 0 && (
              <Alert
                message={`Additional fee: ₱${method.fee}`}
                description={`Total amount: ₱${((paymentDetails.amount || paymentError?.amount || 0) + method.fee).toLocaleString()}`}
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>

        <Space>
          <Button onClick={() => setCurrentStep(0)}>
            Back
          </Button>
          <Button 
            type="primary" 
            icon={method.icon}
            onClick={handleProcessPayment}
            loading={isProcessing}
          >
            Process Payment
          </Button>
        </Space>
      </div>
    );
  };

  const renderPaymentProcessing = () => {
    const method = recoveryMethods.find(m => m.id === recoveryMethod);
    
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <LottieSpinner size="large" />
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>Processing Payment</Title>
          <Paragraph type="secondary">
            Please wait while we process your payment using {method.title}
          </Paragraph>
          <Progress
            percent={isProcessing ? 75 : 100}
            status={isProcessing ? 'active' : 'success'}
            style={{ marginTop: '16px' }}
          />
        </div>
      </div>
    );
  };

  const renderPaymentResult = () => {
    if (!recoveryResult) return null;

    return (
      <Result
        status={recoveryResult.success ? 'success' : 'error'}
        title={recoveryResult.success ? 'Payment Successful' : 'Payment Failed'}
        subTitle={recoveryResult.message}
        extra={[
          recoveryResult.success ? [
            <Button type="primary" key="continue" onClick={onClose}>
              Continue
            </Button>,
            <Button key="receipt" icon={<FileTextOutlined />}>
              View Receipt
            </Button>
          ] : [
            <Button type="primary" key="retry" onClick={() => setCurrentStep(0)}>
              Try Another Method
            </Button>,
            <Button key="support" icon={<PhoneOutlined />} onClick={onContactSupport}>
              Contact Support
            </Button>,
            <Button key="office" onClick={() => handleRecoveryMethodSelect('office_payment')}>
              Pay at Office
            </Button>
          ]
        ]}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <CreditCardOutlined />
          <span>Payment Recovery</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        currentStep === 0 ? [
          <Button key="cancel" onClick={onClose}>
            Cancel
          </Button>,
          <Button key="support" icon={<PhoneOutlined />} onClick={onContactSupport}>
            Contact Support
          </Button>
        ] : currentStep === 1 ? [
          <Button key="back" onClick={() => setCurrentStep(0)}>
            Back
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

export default PaymentRecoveryFlow;
