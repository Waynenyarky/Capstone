import { useState, useEffect } from 'react'
import { Card, Switch, Typography, Space, Divider, message } from 'antd'
import { BellOutlined, MailOutlined, SafetyCertificateOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text, Paragraph } = Typography

export default function NotificationPreferences() {
  const { currentUser } = useAuthSession()
  const { success, error } = useNotifier()
  const [preferences, setPreferences] = useState({
    emailOnPasswordChange: true,
    emailOnEmailChange: true,
    emailOnMfaChange: true,
    emailOnProfileUpdate: false,
    emailOnCriticalChanges: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage or API
    const saved = localStorage.getItem('notification_preferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse notification preferences:', e)
      }
    }
  }, [])

  const handleToggle = async (key) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] }
    setPreferences(newPreferences)
    
    // Save to localStorage
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences))
    
    // TODO: Save to backend API when available
    // try {
    //   await updateNotificationPreferences(newPreferences, currentUser, role)
    //   success('Notification preferences updated')
    // } catch (err) {
    //   error(err, 'Failed to update preferences')
    //   setPreferences(preferences) // Revert on error
    // }
    
    success('Notification preferences updated')
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Email Notifications</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Choose which email notifications you want to receive about your account changes.
      </Paragraph>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <Space>
            <LockOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <div>
              <Text strong>Password Changes</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Get notified when your password is changed</Text>
            </div>
          </Space>
          <Switch
            checked={preferences.emailOnPasswordChange}
            onChange={() => handleToggle('emailOnPasswordChange')}
          />
        </div>

        <Divider style={{ margin: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <Space>
            <MailOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <div>
              <Text strong>Email Address Changes</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Get notified when your email address is changed</Text>
            </div>
          </Space>
          <Switch
            checked={preferences.emailOnEmailChange}
            onChange={() => handleToggle('emailOnEmailChange')}
          />
        </div>

        <Divider style={{ margin: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <Space>
            <SafetyCertificateOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <div>
              <Text strong>MFA Changes</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Get notified when MFA is enabled or disabled</Text>
            </div>
          </Space>
          <Switch
            checked={preferences.emailOnMfaChange}
            onChange={() => handleToggle('emailOnMfaChange')}
          />
        </div>

        <Divider style={{ margin: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <Space>
            <BellOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <div>
              <Text strong>Profile Updates</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Get notified when your profile information is updated</Text>
            </div>
          </Space>
          <Switch
            checked={preferences.emailOnProfileUpdate}
            onChange={() => handleToggle('emailOnProfileUpdate')}
          />
        </div>

        <Divider style={{ margin: 0 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <Space>
            <SafetyCertificateOutlined style={{ fontSize: 18, color: '#faad14' }} />
            <div>
              <Text strong>Critical Security Changes</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Always receive notifications for critical security changes</Text>
            </div>
          </Space>
          <Switch
            checked={preferences.emailOnCriticalChanges}
            onChange={() => handleToggle('emailOnCriticalChanges')}
            disabled
          />
        </div>
      </Space>
    </div>
  )
}
