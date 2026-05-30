import { useState, useEffect } from 'react'
import { Progress, Button, Space, Typography, Card, Tag, Alert } from 'antd'
import { 
  SyncOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons'
import { 
  getSyncProgress, 
  addSyncProgressListener, 
  syncOfflineData, 
  getSyncStatistics,
  isOnline
} from '../services/offlineService'

const { Text, Title } = Typography

const SyncProgressIndicator = ({ businessId, onSyncComplete }) => {
  const [syncProgress, setSyncProgress] = useState({})
  const [syncStats, setSyncStats] = useState({})
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline())
  const [syncing, setSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Initialize sync progress
    setSyncProgress(getSyncProgress())
    setSyncStats(getSyncStatistics())

    // Listen for sync progress updates
    const cleanupListener = addSyncProgressListener((progress) => {
      setSyncProgress(progress)
      
      if (progress.status === 'completed') {
        setSyncing(false)
        setSyncStats(getSyncStatistics())
        if (onSyncComplete) {
          onSyncComplete(progress)
        }
      }
    })

    // Monitor connection status
    const handleOnline = () => setIsOnlineStatus(true)
    const handleOffline = () => setIsOnlineStatus(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setSyncStats(getSyncStatistics())
    }, 5000)

    return () => {
      cleanupListener()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(statsInterval)
    }
  }, [businessId, onSyncComplete])

  const handleManualSync = async () => {
    if (syncing || !isOnlineStatus || syncProgress.total === 0) return

    setSyncing(true)
    try {
      await syncOfflineData(businessId)
    } catch (error) {
      console.error('Manual sync failed:', error)
      setSyncing(false)
    }
  }

  const getSyncStatusColor = () => {
    if (syncing) return 'processing'
    if (syncProgress.failed > 0) return 'exception'
    if (syncProgress.total > 0 && syncProgress.completed === syncProgress.total) return 'success'
    return 'normal'
  }

  const getSyncStatusText = () => {
    if (syncing) return 'Syncing...'
    if (!isOnlineStatus) return 'Offline'
    if (syncProgress.total === 0) return 'Up to date'
    if (syncProgress.failed > 0) return `${syncProgress.failed} failed`
    return `${syncProgress.completed}/${syncProgress.total} synced`
  }

  const getSyncIcon = () => {
    if (syncing) return <SyncOutlined spin />
    if (!isOnlineStatus) return <DisconnectOutlined />
    if (syncProgress.failed > 0) return <ExclamationCircleOutlined />
    if (syncProgress.total > 0 && syncProgress.completed === syncProgress.total) return <CheckCircleOutlined />
    return <WifiOutlined />
  }

  const renderSyncDetails = () => {
    if (!showDetails) return null

    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Queue Status:</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">High: {syncStats.priorityBreakdown?.high || 0}</Tag>
              <Tag color="green">Normal: {syncStats.priorityBreakdown?.normal || 0}</Tag>
              <Tag color="orange">Low: {syncStats.priorityBreakdown?.low || 0}</Tag>
            </div>
          </div>

          {syncStats.pendingConflicts > 0 && (
            <Alert
              message={`${syncStats.pendingConflicts} conflicts need resolution`}
              type="warning"
              size="small"
              showIcon
            />
          )}

          <div>
            <Text type="secondary">
              Storage used: {(syncStats.storageSize / 1024).toFixed(1)} KB
            </Text>
          </div>

          {syncStats.lastSync && (
            <div>
              <Text type="secondary">
                Last sync: {new Date(syncStats.lastSync).toLocaleString()}
              </Text>
            </div>
          )}
        </Space>
      </Card>
    )
  }

  if (syncStats.queueLength === 0 && isOnlineStatus && !syncing) {
    return null // Don't show if everything is up to date
  }

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      title={
        <Space>
          {getSyncIcon()}
          <Text strong>Sync Status</Text>
          <Tag color={getSyncStatusColor()}>
            {getSyncStatusText()}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          {syncProgress.total > 0 && (
            <Button
              type="text"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Details'}
            </Button>
          )}
          
          {syncProgress.total > 0 && isOnlineStatus && !syncing && (
            <Button
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleManualSync}
            >
              Sync Now
            </Button>
          )}
        </Space>
      }
    >
      {!isOnlineStatus ? (
        <Alert
          message="You're offline"
          description="Changes will be synced when you reconnect"
          type="info"
          showIcon
        />
      ) : syncProgress.total > 0 ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={syncProgress.total > 0 ? Math.round((syncProgress.completed / syncProgress.total) * 100) : 0}
            status={getSyncStatusColor()}
            format={() => `${syncProgress.completed}/${syncProgress.total}`}
          />
          
          {syncProgress.failed > 0 && (
            <Text type="danger">
              {syncProgress.failed} items failed to sync
            </Text>
          )}
        </Space>
      ) : (
        <Text type="success">All data is up to date</Text>
      )}

      {renderSyncDetails()}
    </Card>
  )
}

export default SyncProgressIndicator
