import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  List,
  Card,
  Progress,
  Alert,
  Checkbox,
  Table,
  Tag,
  Divider,
  Steps,
  Result,
  Spin,
  Select,
  Input,
  DatePicker,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  UploadOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  AlertOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { RangePicker } = DatePicker;

const BulkOperations = ({ 
  visible, 
  onClose, 
  selectedBusinesses, 
  operationType,
  onComplete 
}) => {
  const { businesses, updateBusinessProfile } = useBusiness();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [operationData, setOperationData] = useState({});
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);

  // Get selected businesses details
  const selectedBusinessDetails = businesses?.filter(b => 
    selectedBusinesses.includes(b.id)
  ) || [];

  // Operation configurations
  const operationConfigs = {
    renewal: {
      title: 'Bulk Renewal',
      description: 'Renew multiple business permits at once',
      icon: <CalendarOutlined />,
      steps: ['Select Renewal Period', 'Review Businesses', 'Process Renewals', 'Complete'],
      color: '#1890ff'
    },
    suspension: {
      title: 'Bulk Suspension',
      description: 'Temporarily suspend multiple businesses',
      icon: <AlertOutlined />,
      steps: ['Select Reason', 'Review Businesses', 'Process Suspensions', 'Complete'],
      color: '#faad14'
    },
    payment: {
      title: 'Bulk Payment Processing',
      description: 'Process payments for multiple businesses',
      icon: <DollarOutlined />,
      steps: ['Select Payment Type', 'Enter Amounts', 'Process Payments', 'Complete'],
      color: '#52c41a'
    },
    document: {
      title: 'Bulk Document Upload',
      description: 'Upload documents for multiple businesses',
      icon: <FileTextOutlined />,
      steps: ['Select Documents', 'Upload Files', 'Process Uploads', 'Complete'],
      color: '#722ed1'
    },
    export: {
      title: 'Bulk Data Export',
      description: 'Export business data in various formats',
      icon: <DownloadOutlined />,
      steps: ['Select Data Type', 'Choose Format', 'Generate Export', 'Download'],
      color: '#13c2c2'
    }
  };

  const config = operationConfigs[operationType] || operationConfigs.renewal;

  // Initialize operation data based on type
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setResults([]);
      setErrors([]);
      
      // Set initial operation data
      switch (operationType) {
        case 'renewal':
          setOperationData({
            renewalPeriod: 'annual',
            renewalDate: null,
            autoRenew: false
          });
          break;
        case 'suspension':
          setOperationData({
            reason: '',
            suspensionPeriod: '30',
            effectiveDate: null
          });
          break;
        case 'payment':
          setOperationData({
            paymentType: 'permit_fee',
            amount: '',
            dueDate: null,
            description: ''
          });
          break;
        case 'document':
          setOperationData({
            documentType: 'permit_renewal',
            files: [],
            description: ''
          });
          break;
        case 'export':
          setOperationData({
            dataType: 'all',
            format: 'excel',
            dateRange: null
          });
          break;
        default:
          setOperationData({});
      }
    }
  }, [visible, operationType]);

  // Handle next step
  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleProcessOperation();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Process the bulk operation
  const handleProcessOperation = async () => {
    setProcessing(true);
    setResults([]);
    setErrors([]);

    try {
      // Simulate processing each business
      const processPromises = selectedBusinessDetails.map(async (business, index) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        if (success) {
          return {
            businessId: business.id,
            businessName: business.businessName,
            status: 'success',
            message: `${config.title} completed successfully`,
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            businessId: business.id,
            businessName: business.businessName,
            status: 'error',
            message: `Failed to process ${config.title.toLowerCase()}`,
            timestamp: new Date().toISOString()
          };
        }
      });

      const operationResults = await Promise.all(processPromises);
      setResults(operationResults);
      
      // Separate successful and failed operations
      const successful = operationResults.filter(r => r.status === 'success');
      const failed = operationResults.filter(r => r.status === 'error');
      
      if (failed.length > 0) {
        setErrors(failed);
      }

      // Move to results step
      setCurrentStep(config.steps.length - 1);
      
      // Show completion message
      message.success(
        `${config.title} completed: ${successful.length} successful, ${failed.length} failed`
      );
      
      // Call completion callback
      onComplete?.({
        successful: successful.length,
        failed: failed.length,
        results: operationResults
      });

    } catch (error) {
      console.error('Bulk operation error:', error);
      message.error('An error occurred during processing');
    } finally {
      setProcessing(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderConfigurationStep();
      case 1:
        return renderReviewStep();
      case 2:
        return renderProcessingStep();
      case 3:
        return renderResultsStep();
      default:
        return null;
    }
  };

  // Render configuration step
  const renderConfigurationStep = () => {
    switch (operationType) {
      case 'renewal':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Renewal Period</Text>
              <Select
                value={operationData.renewalPeriod}
                onChange={(value) => setOperationData(prev => ({ ...prev, renewalPeriod: value }))}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <Option value="annual">Annual</Option>
                <Option value="biennial">Biennial</Option>
                <Option value="custom">Custom Period</Option>
              </Select>
            </div>
            <div>
              <Text strong>Renewal Date</Text>
              <DatePicker
                value={operationData.renewalDate}
                onChange={(date) => setOperationData(prev => ({ ...prev, renewalDate: date }))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            <div>
              <Checkbox
                checked={operationData.autoRenew}
                onChange={(e) => setOperationData(prev => ({ ...prev, autoRenew: e.target.checked }))}
              >
                Enable automatic renewal
              </Checkbox>
            </div>
          </Space>
        );
      
      case 'suspension':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Suspension Reason</Text>
              <Select
                value={operationData.reason}
                onChange={(value) => setOperationData(prev => ({ ...prev, reason: value }))}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <Option value="compliance">Compliance Issues</Option>
                <Option value="payment">Payment Delinquency</Option>
                <Option value="regulation">Regulatory Violation</Option>
                <Option value="other">Other Reason</Option>
              </Select>
            </div>
            <div>
              <Text strong>Suspension Period (days)</Text>
              <Input
                type="number"
                value={operationData.suspensionPeriod}
                onChange={(e) => setOperationData(prev => ({ ...prev, suspensionPeriod: e.target.value }))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            <div>
              <Text strong>Effective Date</Text>
              <DatePicker
                value={operationData.effectiveDate}
                onChange={(date) => setOperationData(prev => ({ ...prev, effectiveDate: date }))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
          </Space>
        );
      
      case 'payment':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Payment Type</Text>
              <Select
                value={operationData.paymentType}
                onChange={(value) => setOperationData(prev => ({ ...prev, paymentType: value }))}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <Option value="permit_fee">Permit Fee</Option>
                <Option value="penalty">Penalty</Option>
                <Option value="inspection_fee">Inspection Fee</Option>
                <Option value="other">Other</Option>
              </Select>
            </div>
            <div>
              <Text strong>Amount per Business</Text>
              <Input
                type="number"
                value={operationData.amount}
                onChange={(e) => setOperationData(prev => ({ ...prev, amount: e.target.value }))}
                style={{ width: '100%', marginTop: '8px' }}
                prefix="₱"
              />
            </div>
            <div>
              <Text strong>Due Date</Text>
              <DatePicker
                value={operationData.dueDate}
                onChange={(date) => setOperationData(prev => ({ ...prev, dueDate: date }))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
          </Space>
        );
      
      case 'export':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Data Type</Text>
              <Select
                value={operationData.dataType}
                onChange={(value) => setOperationData(prev => ({ ...prev, dataType: value }))}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <Option value="all">All Business Data</Option>
                <Option value="financial">Financial Records</Option>
                <Option value="compliance">Compliance Status</Option>
                <Option value="documents">Documents</Option>
              </Select>
            </div>
            <div>
              <Text strong>Export Format</Text>
              <Select
                value={operationData.format}
                onChange={(value) => setOperationData(prev => ({ ...prev, format: value }))}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <Option value="excel">Excel</Option>
                <Option value="csv">CSV</Option>
                <Option value="pdf">PDF</Option>
                <Option value="json">JSON</Option>
              </Select>
            </div>
            <div>
              <Text strong>Date Range</Text>
              <RangePicker
                value={operationData.dateRange}
                onChange={(dates) => setOperationData(prev => ({ ...prev, dateRange: dates }))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
          </Space>
        );
      
      default:
        return <Text>Select operation parameters</Text>;
    }
  };

  // Render review step
  const renderReviewStep = () => {
    return (
      <div>
        <Alert
          message={`Review ${config.title} Details`}
          description={`You are about to process ${config.title.toLowerCase()} for ${selectedBusinessDetails.length} businesses. Please review the details below.`}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          dataSource={selectedBusinessDetails}
          columns={[
            {
              title: 'Business Name',
              dataIndex: 'businessName',
              key: 'businessName'
            },
            {
              title: 'Current Status',
              dataIndex: 'applicationStatus',
              key: 'status',
              render: (status) => (
                <Tag color={status === 'approved' ? 'success' : 'processing'}>
                  {status}
                </Tag>
              )
            },
            {
              title: 'Permit #',
              dataIndex: 'permitNumber',
              key: 'permitNumber'
            }
          ]}
          pagination={false}
          size="small"
        />
        
        <Divider />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Operation Summary:</Text>
          <List
            size="small"
            dataSource={[
              `Operation: ${config.title}`,
              `Businesses: ${selectedBusinessDetails.length}`,
              `Type: ${operationData.renewalPeriod || operationData.reason || operationData.paymentType || operationData.dataType || 'N/A'}`,
              `Estimated Time: ${selectedBusinessDetails.length * 2} minutes`
            ]}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
        </Space>
      </div>
    );
  };

  // Render processing step
  const renderProcessingStep = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Title level={4}>Processing {config.title}</Title>
          <Paragraph type="secondary">
            Please wait while we process {selectedBusinessDetails.length} businesses...
          </Paragraph>
          <Progress
            percent={processing ? 75 : 0}
            status={processing ? 'active' : 'success'}
            style={{ marginTop: '16px' }}
          />
        </div>
      </div>
    );
  };

  // Render results step
  const renderResultsStep = () => {
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error');

    return (
      <div>
        {failed.length === 0 ? (
          <Result
            status="success"
            title={`${config.title} Completed Successfully`}
            subTitle={`All ${selectedBusinessDetails.length} businesses processed successfully`}
            extra={[
              <Button key="view" type="primary">
                View Details
              </Button>,
              <Button key="close" onClick={onClose}>
                Close
              </Button>
            ]}
          />
        ) : (
          <Result
            status="warning"
            title={`${config.title} Completed with Issues`}
            subTitle={`${successful.length} successful, ${failed.length} failed`}
            extra={[
              <Button key="retry" type="primary" onClick={() => setCurrentStep(0)}>
                Retry Failed
              </Button>,
              <Button key="close" onClick={onClose}>
                Close
              </Button>
            ]}
          />
        )}
        
        {results.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Table
              dataSource={results}
              columns={[
                {
                  title: 'Business',
                  dataIndex: 'businessName',
                  key: 'businessName'
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'success' ? 'success' : 'error'} icon={
                      status === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />
                    }>
                      {status}
                    </Tag>
                  )
                },
                {
                  title: 'Message',
                  dataIndex: 'message',
                  key: 'message'
                }
              ]}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          {config.icon}
          <span>{config.title}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="previous" 
          onClick={handlePrevious}
          disabled={currentStep === 0 || processing}
        >
          Previous
        </Button>,
        <Button 
          key="next" 
          type="primary" 
          onClick={handleNext}
          loading={processing}
          disabled={currentStep === config.steps.length - 1}
        >
          {currentStep === config.steps.length - 2 ? 'Process' : 'Next'}
        </Button>
      ]}
    >
      <div style={{ minHeight: '400px' }}>
        <Steps current={currentStep} style={{ marginBottom: '24px' }}>
          {config.steps.map((step, index) => (
            <Step key={index} title={step} />
          ))}
        </Steps>
        
        {renderStepContent()}
      </div>
    </Modal>
  );
};

export default BulkOperations;
