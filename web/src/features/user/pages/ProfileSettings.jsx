import React, { useState, useEffect } from 'react'
import { Layout, Typography, Card, Tabs, Row, Col, Avatar, Tag, Space, Grid, Upload, message, theme, Slider, InputNumber, Radio, Tooltip, ColorPicker, Collapse } from 'antd'
import { UserOutlined, SafetyCertificateOutlined, SettingOutlined, ControlOutlined, CameraOutlined, LoadingOutlined, BgColorsOutlined, CheckCircleFilled, InfoCircleOutlined, TabletOutlined, ScanOutlined, CheckOutlined, KeyOutlined, EditOutlined, MailOutlined, DeleteOutlined, WarningOutlined, LockOutlined, BellOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import useProfile from '@/features/authentication/hooks/useProfile'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import ActiveSessions from '@/features/user/components/ActiveSessions.jsx'
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'
import PasskeyManager from '@/features/authentication/components/PasskeyManager.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import LoggedInPasswordChangeFlow from '@/features/authentication/flows/LoggedInPasswordChangeFlow.jsx'
import DeleteAccountFlow from '@/features/authentication/flows/DeleteAccountFlow.jsx'
import EmailChangeGracePeriod from '@/features/authentication/components/EmailChangeGracePeriod.jsx'
import MfaReenrollmentAlert from '@/features/authentication/components/MfaReenrollmentAlert.jsx'
import IDUploadForm from '@/features/user/components/IDUploadForm.jsx'
import PendingApprovalAlert from '@/features/user/components/PendingApprovalAlert.jsx'
import NotificationPreferences from '@/features/user/components/NotificationPreferences.jsx'
import NotificationHistory from '@/features/user/components/NotificationHistory.jsx'
import AuditHistory from '@/features/user/components/AuditHistory.jsx'
import { uploadUserAvatar } from '@/features/user/services/userService.js'
import { useAuthSession } from '@/features/authentication'
import { resolveAvatarUrl } from '@/lib/utils'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'
import { listCredentials } from '@/features/authentication/services/webauthnService.js'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { useBreakpoint } = Grid

export default function ProfileSettings() {
  const { user } = useProfile()
  const { currentUser, login, role } = useAuthSession()
  const { currentTheme, setTheme, themeOverrides, setThemeOverrides, replaceThemeOverrides, setPreviewTheme, setPreviewOverrides, savedTheme } = useAppTheme()
  const { token } = theme.useToken()
  const [uploading, setUploading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const screens = useBreakpoint()
  const [passkeyEnabled, setPasskeyEnabled] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(true)

  // Staging state for theme selection
  // Initialize with savedTheme to ensure we start with the persisted theme, not a preview
  const [pendingTheme, setPendingTheme] = useState(savedTheme || currentTheme)
  const [pendingOverrides, setPendingOverrides] = useState(themeOverrides)
  const [hoveredTheme, setHoveredTheme] = useState(null)

  // Update local state when global state changes (e.g. initial load)
  React.useEffect(() => {
    // Only update pending theme if the actual SAVED theme changes (e.g. after apply)
    // We do NOT want to update this when currentTheme changes due to a preview
    setPendingTheme(savedTheme)
    setPendingOverrides(themeOverrides)
  }, [savedTheme, themeOverrides])
  
  // Clear previews on unmount
  React.useEffect(() => {
    return () => {
      setPreviewTheme(null);
      setPreviewOverrides(null);
    }
  }, []);

  // Handle preview logic
  const handleMouseEnter = (key) => {
    setHoveredTheme(key);
    setPreviewTheme(key); // Live preview on hover
    
    // If hovering Document, Dark, or Default theme, show its default color (remove colorPrimary override)
    if (key === THEMES.DOCUMENT || key === THEMES.DARK || key === THEMES.DEFAULT) {
        const overridesWithoutColor = { ...pendingOverrides };
        delete overridesWithoutColor.colorPrimary;
        setPreviewOverrides(overridesWithoutColor);
    } else {
        // Ensure we also preview the current pending overrides with the new theme
        setPreviewOverrides(pendingOverrides);
    }
  };

  const handleMouseLeave = () => {
    setHoveredTheme(null);
    setPreviewTheme(pendingTheme); // Revert to selected (pending) theme
    setPreviewOverrides(pendingOverrides);
  };

  const handleSelectTheme = (key) => {
    setPendingTheme(key);
    setPreviewTheme(key); // Keep preview active for selected theme
    
    // If Default, Document or Dark theme is selected, reset Primary Color to default
    // This allows the theme's signature color to take effect, but keeps other overrides
    // and allows the user to customize the color again if they want
    if (key === THEMES.DEFAULT || key === THEMES.DOCUMENT || key === THEMES.DARK) {
      const overridesWithoutColor = { ...pendingOverrides };
      delete overridesWithoutColor.colorPrimary;
      setPendingOverrides(overridesWithoutColor);
      setPreviewOverrides(overridesWithoutColor);
    } else {
      setPreviewOverrides(pendingOverrides);
    }
  };

  const handleApplyTheme = () => {
    setTheme(pendingTheme)
    // Use replaceThemeOverrides to ensure we completely replace the state
    // This is critical for cases where we removed keys (like resetting Primary Color to default)
    // Regular setThemeOverrides only merges updates
    if (replaceThemeOverrides) {
        replaceThemeOverrides(pendingOverrides);
    } else {
        setThemeOverrides(pendingOverrides);
    }
    
    setPreviewTheme(null) // Clear preview state so we use the real applied theme
    setPreviewOverrides(null)
    messageApi.success('Theme applied successfully')
  }

  const handleColorMouseEnter = (color) => {
    setPreviewOverrides({ ...pendingOverrides, colorPrimary: color });
  };

  const handleColorMouseLeave = () => {
    setPreviewOverrides(pendingOverrides);
  };

  const handleColorChange = (value, hex) => {
    // value is the Color object from AntD, hex is the string
    // We can use hex directly
    const colorHex = typeof value === 'string' ? value : value.toHexString();
    const nextOverrides = { ...pendingOverrides, colorPrimary: colorHex };
    setPendingOverrides(nextOverrides);
    setPreviewOverrides(nextOverrides);
  };

  const isMobile = !screens.md

  // Check passkey status
  useEffect(() => {
    let mounted = true
    const checkPasskeyStatus = async () => {
      if (!currentUser?.email) {
        setPasskeyLoading(false)
        return
      }

      try {
        // First check mfaMethod for quick status
        const mfaMethod = String(currentUser?.mfaMethod || '').toLowerCase()
        const isPasskeyMethod = mfaMethod === 'passkey'
        
        if (isPasskeyMethod) {
          setPasskeyEnabled(true)
          setPasskeyLoading(false)
        } else {
          // If mfaMethod is not 'passkey', verify by checking credentials
          try {
            const response = await listCredentials()
            if (mounted) {
              setPasskeyEnabled((response.credentials || []).length > 0)
              setPasskeyLoading(false)
            }
          } catch (err) {
            // If API call fails, fall back to mfaMethod check
            if (mounted) {
              setPasskeyEnabled(false)
              setPasskeyLoading(false)
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setPasskeyEnabled(false)
          setPasskeyLoading(false)
        }
      }
    }

    checkPasskeyStatus()
    return () => { mounted = false }
  }, [currentUser?.email, currentUser?.mfaMethod])

  const brandColor = currentTheme === THEMES.DEFAULT ? '#003a70' : token.colorPrimary
  const headerBackground = currentTheme === THEMES.DEFAULT 
    ? 'linear-gradient(135deg, #003a70 0%, #001529 100%)' 
    : `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorFill} 100%)`

  const initials = React.useMemo(() => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    if (currentUser?.name) {
      return currentUser.name.substring(0, 2).toUpperCase()
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U'
  }, [currentUser])

  const handleAvatarUpload = async ({ file }) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      messageApi.error('You can only upload JPG/PNG/WEBP file!');
      return;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error('Image must be smaller than 2MB!');
      return;
    }

    try {
      setUploading(true)
      const res = await uploadUserAvatar(file, currentUser, role)
      
      if (res?.success) {
        messageApi.success('Profile photo updated successfully')
        const nextUser = { ...currentUser, avatar: res.avatarUrl }
        const isRemembered = !!localStorage.getItem('auth__currentUser')
        login(nextUser, { remember: isRemembered })
      }
    } catch (err) {
      console.error(err)
      messageApi.error('Failed to upload profile photo')
    } finally {
      setUploading(false)
    }
  }

  const themeOptions = [
    { key: THEMES.DEFAULT, label: 'Default', header: '#ffffff', side: '#001529', content: '#f0f2f5', active: '#1677ff', border: '#f0f0f0' },
    { key: THEMES.DARK, label: 'Dark', header: '#141414', side: '#141414', content: '#000000', active: '#177ddc', border: '#303030' },
    { key: THEMES.DOCUMENT, label: 'Document', header: '#E5F8F0', side: '#E5F8F0', content: '#ffffff', active: '#00B96B', border: '#dbece5' },
    { key: THEMES.BLOSSOM, label: 'Blossom', header: '#ffffff', side: '#ffffff', content: '#fff0f6', active: '#eb2f96', border: '#f0f0f0' },
    { key: THEMES.SUNSET, label: 'Sunset', header: '#fff2e8', side: '#fff2e8', content: '#ffffff', active: '#fa541c', border: '#ffece0' },
    { key: THEMES.ROYAL, label: 'Royal', header: '#f9f0ff', side: '#f9f0ff', content: '#ffffff', active: '#722ed1', border: '#f5e6ff' },
  ]
  
  const presetColors = [
    '#001529', '#1677FF', '#722ED1', '#13C2C2', '#52C41A', '#EB2F96', '#F5222D', '#FA8C16', '#FADB14', '#A0D911'
  ];

  const currentPrimaryColor = pendingOverrides.colorPrimary || token.colorPrimary;

  const tabItems = [
    {
      key: 'general',
      label: <span><UserOutlined />General</span>,
      children: (
        <div>
          {/* Personal Information Section */}
          <Card 
            style={{ 
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 0
              }
            }}
          >
            {/* Header Section */}
            <div style={{
              padding: '24px 24px 20px',
              background: token.colorFillAlter,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              borderTopLeftRadius: token.borderRadiusLG,
              borderTopRightRadius: token.borderRadiusLG
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${token.colorPrimary}40`,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${token.colorPrimary}15`
                }}>
                  <EditOutlined style={{ fontSize: 28, color: token.colorPrimary, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0, marginBottom: 8 }}>Personal Information</Title>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                    Update your personal details and profile information. Your profile photo can be updated in the sidebar.
                  </Text>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: 24 }}>
              <PendingApprovalAlert />
              <EditUserProfileForm embedded={true} />
            </div>
          </Card>

          {/* ID Upload Section (Business Owners Only) */}
          {String(role?.slug || role || '').toLowerCase() === 'business_owner' && (
            <Card 
              style={{ 
                marginTop: 24,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              styles={{
                body: {
                  padding: 0
                }
              }}
            >
              {/* Header Section */}
              <div style={{
                padding: '24px 24px 20px',
                background: token.colorFillAlter,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                borderTopLeftRadius: token.borderRadiusLG,
                borderTopRightRadius: token.borderRadiusLG
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${token.colorPrimary}40`,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${token.colorPrimary}15`
                  }}>
                    <SafetyCertificateOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ margin: 0, marginBottom: 8 }}>ID Verification</Title>
                    <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                      Upload your government-issued ID for verification. This helps us verify your identity and comply with regulatory requirements.
                    </Text>
                  </div>
                </div>
              </div>
              
              {/* Content Section */}
              <div style={{ padding: 24 }}>
                <IDUploadForm />
              </div>
            </Card>
          )}
        </div>
      )
    },
    {
      key: 'security',
      label: <span><SafetyCertificateOutlined />Security</span>,
      children: (
        <div>
          {/* Two-Factor Authentication Section */}
          <Card 
            style={{ 
              marginBottom: 32,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 0
              }
            }}
          >
            {/* Header Section */}
            <div style={{
              padding: '24px 24px 20px',
              background: token.colorFillAlter,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              borderTopLeftRadius: token.borderRadiusLG,
              borderTopRightRadius: token.borderRadiusLG
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${token.colorPrimary}40`,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${token.colorPrimary}15`
                }}>
                  <TabletOutlined style={{ fontSize: 28, color: token.colorPrimary, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Title level={4} style={{ margin: 0 }}>Two-Factor Authentication</Title>
                    <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>Authenticator App (TOTP)</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                    Add an extra layer of security by requiring a verification code from your authenticator app (Microsoft Authenticator, Google Authenticator, or Authy) when signing in.
                  </Text>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: 24 }}>
              <MfaReenrollmentAlert />
              <Collapse 
                ghost 
                style={{ marginBottom: 24, background: 'transparent' }}
                items={[{
                  key: 'mfa-steps',
                  label: (
                    <Space>
                      <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                      <Text strong style={{ fontSize: 14 }}>How to Enable Two-Factor Authentication</Text>
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: 16, background: token.colorFillAlter, borderRadius: token.borderRadius, marginTop: 8 }}>
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {[
                          { num: 1, title: 'Download an Authenticator App', desc: 'Install Microsoft Authenticator, Google Authenticator, or Authy on your smartphone (free on iOS and Android).' },
                          { num: 2, title: 'Click "Setup MFA" Button', desc: 'Click the "Setup MFA" button below to start the setup process.' },
                          { num: 3, title: 'Scan the QR Code', desc: 'Open your authenticator app and scan the QR code, or manually enter the setup key.' },
                          { num: 4, title: 'Enter Verification Code', desc: 'Enter the 6-digit code from your app to verify and complete setup. Save your backup key securely.' },
                          { num: 5, title: 'Complete Setup', desc: 'Two-Factor Authentication is now enabled. You will need a code from your app each time you sign in.' }
                        ].map((step) => (
                          <div key={step.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ 
                              minWidth: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              background: token.colorPrimary, 
                              color: '#fff', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 14,
                              flexShrink: 0,
                              boxShadow: `0 2px 4px ${token.colorPrimary}30`
                            }}>
                              {step.num}
                            </div>
                            <div style={{ flex: 1, paddingTop: 2 }}>
                              <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{step.title}</Text>
                              <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                                {step.desc}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </Space>
                    </div>
                  )
                }]}
              />
              
              <LoggedInMfaManager />
            </div>
          </Card>

          {/* Passkey Authentication Section */}
          <Card 
            style={{ 
              marginBottom: 32,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 0
              }
            }}
          >
            {/* Header Section */}
            <div style={{
              padding: '24px 24px 20px',
              background: token.colorFillAlter,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              borderTopLeftRadius: token.borderRadiusLG,
              borderTopRightRadius: token.borderRadiusLG
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${token.colorPrimary}40`,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${token.colorPrimary}15`
                }}>
                  <KeyOutlined style={{ fontSize: 28, color: token.colorPrimary, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Title level={4} style={{ margin: 0 }}>Passkey Authentication</Title>
                    <Tag color="green" style={{ margin: 0, fontSize: 12 }}>Passwordless</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                    Sign in securely using your device's built-in authentication - Windows Hello, Touch ID, Face ID, or a security key. No passwords required.
                  </Text>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: 24 }}>
              <Collapse 
                ghost 
                style={{ marginBottom: 24, background: 'transparent' }}
                items={[{
                  key: 'passkey-steps',
                  label: (
                    <Space>
                      <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                      <Text strong style={{ fontSize: 14 }}>How to Enable Passkey Authentication</Text>
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: 16, background: token.colorFillAlter, borderRadius: token.borderRadius, marginTop: 8 }}>
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {[
                          { num: 1, title: 'Verify Device Support', desc: 'Ensure your device supports passkeys (Windows Hello, Touch ID, Face ID, or security key) and your browser supports WebAuthn.' },
                          { num: 2, title: 'Click "Register Passkey"', desc: 'Click the "Register Passkey" button below to begin the registration process.' },
                          { num: 3, title: 'Authenticate with Device', desc: 'Use your device\'s authentication method (biometrics, PIN, or security key) to create and register your passkey.' },
                          { num: 4, title: 'Complete Registration', desc: 'Your passkey will be registered successfully. You can register multiple passkeys for different devices.' },
                          { num: 5, title: 'Sign In with Passkey', desc: 'On the login page, click "Sign in with a passkey" and use your device\'s biometrics or security key to authenticate.' }
                        ].map((step) => (
                          <div key={step.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ 
                              minWidth: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              background: token.colorPrimary, 
                              color: '#fff', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 14,
                              flexShrink: 0,
                              boxShadow: `0 2px 4px ${token.colorPrimary}30`
                            }}>
                              {step.num}
                            </div>
                            <div style={{ flex: 1, paddingTop: 2 }}>
                              <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{step.title}</Text>
                              <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                                {step.desc}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </Space>
                    </div>
                  )
                }]}
              />
              
              <PasskeyManager />
            </div>
          </Card>

          {/* Password Section */}
          <Card 
            style={{ 
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 0
              }
            }}
          >
            {/* Header Section */}
            <div style={{
              padding: '24px 24px 20px',
              background: token.colorFillAlter,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              borderTopLeftRadius: token.borderRadiusLG,
              borderTopRightRadius: token.borderRadiusLG
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${token.colorPrimary}40`,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${token.colorPrimary}15`
                }}>
                  <LockOutlined style={{ fontSize: 28, color: token.colorPrimary, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0, marginBottom: 8 }}>Password Management</Title>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                    Update your account password to keep your account secure. Choose a strong, unique password.
                  </Text>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: 24 }}>
              <LoggedInPasswordChangeFlow />
            </div>
          </Card>
        </div>
      )
    },
    {
      key: 'account',
      label: <span><SettingOutlined />Account</span>,
      children: (
        <div>
          {/* Email Address Section */}
          <Card 
            style={{ 
              marginBottom: 32,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 0
              }
            }}
          >
            {/* Header Section */}
            <div style={{
              padding: '24px 24px 20px',
              background: token.colorFillAlter,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              borderTopLeftRadius: token.borderRadiusLG,
              borderTopRightRadius: token.borderRadiusLG
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${token.colorPrimary}15, ${token.colorPrimary}08)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${token.colorPrimary}30`,
                  flexShrink: 0
                }}>
                  <MailOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0, marginBottom: 8 }}>Email Address</Title>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                    Update the email address associated with your account. You will need to verify your current email before changing it.
                  </Text>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: 24 }}>
              <EmailChangeGracePeriod />
              <LoggedInEmailChangeFlow />
            </div>
          </Card>

          {/* Active Sessions */}
          <Card
            style={{
              marginTop: 24,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{ body: { padding: 24 } }}
          >
            <ActiveSessions />
          </Card>

          {/* Danger Zone Section */}
          <Card
            style={{
              border: `1px solid ${token.colorErrorBorder}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 0
              }
            }}
          >
            {/* Header Section */}
            <div
              style={{
                padding: '24px 24px 20px',
                background: token.colorErrorBg,
                borderBottom: `1px solid ${token.colorErrorBorder}`,
                borderTopLeftRadius: token.borderRadiusLG,
                borderTopRightRadius: token.borderRadiusLG
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${token.colorError}20, ${token.colorError}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${token.colorError}40`,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${token.colorError}15`
                  }}
                >
                  <WarningOutlined style={{ fontSize: 28, color: token.colorError, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Title level={4} style={{ margin: 0, color: token.colorError }}>Danger Zone</Title>
                    <Tag color="error" style={{ margin: 0, fontSize: 12 }}>Irreversible</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}>
                    Permanently delete your account and all of its data. This action cannot be undone.
                  </Text>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: 24 }}>
              <DeleteAccountFlow />
            </div>
          </Card>
        </div>
      )
    },
    {
      key: 'theme',
      label: <span><BgColorsOutlined />Theme</span>,
      children: (
        <div>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <Title level={4} style={{ margin: 0 }}>Customize Theme</Title>
               <div 
                 onClick={handleApplyTheme}
                 style={{ 
                   background: token.colorPrimary, 
                   color: '#fff', 
                   padding: '6px 16px', 
                   borderRadius: 6, 
                   cursor: 'pointer',
                   fontWeight: 500,
                   boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                   transition: 'all 0.2s'
                 }}
               >
                 Apply Changes
               </div>
            </div>
            <Card type="inner">
              <div style={{ marginBottom: 32 }}>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>Theme</Text>
                <Row gutter={[16, 16]}>
                  {themeOptions.map(option => (
                    <Col xs={12} md={6} lg={4} key={option.key}>
                      <Tooltip title={option.label}>
                        <div
                          onClick={() => handleSelectTheme(option.key)}
                          onMouseEnter={() => handleMouseEnter(option.key)}
                          onMouseLeave={handleMouseLeave}
                          style={{
                            cursor: 'pointer',
                            position: 'relative',
                            borderRadius: 6,
                            overflow: 'hidden',
                            border: pendingTheme === option.key 
                              ? `2px solid ${option.active}` 
                              : (hoveredTheme === option.key ? `2px solid ${option.active}` : '1px solid #d9d9d9'),
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transform: hoveredTheme === option.key ? 'translateY(-2px)' : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div style={{ height: 14, background: option.header, borderBottom: `1px solid ${option.border}` }}></div>
                          <div style={{ display: 'flex', height: 50 }}>
                            <div style={{ width: '25%', background: option.side, borderRight: `1px solid ${option.border}` }}></div>
                            <div style={{ width: '75%', background: option.content, position: 'relative' }}>
                               {pendingTheme === option.key && (
                                <div style={{ position: 'absolute', bottom: 6, right: 6 }}>
                                  <CheckCircleFilled style={{ color: option.active, fontSize: 16 }} />
                                </div>
                               )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                           <Text style={{ fontSize: 13, fontWeight: pendingTheme === option.key ? 600 : 400 }}>{option.label}</Text>
                        </div>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>
              </div>

              <div>
                 <Text strong style={{ display: 'block', marginBottom: 16 }}>Primary Color</Text>
                 <Space size={16} wrap style={{ alignItems: 'center' }}>
                    {presetColors.map(color => (
                        <div
                          key={color}
                          onClick={() => handleColorChange(color)}
                          onMouseEnter={() => handleColorMouseEnter(color)}
                          onMouseLeave={handleColorMouseLeave}
                          style={{
                             width: 24,
                             height: 24,
                             borderRadius: 4,
                             background: color,
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                             border: currentPrimaryColor === color ? '2px solid rgba(0,0,0,0.2)' : 'none'
                          }}
                        >
                           {currentPrimaryColor === color && <CheckCircleFilled style={{ color: '#fff', fontSize: 14 }} />}
                        </div>
                    ))}
                    
                    {/* Custom Color Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8, borderLeft: '1px solid #f0f0f0', paddingLeft: 16 }}>
                      <Text type="secondary" style={{ marginRight: 8, fontSize: 13 }}>Custom:</Text>
                      <ColorPicker 
                        value={currentPrimaryColor}
                        onChange={handleColorChange}
                        showText
                        disabledAlpha
                        trigger="hover"
                      />
                    </div>
                 </Space>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'notifications',
      label: <span><BellOutlined />Notifications</span>,
      children: (
        <div>
          <Card 
            style={{ 
              marginBottom: 24,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 24
              }
            }}
          >
            <NotificationPreferences />
          </Card>
          
          <Card 
            style={{ 
              marginBottom: 24,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 24
              }
            }}
          >
            <NotificationHistory />
          </Card>
          
          <Card 
            style={{ 
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            styles={{
              body: {
                padding: 24
              }
            }}
          >
            <AuditHistory />
          </Card>
        </div>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sidebar />

      <Layout.Content style={{ 
        padding: isMobile ? '16px' : '24px', 
        background: token.colorBgLayout,
        minHeight: '100vh'
      }}>
        <div>
          
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8, fontSize: isMobile ? 24 : 30, color: brandColor }}>Profile & Settings</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>Manage your personal information, security preferences, and account settings.</Text>
          </div>

          <Row gutter={[24, 24]}>
            {/* Left Column: User Summary Card */}
            <Col xs={24} lg={8}>
              <Card 
                variant="borderless" 
                style={{ 
                  textAlign: 'center', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                  borderRadius: 8,
                  overflow: 'hidden'
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ background: headerBackground, height: 100 }}></div>
                <div style={{ padding: '0 24px 24px', marginTop: -50 }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                    <Avatar 
                      size={100} 
                      src={user?.avatar ? <img src={resolveAvatarUrl(user?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                      style={{ 
                        backgroundColor: brandColor,
                        border: '4px solid #fff',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: 36
                      }} 
                    >
                      {!user?.avatar && initials}
                    </Avatar>
                    <Upload
                      showUploadList={false}
                      customRequest={handleAvatarUpload}
                      accept="image/png,image/jpeg,image/webp"
                      disabled={uploading}
                    >
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: '#fff',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        border: '1px solid #d9d9d9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.3s'
                      }}
                      title="Change profile photo"
                      >
                        {uploading ? <LoadingOutlined style={{ fontSize: 16, color: '#001529' }} /> : <CameraOutlined style={{ fontSize: 18, color: '#595959' }} />}
                      </div>
                    </Upload>
                  </div>
                  <Title level={4} style={{ marginBottom: 4, color: brandColor }}>{user?.name || 'User'}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{user?.email}</Text>
                  <div style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Tag color={brandColor} style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>{user?.role ? user.role.toUpperCase() : 'USER'}</Tag>
                  </div>
                  <Space size={[8, 8]} wrap style={{ justifyContent: 'center' }}>
                    {user?.mfaEnabled ? 
                      <Tag color="success" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>MFA ENABLED</Tag> : 
                      <Tag color="warning" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>MFA DISABLED</Tag>
                    }
                    {passkeyLoading ? (
                      <Tag color="default" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>...</Tag>
                    ) : passkeyEnabled ? (
                      <Tag color="success" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>PASSKEY ENABLED</Tag>
                    ) : (
                      <Tag color="warning" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>PASSKEY DISABLED</Tag>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>

            {/* Right Column: Settings Tabs */}
            <Col xs={24} lg={16}>
              <Card 
                variant="borderless" 
                style={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                  borderRadius: 8, 
                  minHeight: 600 
                }}
                styles={{ body: { padding: isMobile ? 12 : 32 } }}
              >
                <Tabs 
                  defaultActiveKey="general" 
                  size="large" 
                  items={tabItems} 
                  tabBarStyle={{ marginBottom: 32 }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Layout.Content>
    </Layout>
  )
}
