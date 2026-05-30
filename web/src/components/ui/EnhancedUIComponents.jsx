import { useState, useEffect } from 'react'
import { 
  Skeleton, Alert, Button, Space, Typography, 
  Progress, Empty, Result, Card, Badge, Tooltip, notification, Modal, Drawer
} from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { 
  ReloadOutlined, CloseOutlined, WarningOutlined,
  CheckCircleOutlined, InfoCircleOutlined, LoadingOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

/**
 * Enhanced Loading States and Skeletons
 */

export const EnhancedSkeleton = ({ 
  type = 'default', 
  rows = 3, 
  avatar = false, 
  active = true,
  loading = true,
  children 
}) => {
  if (!loading) return children

  const skeletonTypes = {
    default: <Skeleton active={active} paragraph={{ rows }} avatar={avatar} />,
    card: (
      <Card>
        <Skeleton active={active} avatar paragraph={{ rows }} />
      </Card>
    ),
    list: (
      <div>
        {[...Array(rows)].map((_, index) => (
          <Skeleton key={index} active={active} avatar paragraph={{ rows: 1 }} />
        ))}
      </div>
    ),
    table: (
      <div>
        {[...Array(rows)].map((_, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <Skeleton active={active} paragraph={{ rows: 1, width: '100%' }} />
          </div>
        ))}
      </div>
    ),
    form: (
      <div>
        <Skeleton active={active} paragraph={{ rows: rows, width: ['40%', '60%', '30%', '70%'] }} />
      </div>
    )
  }

  return skeletonTypes[type] || skeletonTypes.default
}

export const LoadingState = ({ 
  type = 'spinner', 
  tip = 'Loading...', 
  size = 'default',
  fullscreen = false,
  children 
}) => {
  const loadingComponents = {
    spinner: <LottieSpinner size={size} tip={tip} />,
    dots: (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : 24 }} spin />
        <div style={{ marginTop: 8 }}>{tip}</div>
      </div>
    ),
    progress: (
      <div style={{ padding: '20px' }}>
        <Progress percent={100} status="active" showInfo={false} />
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
          {tip}
        </Text>
      </div>
    ),
    skeleton: (
      <div style={{ padding: '20px' }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    )
  }

  const content = loadingComponents[type] || loadingComponents.spinner

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        {content}
      </div>
    )
  }

  return content
}

/**
 * Enhanced Error Handling Components
 */

export const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleError = (error, errorInfo) => {
      console.error('Error caught by boundary:', error, errorInfo)
      setError(error)
      setHasError(true)
    }

    // Setup error handling
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    if (fallback) {
      return fallback
    }

    return (
      <Result
        status="error"
        title="Something went wrong"
        subTitle="An unexpected error occurred. Please try again later."
        extra={[
          <Button type="primary" key="retry" onClick={() => window.location.reload()}>
            Reload Page
          </Button>,
          <Button key="report" onClick={() => console.error('Error reported:', error)}>
            Report Issue
          </Button>
        ]}
      />
    )
  }

  return children
}

export const ErrorDisplay = ({ 
  error, 
  type = 'alert', 
  title, 
  action, 
  dismissible = true,
  onDismiss 
}) => {
  const [visible, setVisible] = useState(true)

  const handleDismiss = () => {
    setVisible(false)
    if (onDismiss) onDismiss()
  }

  if (!visible) return null

  const errorComponents = {
    alert: (
      <Alert
        message={title || 'Error'}
        description={error?.message || 'An unexpected error occurred'}
        type="error"
        showIcon
        closable={dismissible}
        onClose={handleDismiss}
        action={action}
      />
    ),
    result: (
      <Result
        status="error"
        title={title || 'Error'}
        subTitle={error?.message || 'An unexpected error occurred'}
        extra={action}
      />
    ),
    modal: (
      <Modal
        title={title || 'Error'}
        open={true}
        onCancel={handleDismiss}
        footer={[
          <Button key="close" onClick={handleDismiss}>
            Close
          </Button>,
          ...(action ? [action] : [])
        ]}
      >
        <Text>{error?.message || 'An unexpected error occurred'}</Text>
      </Modal>
    ),
    drawer: (
      <Drawer
        title={title || 'Error Details'}
        open={true}
        onClose={handleDismiss}
        placement="bottom"
        height={200}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{error?.message || 'An unexpected error occurred'}</Text>
          {action}
        </Space>
      </Drawer>
    )
  }

  return errorComponents[type] || errorComponents.alert
}

