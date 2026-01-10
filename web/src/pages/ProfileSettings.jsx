import React, { useState, useEffect } from 'react'
import { Layout, Typography, Card, Tabs, Row, Col, Avatar, Tag, Space, Grid, Upload, message } from 'antd'
import { UserOutlined, SecurityScanOutlined, SettingOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons'
import Sidebar from '@/features/authentication/components/Sidebar'
import useProfileStatic from '@/features/authentication/hooks/useProfileStatic'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import LoggedInPasswordChangeFlow from '@/features/authentication/flows/LoggedInPasswordChangeFlow.jsx'
import DeleteAccountFlow from '@/features/authentication/flows/DeleteAccountFlow.jsx'
import { uploadUserAvatar } from '@/features/user/services/userService.js'
import { useAuthSession } from '@/features/authentication'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { useBreakpoint } = Grid

export default function ProfileSettings() {
  const { user } = useProfileStatic()
  const { currentUser, login, role } = useAuthSession()
  const [uploading, setUploading] = useState(false)
  const screens = useBreakpoint()

  const isMobile = !screens.md

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
      message.error('You can only upload JPG/PNG/WEBP file!');
      return;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return;
    }

    try {
      setUploading(true)
      const res = await uploadUserAvatar(file, currentUser, role)
      
      if (res?.success) {
        message.success('Profile photo updated successfully')
        const nextUser = { ...currentUser, avatar: res.avatarUrl }
        const isRemembered = !!localStorage.getItem('auth__currentUser')
        login(nextUser, { remember: isRemembered })
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to upload profile photo')
    } finally {
      setUploading(false)
    }
  }

  const tabItems = [
    {
      key: 'general',
      label: <span><UserOutlined />General</span>,
      children: (
        <div>
          <div style={{ marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>Personal Information</Title>
            <Text type="secondary">Update your photo and personal details here.</Text>
          </div>
          <EditUserProfileForm embedded={true} />
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
            <Card type="inner" title="MFA Status" style={{ background: '#fafafa' }}>
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

          <div style={{ paddingTop: 32, borderTop: '1px solid #f0f0f0' }}>
            <Title level={4} type="danger" style={{ marginBottom: 16 }}>Danger Zone</Title>
            <div style={{ border: '1px solid #ffccc7', background: '#fff1f0', padding: 24, borderRadius: 8 }}>
              <Title level={5} type="danger">Delete Account</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Permanently delete your account and all of its data. This action cannot be undone.
              </Text>
              <DeleteAccountFlow />
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />

      <Layout.Content style={{ 
        padding: isMobile ? '24px 16px' : '40px 60px', 
        background: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8, fontSize: isMobile ? 24 : 30 }}>Profile & Settings</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>Manage your personal information, security preferences, and account settings.</Text>
          </div>

          <Row gutter={[32, 32]}>
            {/* Left Column: User Summary Card */}
            <Col xs={24} lg={8}>
              <Card 
                variant="borderless" 
                style={{ 
                  textAlign: 'center', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
                  borderRadius: 16,
                  overflow: 'hidden'
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', height: 100 }}></div>
                <div style={{ padding: '0 24px 24px', marginTop: -50 }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                    <Avatar 
                      size={100} 
                      src={user?.avatar ? <img src={resolveAvatarUrl(user?.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                      style={{ 
                        backgroundColor: '#1890ff',
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
                        {uploading ? <LoadingOutlined style={{ fontSize: 16, color: '#1890ff' }} /> : <CameraOutlined style={{ fontSize: 18, color: '#595959' }} />}
                      </div>
                    </Upload>
                  </div>
                  <Title level={4} style={{ marginBottom: 4 }}>{user?.name || 'User'}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{user?.email}</Text>
                  <Space size={[8, 8]} wrap style={{ justifyContent: 'center' }}>
                    <Tag color="blue" style={{ margin: 0, padding: '4px 12px', borderRadius: 12 }}>{user?.role ? user.role.toUpperCase() : 'USER'}</Tag>
                    {user?.mfaEnabled ? 
                      <Tag color="success" style={{ margin: 0, padding: '4px 12px', borderRadius: 12 }}>MFA ENABLED</Tag> : 
                      <Tag color="warning" style={{ margin: 0, padding: '4px 12px', borderRadius: 12 }}>MFA DISABLED</Tag>
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
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
                  borderRadius: 16, 
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
