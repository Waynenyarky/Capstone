import React, { useState, useEffect } from 'react'
import { Layout, Typography, Card, Tabs, Row, Col, Avatar, Tag, Space, Grid, Drawer, Button } from 'antd'
import { UserOutlined, SecurityScanOutlined, SettingOutlined, MenuOutlined } from '@ant-design/icons'
import Sidebar from '@/features/authentication/components/Sidebar'
import useProfileStatic from '@/features/authentication/hooks/useProfileStatic'
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import LoggedInPasswordChangeFlow from '@/features/authentication/flows/LoggedInPasswordChangeFlow.jsx'
import DeleteAccountFlow from '@/features/authentication/flows/DeleteAccountFlow.jsx'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { useBreakpoint } = Grid

export default function ProfileSettings() {
  const { user } = useProfileStatic()
  const screens = useBreakpoint()
  const [drawerVisible, setDrawerVisible] = useState(false)

  const isMobile = !screens.md

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Mobile Drawer Sidebar */}
      <Drawer
        placement="left"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 0 }}
        width={260}
      >
        <Sidebar />
      </Drawer>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Layout.Sider width={260} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', position: 'fixed', height: '100vh', left: 0, overflowY: 'auto' }}>
          <Sidebar />
        </Layout.Sider>
      )}

      <Layout.Content style={{ 
        marginLeft: isMobile ? 0 : 260, 
        padding: isMobile ? '24px 16px' : '40px 60px', 
        background: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <Button 
                icon={<MenuOutlined />} 
                onClick={() => setDrawerVisible(true)} 
                style={{ marginRight: 16 }} 
              />
            )}
            <div>
              <Title level={2} style={{ marginBottom: 8, fontSize: isMobile ? 24 : 30 }}>Profile & Settings</Title>
              <Text type="secondary">Manage your personal information, security preferences, and account settings.</Text>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            {/* Left Column: User Summary Card */}
            <Col xs={24} lg={8}>
              <Card bordered={false} style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12 }}>
                <div style={{ padding: 20 }}>
                  <Avatar size={100} icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: '#1890ff', marginBottom: 16, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                  <Title level={4} style={{ marginBottom: 4 }}>{user?.name || 'User'}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{user?.email}</Text>
                  <Space size={[8, 8]} wrap style={{ justifyContent: 'center' }}>
                    <Tag color="blue" style={{ margin: 0 }}>{user?.role ? user.role.toUpperCase() : 'USER'}</Tag>
                    {user?.mfaEnabled ? <Tag color="green" style={{ margin: 0 }}>MFA ENABLED</Tag> : <Tag color="orange" style={{ margin: 0 }}>MFA DISABLED</Tag>}
                  </Space>
                </div>
              </Card>
            </Col>

            {/* Right Column: Settings Tabs */}
            <Col xs={24} lg={16}>
              <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12, minHeight: 600 }}>
                <Tabs defaultActiveKey="general" tabPosition={isMobile ? "top" : "top"} size="large" centered={isMobile}>
                  
                  <TabPane tab={<span><UserOutlined />General</span>} key="general">
                    <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '0' : '12px' }}>
                      <Title level={5} style={{ marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>Personal Information</Title>
                      <EditUserProfileForm />
                    </div>
                  </TabPane>

                  <TabPane tab={<span><SecurityScanOutlined />Security</span>} key="security">
                    <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '0' : '12px' }}>
                      <Title level={5} style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>Two-Factor Authentication</Title>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        Protect your account by enabling two-factor authentication. When enabled, you will be required to verify your identity using a second method during login.
                      </Text>
                      <LoggedInMfaManager />

                      <div style={{ marginTop: 48 }}>
                         <Title level={5} style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>Change Password</Title>
                         <LoggedInPasswordChangeFlow />
                      </div>
                    </div>
                  </TabPane>

                  <TabPane tab={<span><SettingOutlined />Account</span>} key="account">
                    <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '0' : '12px' }}>
                      <Title level={5} style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>Email Address</Title>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        Update the email address associated with your account. You will need to verify your current email before changing it.
                      </Text>
                      <LoggedInEmailChangeFlow />

                      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                        <Title level={5} type="danger" style={{ marginBottom: 16 }}>Danger Zone</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                          Permanently delete your account and all of its data. This action cannot be undone.
                        </Text>
                        <DeleteAccountFlow />
                      </div>
                    </div>
                  </TabPane>

                </Tabs>
              </Card>
            </Col>
          </Row>
        </div>
      </Layout.Content>
    </Layout>
  )
}
