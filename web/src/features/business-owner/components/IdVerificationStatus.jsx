import React, { useEffect } from 'react'
import { Alert, Space, Typography, Tag, Tooltip, Progress, Spin } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

/**
 * ID Verification Status Component
 * 
 * Displays the status of AI-based ID verification.
 * Auto-polls when status is "pending" to check for updates.
 * 
 * IMPORTANT: This verification is based on visual appearance only.
 * No government database verification is performed.
 */
export default function IdVerificationStatus({ aiVerification, compact = false, onRefresh }) {
  // Auto-poll when status is pending
  useEffect(() => {
    if (aiVerification?.status === 'pending' && onRefresh) {
      const interval = setInterval(() => {
        onRefresh()
      }, 5000) // Poll every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [aiVerification?.status, onRefresh])

  if (!aiVerification) {
    return null
  }

  const { status, legit, confidence, checkedAt, notes } = aiVerification

  // Status configurations
  const statusConfig = {
    pending: {
      type: 'info',
      icon: <ClockCircleOutlined />,
      title: 'Verification Pending',
      description: 'Your ID document is being verified. This may take a few moments.',
      tagColor: 'processing',
      tagText: 'Pending',
    },
    verified: {
      type: 'success',
      icon: <CheckCircleOutlined />,
      title: 'ID Verified',
      description: 'Your ID document has passed automated verification.',
      tagColor: 'success',
      tagText: 'Verified',
    },
    failed: {
      type: 'error',
      icon: <CloseCircleOutlined />,
      title: 'Verification Failed',
      description: 'Your ID document did not pass automated verification. Please ensure you uploaded a clear, valid government-issued ID.',
      tagColor: 'error',
      tagText: 'Failed',
    },
    needs_review: {
      type: 'warning',
      icon: <ExclamationCircleOutlined />,
      title: 'Manual Review Required',
      description: 'Your ID document requires manual review by an officer. This does not prevent you from proceeding.',
      tagColor: 'warning',
      tagText: 'Needs Review',
    },
    error: {
      type: 'warning',
      icon: <ExclamationCircleOutlined />,
      title: 'Verification Unavailable',
      description: 'Automated verification could not be completed. Your application will be reviewed manually.',
      tagColor: 'default',
      tagText: 'Unavailable',
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  // Compact view (just a tag)
  if (compact) {
    return (
      <Tooltip title={config.description}>
        <Tag
          icon={status === 'pending' ? <SyncOutlined spin /> : config.icon}
          color={config.tagColor}
        >
          {config.tagText}
        </Tag>
      </Tooltip>
    )
  }

  // Full view with details
  const confidencePercent = Math.round((confidence || 0) * 100)
  const confidenceColor = confidence >= 0.7 ? '#52c41a' : confidence >= 0.5 ? '#faad14' : '#ff4d4f'

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      <Alert
        message={
          <Space>
            <SafetyCertificateOutlined />
            <span>{config.title}</span>
            {status === 'pending' && <Spin size="small" />}
          </Space>
        }
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>{config.description}</Paragraph>
            
            {status !== 'pending' && status !== 'error' && confidence !== undefined && confidence !== null && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Confidence Score:</Text>
                <Progress
                  percent={confidencePercent}
                  size="small"
                  strokeColor={confidenceColor}
                  format={(percent) => `${percent}%`}
                  style={{ width: 150, marginLeft: 8, display: 'inline-flex' }}
                />
              </div>
            )}
            
            {checkedAt && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Checked: {new Date(checkedAt).toLocaleString()}
              </Text>
            )}
            
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  This verification is based on visual appearance only. No government database verification is performed.
                </Text>
              </Space>
            </div>
          </div>
        }
        type={config.type}
        icon={status === 'pending' ? <SyncOutlined spin /> : config.icon}
        showIcon
      />
    </div>
  )
}