/**
 * Enhanced Empty States
 */

export const EnhancedEmpty = ({ 
  type = 'default', 
  title, 
  description, 
  action, 
  image 
}) => {
  const emptyTypes = {
    default: (
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction="vertical">
            <Text strong>{title || 'No data available'}</Text>
            <Text type="secondary">{description || 'There is no data to display'}</Text>
          </Space>
        }
      />
    ),
    noData: (
      <Result
        icon={<InfoCircleOutlined />}
        title={title || 'No Data'}
        subTitle={description || 'No data is currently available'}
        extra={action}
      />
    ),
    noSearch: (
      <Result
        icon={<SearchOutlined />}
        title="No results found"
        subTitle={description || 'Try adjusting your search terms'}
        extra={action}
      />
    ),
    noNetwork: (
      <Result
        icon={<DisconnectOutlined />}
        title="No connection"
        subTitle={description || 'Check your internet connection and try again'}
        extra={action}
      />
    ),
    error: (
      <Result
        status="error"
        title={title || 'Something went wrong'}
        subTitle={description || 'Please try again later'}
        extra={action}
      />
    )
  }

  return emptyTypes[type] || emptyTypes.default
}

/**
 * Enhanced Status Indicators
 */

export const StatusIndicator = ({ 
  status, 
  type = 'badge', 
  text, 
  tooltip, 
  size = 'default' 
}) => {
  const statusConfig = {
    success: { color: 'success', icon: <CheckCircleOutlined /> },
    warning: { color: 'warning', icon: <WarningOutlined /> },
    error: { color: 'error', icon: <CloseOutlined /> },
    processing: { color: 'processing', icon: <LoadingOutlined /> },
    default: { color: 'default', icon: <InfoCircleOutlined /> }
  }

  const config = statusConfig[status] || statusConfig.default

  const content = (
    <Space size="small">
      {type !== 'badge' && config.icon}
      <Text>{text || status}</Text>
    </Space>
  )

  if (type === 'badge') {
    return (
      <Tooltip title={tooltip}>
        <Badge status={config.color} text={text || status} />
      </Tooltip>
    )
  }

  if (type === 'tag') {
    return (
      <Tooltip title={tooltip}>
        <Tag color={config.color} icon={config.icon} size={size}>
          {text || status}
        </Tag>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={tooltip}>
      {content}
    </Tooltip>
  )
}

/**
 * Enhanced Progress Indicators
 */

export const ProgressIndicator = ({ 
  type = 'line', 
  percent, 
  status = 'normal', 
  showInfo = true,
  strokeWidth = 8,
  format,
  ...props 
}) => {
  const progressTypes = {
    line: (
      <Progress
        type="line"
        percent={percent}
        status={status}
        showInfo={showInfo}
        strokeWidth={strokeWidth}
        format={format}
        {...props}
      />
    ),
    circle: (
      <Progress
        type="circle"
        percent={percent}
        status={status}
        showInfo={showInfo}
        format={format}
        {...props}
      />
    ),
    dashboard: (
      <div style={{ textAlign: 'center' }}>
        <Progress
          type="circle"
          percent={percent}
          status={status}
          width={120}
          format={format}
          {...props}
        />
        {showInfo && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">{format ? format(percent) : `${percent}%`}</Text>
          </div>
        )}
      </div>
    ),
    steps: (
      <Progress
        type="line"
        percent={percent}
        status={status}
        showInfo={showInfo}
        steps={10}
        strokeWidth={strokeWidth}
        format={format}
        {...props}
      />
    )
  }

  return progressTypes[type] || progressTypes.line
}

/**
 * Enhanced Notification System
 */

