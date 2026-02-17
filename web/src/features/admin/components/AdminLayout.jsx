import React from 'react'
import { Layout, Grid, Space, Typography, Button, Dropdown, theme } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar, useAuthSession } from '@/features/authentication'

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

export default function AdminLayout({
  children,
  pageTitle,
  pageIcon,
  headerActions,
  sidebarOverrides = {},
  hiddenSidebarKeys = [],
  hideSidebar = false,
  showPageHeader = true,
  headerContent,
}) {
  const { currentUser, logout } = useAuthSession()
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const isMobile = !screens.md
  const [actionsMenuOpen, setActionsMenuOpen] = React.useState(false)

  // Optional: allow callers to override sidebar header content.
  // Defaults to a simple Admin header.
  const defaultSidebarHeader = (
    <div style={{ padding: 12 }}>
      <Text strong>Admin</Text>
      {currentUser?.email && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {currentUser.email}
        </Text>
      )}
      <div style={{ marginTop: 8 }}>
        <Button size="small" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  )

  const sidebarHeader = headerContent ?? defaultSidebarHeader

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
        <Content
          style={{
            background: token.colorBgLayout,
            overflow: 'hidden',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {showPageHeader && (pageTitle || headerActions) && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  flexWrap: 'wrap',
                  gap: 12,
                  borderBottom: `1px solid ${token.colorBorder}`,
                }}
              >
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
                        justifyContent: 'center',
                      }}
                    >
                      {pageIcon}
                    </span>
                  )}
                  {pageTitle && (
                    <Text strong style={{ fontSize: isMobile ? 16 : 18 }}>
                      {pageTitle}
                    </Text>
                  )}
                </Space>

                {headerActions &&
                  (isMobile ? (
                    <Dropdown
                      open={actionsMenuOpen}
                      onOpenChange={setActionsMenuOpen}
                      trigger={['click']}
                      placement="bottomRight"
                      popupRender={() => {
                        const actions = flattenActionChildren(headerActions)
                        return (
                          <div
                            style={{
                              background: token.colorBgContainer,
                              borderRadius: token.borderRadiusLG,
                              boxShadow: token.boxShadowSecondary,
                              padding: 8,
                              minWidth: 180,
                            }}
                          >
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
                                      },
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
                  ))}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0 }}>
              {children}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

