import React from 'react'
import { Button, Space, Typography, Alert, List, Tag, Popconfirm, Empty, Modal, theme, Steps, Divider, Grid } from 'antd'
import { 
  SafetyCertificateOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  SecurityScanOutlined,
  CheckCircleFilled,
  MobileOutlined,
  AppleOutlined,
  WindowsOutlined
} from '@ant-design/icons'
import useWebAuthn from '../hooks/useWebAuthn.js'
import { useAuthSession } from '../hooks'
import { useNotifier } from '@/shared/notifications.js'
import { getProfile } from '../services/authService.js'
import { listCredentials, deleteCredential, deleteAllCredentials } from '../services/webauthnService.js'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function PasskeyManager() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const { currentTheme } = useAppTheme()
  const isDarkTheme = currentTheme === THEMES.DARK
  const { currentUser, login } = useAuthSession()
  const { register } = useWebAuthn()
  const { success, error: notifyError, info } = useNotifier()
  const [registering, setRegistering] = React.useState(false)
  const [credentials, setCredentials] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [deleting, setDeleting] = React.useState(false)
  const [disableModalVisible, setDisableModalVisible] = React.useState(false)
  const [guideModalVisible, setGuideModalVisible] = React.useState(false)

  const email = currentUser?.email
  const hasPasskeys = credentials.length > 0

  // Fetch registered passkeys from backend
  const fetchCredentials = React.useCallback(async () => {
    if (!email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await listCredentials()
      setCredentials(response.credentials || [])
    } catch (err) {
      console.error('Failed to fetch credentials:', err)
      // On error, still set empty array
      setCredentials([])
    } finally {
      setLoading(false)
    }
  }, [email])

  React.useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  // Refresh user data from backend
  const refreshUserData = React.useCallback(async () => {
    try {
      const updated = await getProfile()
      if (currentUser?.token && updated && !updated.token) {
        updated.token = currentUser.token
      }
      const isRemembered = !!localStorage.getItem('auth__currentUser')
      login(updated, { remember: isRemembered })
    } catch (refreshErr) {
      console.error('Failed to refresh user data:', refreshErr)
    }
  }, [currentUser?.token, login])

  const handleRegister = async () => {
    if (!email) {
      notifyError('Email is required to register a passkey')
      return
    }

    // Show guide modal first
    setGuideModalVisible(true)
  }

  const handleStartRegistration = async () => {
    setGuideModalVisible(false)
    await performRegister()
  }

  const performRegister = async () => {
    if (!email) return

    try {
      setRegistering(true)
      await register({ email })
      success('Passkey registered successfully!')
      
      // Refresh credentials and user data
      await fetchCredentials()
      await refreshUserData()
    } catch (e) {
      // Handle user cancellation with a friendly message
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code
      
      if (e?.name === 'NotAllowedError' || errorCode === 'user_cancelled') {
        // User cancelled - this is expected behavior, show friendly info message
        console.log('[PasskeyManager] User cancelled passkey registration')
        info('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
        return
      }
      
      console.error('Passkey registration failed', e)
      const errMsg = e?.message || 'Failed to register passkey. Please try again.'
      notifyError(errMsg)
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async (credId) => {
    if (!credId) return

    try {
      setDeleting(true)
      await deleteCredential(credId)
      success('Passkey deleted successfully')
      
      // Refresh credentials and user data
      await fetchCredentials()
      await refreshUserData()
    } catch (e) {
      console.error('Failed to delete passkey:', e)
      const errMsg = e?.message || 'Failed to delete passkey. Please try again.'
      notifyError(errMsg)
    } finally {
      setDeleting(false)
    }
  }

  const handleDisableAll = async () => {
    try {
      setDeleting(true)
      await deleteAllCredentials()
      success('Passkey authentication disabled successfully')
      setDisableModalVisible(false)
      
      // Refresh credentials and user data
      await fetchCredentials()
      await refreshUserData()
    } catch (e) {
      console.error('Failed to disable passkey authentication:', e)
      const errMsg = e?.message || 'Failed to disable passkey authentication. Please try again.'
      notifyError(errMsg)
    } finally {
      setDeleting(false)
    }
  }

  // Display status similar to LoggedInMfaManager
  return (
    <div>

      {/* Status Card */}
      <div style={{ 
        padding: 24, 
        background: hasPasskeys 
            ? (isDarkTheme ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed') 
            : (isDarkTheme ? 'rgba(250, 173, 20, 0.15)' : '#fffbe6'), 
        border: `1px solid ${hasPasskeys 
            ? (isDarkTheme ? '#237804' : '#b7eb8f') 
            : (isDarkTheme ? '#d48806' : '#ffe58f')}`,
        borderRadius: token.borderRadiusLG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, maxWidth: '70%' }}>
          {hasPasskeys ? (
            <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52c41a', marginTop: 4 }} />
          ) : (
            <SecurityScanOutlined style={{ fontSize: 32, color: '#faad14', marginTop: 4 }} />
          )}
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
              {hasPasskeys ? 'Passkey Authentication is active' : 'Passkey Authentication is not enabled'}
            </Title>
            <Text type="secondary">
              {hasPasskeys 
                ? `You have ${credentials.length} passkey${credentials.length > 1 ? 's' : ''} registered. You can use them to sign in.` 
                : 'Enable passwordless authentication using Windows Hello, Touch ID, Face ID, or security keys.'}
            </Text>
          </div>
        </div>
        
        <div>
          {hasPasskeys ? (
            <Button 
              danger 
              onClick={() => setDisableModalVisible(true)} 
              disabled={deleting}
              icon={<LockOutlined />}
            >
              Disable Passkeys
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleRegister} 
              disabled={registering || loading}
              icon={<SafetyCertificateOutlined />}
            >
              Register Passkey
            </Button>
          )}
        </div>
      </div>

      {/* List of credentials */}
      {hasPasskeys && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 12 }}>Registered Passkeys</Title>
          <List
            dataSource={credentials}
            loading={loading}
            locale={{ emptyText: <Empty description="No passkeys registered" /> }}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  credentials.length > 1 ? (
                    <Popconfirm
                      title="Delete Passkey"
                      description="Are you sure you want to delete this passkey? You won't be able to use it to sign in anymore."
                      onConfirm={() => handleDelete(item.credId)}
                      okText="Yes, Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                      disabled={deleting}
                    >
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        size="small"
                        loading={deleting}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  ) : null
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                  title={
                    <Space>
                      <span>Passkey {index + 1}</span>
                      <Tag color="success">Active</Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Credential ID: {item.credId?.substring(0, 20)}...
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Register another button (only show if already has passkeys) */}
      {hasPasskeys && (
        <Button
          type="default"
          icon={<PlusOutlined />}
          onClick={handleRegister}
          loading={registering}
          disabled={registering}
        >
          Register Another Passkey
        </Button>
      )}

      {/* Registration Guide Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
            <span>Register Your Passkey</span>
          </Space>
        }
        open={guideModalVisible}
        onCancel={() => setGuideModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setGuideModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="start" type="primary" onClick={handleStartRegistration} loading={registering}>
            Start Registration
          </Button>
        ]}
        width={isMobile ? '90%' : 520}
        centered
        styles={{
          body: {
            padding: '12px 0'
          }
        }}
      >
        <div style={{ padding: '4px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Before You Begin"
            description="Ensure your device supports passkeys (Windows Hello, Touch ID, Face ID, or security keys) and you're using a compatible browser."
            style={{ marginBottom: 12, fontSize: 13 }}
            size="small"
          />

          <Title level={5} style={{ marginBottom: 10, fontSize: 15 }}>Quick Guide</Title>
          
          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: <Text strong style={{ fontSize: 13 }}>Device Compatibility</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Supported: Windows Hello • Mac Touch ID/Face ID • Mobile biometrics • Security keys
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Start Registration</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Click "Start Registration" below. Your browser will prompt you to create a passkey.
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Select Save Location</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Choose <strong>This device</strong> (personal) or <strong>Security key</strong> (shared). You can register multiple passkeys later.
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Authenticate</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Use your device's biometrics, PIN, or security key to complete registration.
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Done!</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Your passkey will be registered successfully. You can register multiple passkeys for different devices.
                  </Text>
                ),
                icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
              }
            ]}
          />

          <Divider style={{ margin: '12px 0' }} />

          <Alert
            type="success"
            showIcon={false}
            message={<Text strong style={{ fontSize: 13 }}>Benefits: No passwords • More secure • Works across devices • Fast authentication</Text>}
            style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '8px 12px', margin: 0 }}
            size="small"
          />
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal
        title="Disable Passkey Authentication"
        open={disableModalVisible}
        onOk={handleDisableAll}
        onCancel={() => setDisableModalVisible(false)}
        okText="Disable Passkeys"
        okButtonProps={{ danger: true, loading: deleting }}
        cancelButtonProps={{ disabled: deleting }}
        centered
      >
        <Alert 
          type="warning" 
          showIcon
          message="This will disable all passkeys"
          description="All registered passkeys will be removed. You will no longer be able to use passkeys to sign in. You can register new passkeys at any time."
          style={{ marginBottom: 16 }}
        />
        <Paragraph>
          Are you sure you want to disable Passkey Authentication? This action cannot be undone.
        </Paragraph>
      </Modal>
    </div>
  )
}