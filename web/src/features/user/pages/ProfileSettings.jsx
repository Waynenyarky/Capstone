import React, { useState } from 'react'
import { Layout, Typography, Card, Tabs, Row, Col, Avatar, Tag, Space, Grid, Upload, message, theme, Slider, InputNumber, Radio, Tooltip, ColorPicker } from 'antd'
import { UserOutlined, SecurityScanOutlined, SettingOutlined, CameraOutlined, LoadingOutlined, BgColorsOutlined, CheckCircleFilled } from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import useProfile from '@/features/authentication/hooks/useProfile'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import LoggedInPasswordChangeFlow from '@/features/authentication/flows/LoggedInPasswordChangeFlow.jsx'
import DeleteAccountFlow from '@/features/authentication/flows/DeleteAccountFlow.jsx'
import { uploadUserAvatar } from '@/features/user/services/userService.js'
import { useAuthSession } from '@/features/authentication'
import { resolveAvatarUrl } from '@/lib/utils'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'

const { Title, Text } = Typography
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
          <div style={{ marginBottom: 40 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Personal Information</Title>
            <Card type="inner" title="Edit Profile Details">
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Update your personal details here. Your profile photo can be updated in the sidebar.
              </Text>
              <EditUserProfileForm embedded={true} />
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'security',
      label: <span><SecurityScanOutlined />Security</span>,
      children: (
        <div>
          <div style={{ marginBottom: 40 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Two-Factor Authentication</Title>
            <Card type="inner" title="MFA Status" style={{ background: token.colorFillAlter }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Protect your account by enabling two-factor authentication. When enabled, you will be required to verify your identity using a second method during login.
              </Text>
              <LoggedInMfaManager />
            </Card>
          </div>

          <div>
             <Title level={4} style={{ marginBottom: 16 }}>Password</Title>
             <Card type="inner" title="Change Password">
                <LoggedInPasswordChangeFlow />
             </Card>
          </div>
        </div>
      )
    },
    {
      key: 'account',
      label: <span><SettingOutlined />Account</span>,
      children: (
        <div>
          <div style={{ marginBottom: 48 }}>
            <Title level={4} style={{ marginBottom: 16 }}>Email Address</Title>
            <Card type="inner" title="Update Email">
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Update the email address associated with your account. You will need to verify your current email before changing it.
              </Text>
              <LoggedInEmailChangeFlow />
            </Card>
          </div>

          <div style={{ paddingTop: 32, borderTop: `1px solid ${token.colorSplit}` }}>
            <Title level={4} type="danger" style={{ marginBottom: 16 }}>Danger Zone</Title>
            <Card 
              type="inner" 
              title={<span style={{ color: token.colorError }}>Delete Account</span>}
              style={{ border: `1px solid ${token.colorErrorBorder}` }}
              styles={{ header: { background: token.colorErrorBg, borderBottom: `1px solid ${token.colorErrorBorder}` } }}
            >
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Permanently delete your account and all of its data. This action cannot be undone.
              </Text>
              <DeleteAccountFlow />
            </Card>
          </div>
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
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{user?.email}</Text>
                  <Space size={[8, 8]} wrap style={{ justifyContent: 'center' }}>
                    <Tag color={brandColor} style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>{user?.role ? user.role.toUpperCase() : 'USER'}</Tag>
                    {user?.mfaEnabled ? 
                      <Tag color="success" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>MFA ENABLED</Tag> : 
                      <Tag color="warning" style={{ margin: 0, padding: '4px 12px', borderRadius: 4 }}>MFA DISABLED</Tag>
                    }
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
