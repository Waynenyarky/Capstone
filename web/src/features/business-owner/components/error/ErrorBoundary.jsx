import React from 'react';
import {
  Result,
  Button,
  Typography,
  Space,
  Card,
  Alert,
  Collapse,
  List,
  Tag
} from 'antd';
import {
  BugOutlined,
  ReloadOutlined,
  HomeOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and error reporting service
    this.setState({
      error,
      errorInfo
    });

    // Log detailed error information
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In production, this would send to error reporting service
    const errorReport = {
      errorId: this.state.errorId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundaryStack: errorInfo.errorBoundaryStack,
        errorBoundaryName: errorInfo.errorBoundaryName
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      businessId: this.getCurrentBusinessId()
    };

    // Mock error reporting - in production, send to service like Sentry, LogRocket, etc.
    console.error('Error Report:', errorReport);

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      localStorage.setItem('errorReports', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to store error report:', e);
    }
  };

  getCurrentUserId() {
    // Try to get current user ID from various sources
    try {
      if (window.auth?.currentUser?.uid) {
        return window.auth.currentUser.uid;
      }
      if (window.localStorage.getItem('userId')) {
        return window.localStorage.getItem('userId');
      }
      return 'anonymous';
    } catch (e) {
      return 'anonymous';
    }
  }

  getCurrentBusinessId() {
    // Try to get current business ID from various sources
    try {
      if (window.localStorage.getItem('currentBusinessId')) {
        return window.localStorage.getItem('currentBusinessId');
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  handleRetry = () => {
    const { retryCount, maxRetries } = this.state;
    
    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1,
        hasError: false,
        error: null,
        errorInfo: null
      }));
    } else {
      // Max retries reached, show different message
      this.setState({
        hasError: true,
        error: new Error('Maximum retry attempts reached')
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleContactSupport = () => {
    // Open support contact or redirect to support page
    window.location.href = '/support';
  };

  getErrorCategory = (error) => {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
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

  getErrorCategoryConfig = (category) => {
    const configs = {
      network: {
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your internet connection.',
        icon: <ExclamationCircleOutlined />,
        color: '#faad14',
        actions: ['retry', 'refresh', 'contact']
      },
      permission: {
        title: 'Permission Error',
        description: 'You don\'t have permission to perform this action.',
        icon: <ExclamationCircleOutlined />,
        color: '#f5222d',
        actions: ['home', 'contact']
      },
      validation: {
        title: 'Validation Error',
        description: 'Please check your input and try again.',
        icon: <ExclamationCircleOutlined />,
        color: '#faad14',
        actions: ['retry', 'contact']
      },
      timeout: {
        title: 'Timeout Error',
        description: 'The request took too long to complete. Please try again.',
        icon: <ExclamationCircleOutlined />,
        color: '#faad14',
        actions: ['retry', 'contact']
      },
      memory: {
        title: 'Memory Error',
        description: 'The application ran out of memory. Please refresh the page.',
        icon: <ExclamationCircleOutlined />,
        color: '#f5222d',
        actions: ['refresh', 'contact']
      },
      general: {
        title: 'Application Error',
        description: 'An unexpected error occurred. Our team has been notified.',
        icon: <BugOutlined />,
        color: '#f5222d',
        actions: ['retry', 'home', 'contact']
      },
      unknown: {
        title: 'Unknown Error',
        description: 'An unexpected error occurred.',
        icon: <BugOutlined />,
        color: '#f5222d',
        actions: ['retry', 'home', 'contact']
      }
    };

    return configs[category] || configs.unknown;
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, retryCount, maxRetries } = this.state;
      const category = this.getErrorCategory(error);
      const config = this.getErrorCategoryConfig(category);

      return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          <Card>
            <Result
              status="error"
              icon={config.icon}
              title={config.title}
              subTitle={
                <Space direction="vertical">
                  <Text>{config.description}</Text>
                  <Text type="secondary">
                    Error ID: {errorId} | Retry: {retryCount}/{maxRetries}
                  </Text>
                </Space>
              }
              extra={
                <Space wrap>
                  {config.actions.includes('retry') && retryCount < maxRetries && (
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={this.handleRetry}
                    >
                      Try Again
                    </Button>
                  )}
                  {config.actions.includes('refresh') && (
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  )}
                  {config.actions.includes('home') && (
                    <Button
                      icon={<HomeOutlined />}
                      onClick={this.handleGoHome}
                    >
                      Go to Dashboard
                    </Button>
                  )}
                  {config.actions.includes('contact') && (
                    <Button
                      icon={<MailOutlined />}
                      onClick={this.handleContactSupport}
                    >
                      Contact Support
                    </Button>
                  )}
                  <Button
                    type="text"
                    onClick={this.handleReset}
                  >
                    Reset Error
                  </Button>
                </Space>
              }
            />

            {/* Error Details for Development */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '24px' }}>
                <Collapse>
                  <Panel header="Error Details (Development Mode)" key="error-details">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Error Message:</Text>
                        <Text code>{error?.message}</Text>
                      </div>
                      
                      <div>
                        <Text strong>Component Stack:</Text>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>

                      <div>
                        <Text strong>Error Stack:</Text>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {error?.stack}
                        </pre>
                      </div>

                      <div>
                        <Text strong>Category:</Text>
                        <Tag color={config.color}>{category}</Tag>
                      </div>

                      <div>
                        <Text strong>User Agent:</Text>
                        <Text code style={{ fontSize: '11px' }}>
                          {navigator.userAgent}
                        </Text>
                      </div>

                      <div>
                        <Text strong>URL:</Text>
                        <Text code style={{ fontSize: '11px' }}>
                          {window.location.href}
                        </Text>
                      </div>
                    </Space>
                  </Panel>
                </Collapse>
              </div>
            )}

            {/* Support Information */}
            <div style={{ marginTop: '24px' }}>
              <Alert
                message="Need Help?"
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>
                      Our support team is available to help you resolve this issue.
                    </Text>
                    <Space>
                      <Button type="text" icon={<MailOutlined />} size="small">
                        Email: support@bizclear.gov.ph
                      </Button>
                      <Button type="text" icon={<PhoneOutlined />} size="small">
                        Phone: (02) 123-4567
                      </Button>
                    </Space>
                  </Space>
                }
                type="info"
                showIcon
              />
            </div>

            {/* Recent Errors */}
            <div style={{ marginTop: '16px' }}>
              <Title level={5}>Recent Errors</Title>
              <List
                size="small"
                dataSource={this.getRecentErrors()}
                renderItem={(error) => (
                  <List.Item>
                    <Space>
                      <Text code>{error.errorId}</Text>
                      <Text>{error.error.message}</Text>
                      <Text type="secondary">
                        {new Date(error.timestamp).toLocaleString()}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  getRecentErrors() {
    try {
      const errors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      return errors.slice(-5).reverse(); // Last 5 errors, newest first
    } catch (e) {
      return [];
    }
  }
}

export default ErrorBoundary;