export const useEnhancedNotifications = () => {
  const showNotification = (type, message, description, options = {}) => {
    const notificationConfig = {
      success: {
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 4.5
      },
      error: {
        icon: <CloseOutlined style={{ color: '#ff4d4f' }} />,
        duration: 0 // Don't auto-close errors
      },
    warning: {
        icon: <WarningOutlined style={{ color: '#faad14' }} />,
        duration: 6
      },
      info: {
        icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
        duration: 4.5
      }
    }

    const config = notificationConfig[type] || notificationConfig.info

    notification[type]({
      message,
      description,
      icon: config.icon,
      duration: options.duration || config.duration,
      placement: options.placement || 'topRight',
      ...options
    })
  }

  const showSuccess = (message, description, options) => 
    showNotification('success', message, description, options)

  const showError = (message, description, options) => 
    showNotification('error', message, description, options)

  const showWarning = (message, description, options) => 
    showNotification('warning', message, description, options)

  const showInfo = (message, description, options) => 
    showNotification('info', message, description, options)

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification
  }
}

/**
 * Enhanced Form Validation Feedback
 */

export const ValidationFeedback = ({ 
  errors, 
  warnings, 
  touched, 
  showSummary = true 
}) => {
  const hasErrors = errors && Object.keys(errors).length > 0
  const hasWarnings = warnings && Object.keys(warnings).length > 0

  if (!hasErrors && !hasWarnings) return null

  const errorCount = hasErrors ? Object.keys(errors).length : 0
  const warningCount = hasWarnings ? Object.keys(warnings).length : 0

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      {showSummary && (
        <Alert
          message={
            <Space>
              {hasErrors && <Text type="danger">{errorCount} error{errorCount > 1 ? 's' : ''}</Text>}
              {hasErrors && hasWarnings && <Text>, </Text>}
              {hasWarnings && <Text type="warning">{warningCount} warning{warningCount > 1 ? 's' : ''}</Text>}
            </Space>
          }
          type={hasErrors ? 'error' : 'warning'}
          showIcon
          closable
        />
      )}
      
      {hasErrors && (
        <Space direction="vertical" style={{ width: '100%' }}>
          {Object.entries(errors).map(([field, error]) => (
            <Alert
              key={field}
              message={field}
              description={error}
              type="error"
              size="small"
              showIcon
            />
          ))}
        </Space>
      )}
      
      {hasWarnings && (
        <Space direction="vertical" style={{ width: '100%' }}>
          {Object.entries(warnings).map(([field, warning]) => (
            <Alert
              key={field}
              message={field}
              description={warning}
              type="warning"
              size="small"
              showIcon
            />
          ))}
        </Space>
      )}
    </Space>
  )
}

/**
 * Enhanced Data Loading Wrapper
 */

export const DataLoadingWrapper = ({ 
  loading, 
  error, 
  data, 
  children, 
  loadingComponent, 
  errorComponent, 
  emptyComponent,
  retry 
}) => {
  if (loading) {
    return loadingComponent || <LoadingState type="skeleton" rows={3} />
  }

  if (error) {
    return errorComponent || (
      <ErrorDisplay
        error={error}
        title="Failed to load data"
        action={
          <Button type="primary" icon={<ReloadOutlined />} onClick={retry}>
            Retry
          </Button>
        }
      />
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <EnhancedEmpty
        type="noData"
        title="No data available"
        description="There is no data to display at this time"
        action={
          <Button type="primary" icon={<ReloadOutlined />} onClick={retry}>
            Refresh
          </Button>
        }
      />
    )
  }

  return children
}

/**
 * Micro-interaction Components
 */

export const InteractiveButton = ({ 
  children, 
  loading, 
  success, 
  error, 
  ...props 
}) => {
  const [state, setState] = useState('default')

  useEffect(() => {
    if (loading) setState('loading')
    else if (success) setState('success')
    else if (error) setState('error')
    else setState('default')
  }, [loading, success, error])

  const stateConfig = {
    default: { type: 'primary', icon: null },
    loading: { type: 'primary', icon: <LoadingOutlined />, loading: true },
    success: { type: 'primary', icon: <CheckCircleOutlined />, style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } },
    error: { type: 'primary', icon: <CloseOutlined />, style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' } }
  }

  const config = stateConfig[state] || stateConfig.default

  return (
    <Button {...config} {...props}>
      {children}
    </Button>
  )
}

export default {
  EnhancedSkeleton,
  LoadingState,
  ErrorBoundary,
  ErrorDisplay,
  EnhancedEmpty,
  StatusIndicator,
  ProgressIndicator,
  useEnhancedNotifications,
  ValidationFeedback,
  DataLoadingWrapper,
  InteractiveButton
}
