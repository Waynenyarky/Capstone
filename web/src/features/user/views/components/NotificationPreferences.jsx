import { useState, useEffect } from 'react'
import { Switch, Typography, Space, Row, Col, theme, Badge, Tooltip } from 'antd'
import { BellOutlined, MailOutlined, SafetyCertificateOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text } = Typography

const notificationTypes = [
  {
    key: 'emailOnPasswordChange',
    title: 'Password Changes',
    description: 'Get notified when your password is changed or reset',
    icon: <LockOutlined />,
    color: '#ff4d4f',
    category: 'Security'
  },
  {
    key: 'emailOnEmailChange',
    title: 'Email Address Changes',
    description: 'Get notified when your email address is updated',
    icon: <MailOutlined />,
    color: '#1890ff',
    category: 'Account'
  },
  {
    key: 'emailOnMfaChange',
    title: 'MFA Changes',
    description: 'Get notified when multi-factor authentication is enabled or disabled',
    icon: <SafetyCertificateOutlined />,
    color: '#52c41a',
    category: 'Security'
  },
  {
    key: 'emailOnProfileUpdate',
    title: 'Profile Updates',
    description: 'Get notified when your profile information is updated',
    icon: <BellOutlined />,
    color: '#722ed1',
    category: 'Account'
  },
  {
    key: 'emailOnCriticalChanges',
    title: 'Critical Security Changes',
    description: 'Always receive notifications for critical security changes (cannot be disabled)',
    icon: <SafetyCertificateOutlined />,
    color: '#faad14',
    category: 'Security',
    required: true
  }
]

export default function NotificationPreferences() {
  const { token } = theme.useToken()
  const { success } = useNotifier()
  const [preferences, setPreferences] = useState({
    emailOnPasswordChange: true,
    emailOnEmailChange: true,
    emailOnMfaChange: true,
    emailOnProfileUpdate: false,
    emailOnCriticalChanges: true,
  })

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
      <div style={{ marginBottom: 32 }}>
        <Title level={4} style={{ margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined style={{ color: token.colorPrimary }} />
          Email Notification Preferences
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Manage which email notifications you receive about your account activity and security changes.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {notificationTypes.map((item) => {
          const isEnabled = preferences[item.key]
          const isRequired = item.required || false

          return (
            <Col xs={24} sm={24} md={12} lg={12} key={item.key}>
              <div
                style={{
                  padding: 20,
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${isEnabled ? token.colorPrimary : token.colorBorderSecondary}`,
                  backgroundColor: isEnabled ? token.colorPrimaryBg : token.colorBgContainer,
                  transition: 'all 0.3s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background accent */}
                {isEnabled && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: `linear-gradient(90deg, ${item.color}, ${token.colorPrimary})`,
                    }}
                  />
                )}

                <div style={{ paddingTop: isEnabled ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: token.borderRadius,
                          backgroundColor: isEnabled ? `${item.color}15` : token.colorFillTertiary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          color: isEnabled ? item.color : token.colorTextTertiary,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 15, color: isEnabled ? token.colorText : token.colorTextSecondary }}>
                            {item.title}
                          </Text>
                          {isRequired && (
                            <Tooltip title="This notification cannot be disabled for security reasons">
                              <Badge status="warning" />
                            </Tooltip>
                          )}
                        </div>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 13,
                            lineHeight: 1.5,
                            display: 'block',
                            color: isEnabled ? token.colorTextSecondary : token.colorTextTertiary
                          }}
                        >
                          {item.description}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Category: <Text strong style={{ fontSize: 12 }}>{item.category}</Text>
                      </Text>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onChange={() => !isRequired && handleToggle(item.key)}
                      disabled={isRequired}
                      size="default"
                    />
                  </div>
                </div>
              </div>
            </Col>
          )
        })}
      </Row>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: token.borderRadius,
          backgroundColor: token.colorInfoBg,
          border: `1px solid ${token.colorInfoBorder}`
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <InfoCircleOutlined style={{ color: token.colorInfo, fontSize: 18, marginTop: 2 }} />
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4, color: token.colorInfo }}>
              About Email Notifications
            </Text>
            <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
              Email notifications help you stay informed about important account changes. Critical security notifications cannot be disabled to ensure your account remains secure. All notifications are sent to your registered email address.
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}
