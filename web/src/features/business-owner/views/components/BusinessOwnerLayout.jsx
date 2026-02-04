import React from 'react'
import { Layout, Grid, Space, Typography, Button, Dropdown, theme } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'
import BusinessOwnerSidebarHeader from './BusinessOwnerSidebarHeader'

const { Content } = Layout
const { useBreakpoint } = Grid
const { Text } = Typography

/** Flatten headerActions so Space-wrapped buttons become individual items for vertical stacking */
function flattenActionChildren(node) {
  const arr = React.Children.toArray(node)
  if (arr.length === 1 && arr[0]?.props?.children != null) {
    const inner = React.Children.toArray(arr[0].props.children)
    // Only unwrap when parent has multiple element children (e.g. Space with multiple buttons)
    if (inner.length > 1 && inner.every(React.isValidElement)) {
      return inner
    }
  }
  return arr
}

export default function BusinessOwnerLayout({ 
  children, 
  pageTitle, 
  pageIcon,
  headerActions,
  businessName,
  sidebarOverrides = {}, 
  hiddenSidebarKeys = [],
  hideSidebar = false,
  hideNotifications = false,
  hideProfileSettings = false,
  showPageHeader = true
}) {
  const { currentUser, logout } = useAuthSession()
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const isMobile = !screens.md
  const [actionsMenuOpen, setActionsMenuOpen] = React.useState(false)

  const sidebarHeader = (
    <BusinessOwnerSidebarHeader
      title={pageTitle}
      businessName={businessName}
      hideNotifications={hideNotifications}
      hideProfileSettings={hideProfileSettings}
      currentUser={currentUser}
      onLogout={logout}
      viewNotificationsPath="/owner/notifications"
    />
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!hideSidebar && (
        <Sidebar 
          itemOverrides={sidebarOverrides} 
          hiddenKeys={hiddenSidebarKeys}
          headerContent={sidebarHeader}
        />
      )}
      <Layout>
        <Content style={{  
          background: token.colorBgLayout,
          overflowY: 'auto',
          height: '100vh'
        }}>
          <div style={{ minHeight: '100%', padding: isMobile ? 16 : 24 }}>
            {showPageHeader && (pageTitle || headerActions) && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                gap: 12
              }}>
                <Space size={10} align="center">
                  {pageIcon && (
                    <span
                      style={{
                        fontSize: 16,
                        color: '#fff',
                        background: token.colorPrimary,
                        padding: 6,
                        height: 32,
                        width: 32,
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {pageIcon}
                    </span>
                  )}
                  {pageTitle && <Text strong style={{ fontSize: isMobile ? 16 : 18 }}>{pageTitle}</Text>}
                </Space>
                {headerActions && (
                  isMobile ? (
                    <Dropdown
                      open={actionsMenuOpen}
                      onOpenChange={setActionsMenuOpen}
                      trigger={['click']}
                      placement="bottomRight"
                      popupRender={() => {
                        const actions = flattenActionChildren(headerActions)
                        return (
                          <div style={{
                            background: token.colorBgContainer,
                            borderRadius: token.borderRadiusLG,
                            boxShadow: token.boxShadowSecondary,
                            padding: 8,
                            minWidth: 180
                          }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              {actions.map((child, i) => {
                                if (!React.isValidElement(child)) return null
                                const origOnClick = child.props?.onClick
                                return (
                                  <div key={i} style={{ width: '100%' }}>
                                    {React.cloneElement(child, {
                                      style: { ...child.props?.style, width: '100%' },
                                      onClick: (...args) => {
                                        origOnClick?.(...args)
                                        setActionsMenuOpen(false)
                                      }
                                    })}
                                  </div>
                                )
                              })}
                            </Space>
                          </div>
                        )
                      }}
                    >
                      <Button icon={<EllipsisOutlined />} />
                    </Dropdown>
                  ) : (
                    <Space size="middle">{headerActions}</Space>
                  )
                )}
              </div>
            )}
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
