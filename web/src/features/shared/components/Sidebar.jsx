import React, { useState } from 'react'
import { Layout, Menu, Typography, Grid, Drawer, Button, theme, ConfigProvider } from 'antd'
import { MenuOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'

const { Sider } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const SidebarContent = ({ 
  collapsed, 
  items, 
  activeKey, 
  handleItemClick, 
  backgroundColor,
  isLightSidebar,
  isDarkTheme,
  currentTheme
}) => {
  // Helper to check if a key is a child of any parent
  const isChildKey = React.useCallback((key) => {
    for (const item of items) {
      if (item.children) {
        if (item.children.some(child => child.key === key)) {
          return item.key
        }
      }
    }
    return null
  }, [items])
  
  // Helper to check if a key is a parent item (has children)
  const isParentKey = React.useCallback((key) => {
    const item = items.find(i => i.key === key)
    return item && item.children && item.children.length > 0
  }, [items])
  const { token } = theme.useToken();
  
  // Initialize openKeys with parent items that have children (submenus should be open by default)
  const initialOpenKeys = React.useMemo(() => {
    return items
      .filter(item => item.children && item.children.length > 0)
      .map(item => item.key)
  }, [items])
  
  const [openKeys, setOpenKeys] = React.useState(initialOpenKeys);
  const navigatingParentRef = React.useRef(null);
  const previousOpenKeysRef = React.useRef(initialOpenKeys);
  const closingSubmenusRef = React.useRef(false);
  const ignoreNextOpenChangeRef = React.useRef(false);
  
  // Get all parent item keys that should stay open
  const parentItemKeys = React.useMemo(() => {
    return items
      .filter(item => item.children && item.children.length > 0)
      .map(item => item.key)
  }, [items])
  
  // Update openKeys when items change (e.g., when switching roles)
  React.useEffect(() => {
    const newOpenKeys = items
      .filter(item => item.children && item.children.length > 0)
      .map(item => item.key)
    setOpenKeys(newOpenKeys)
    previousOpenKeysRef.current = newOpenKeys
  }, [items])
  
  // Manage submenus when activeKey changes
  React.useEffect(() => {
    if (activeKey) {
      const parentOfActive = isChildKey(activeKey)
      const isParent = isParentKey(activeKey)
      
      if (parentOfActive) {
        // Active item is a child - ensure its parent submenu is open
        setOpenKeys(prev => {
          if (!prev.includes(parentOfActive)) {
            return [...prev, parentOfActive]
          }
          return prev
        })
      } else if (isParent) {
        // Active item is a parent item (like "Permit Applications") - keep its submenu open
        setOpenKeys(prev => {
          if (!prev.includes(activeKey)) {
            return [...prev, activeKey]
          }
          return prev
        })
      } else {
        // Active item is a top-level item without children - close all submenus
        ignoreNextOpenChangeRef.current = true
        setOpenKeys([])
        previousOpenKeysRef.current = []
        setTimeout(() => {
          ignoreNextOpenChangeRef.current = false
        }, 50)
      }
    }
  }, [activeKey, isChildKey, isParentKey])
  
  const menuTheme = isLightSidebar ? 'light' : 'dark';
  const menuBg = backgroundColor;

  const textColor = isLightSidebar ? token.colorText : '#fff';
  const logoBg = isLightSidebar 
    ? token.colorPrimary 
    : isDarkTheme ? token.colorPrimary : 'linear-gradient(135deg, #003a70 0%, #001529 100%)';

  // Calculate submenu background color based on theme
  const getSubmenuBg = () => {
    if (isLightSidebar) {
      // For light themes, use a slightly darker background for submenu
      if (currentTheme === THEMES.BLOSSOM) {
        return 'rgba(235, 47, 150, 0.04)'; // Very light pink
      } else if (currentTheme === THEMES.SUNSET) {
        return 'rgba(250, 84, 28, 0.04)'; // Very light orange
      } else if (currentTheme === THEMES.ROYAL) {
        return 'rgba(114, 46, 209, 0.04)'; // Very light purple
      } else if (currentTheme === THEMES.DOCUMENT) {
        return 'rgba(0, 185, 107, 0.04)'; // Very light green
      }
      return 'rgba(0, 0, 0, 0.02)'; // Very light gray for default light themes
    } else {
      // For dark themes, use a slightly lighter background for submenu
      return 'rgba(255, 255, 255, 0.05)';
    }
  };

  // Calculate submenu text color
  const getSubmenuTextColor = () => {
    if (isLightSidebar) {
      return token.colorText;
    } else {
      return 'rgba(255, 255, 255, 0.85)';
    }
  };

  // Calculate submenu hover background
  const getSubmenuHoverBg = () => {
    if (isLightSidebar) {
      if (currentTheme === THEMES.BLOSSOM) {
        return 'rgba(235, 47, 150, 0.08)';
      } else if (currentTheme === THEMES.SUNSET) {
        return 'rgba(250, 84, 28, 0.08)';
      } else if (currentTheme === THEMES.ROYAL) {
        return 'rgba(114, 46, 209, 0.08)';
      } else if (currentTheme === THEMES.DOCUMENT) {
        return 'rgba(0, 185, 107, 0.08)';
      }
      return 'rgba(0, 0, 0, 0.04)';
    } else {
      return 'rgba(255, 255, 255, 0.08)';
    }
  };

  return (
    <>
      {/* Submenu Theme Styles */}
      <style>{`
        .ant-menu-submenu-inner {
          background: ${getSubmenuBg()} !important;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .ant-menu-submenu-title {
          color: ${getSubmenuTextColor()} !important;
          transition: all 0.2s;
        }
        .ant-menu-submenu-title:hover {
          background: ${getSubmenuHoverBg()} !important;
          color: ${isLightSidebar ? token.colorPrimary : '#fff'} !important;
        }
        .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: ${isLightSidebar ? token.colorPrimary : token.colorPrimary} !important;
        }
        .ant-menu-submenu .ant-menu {
          background: ${getSubmenuBg()} !important;
        }
        .ant-menu-submenu .ant-menu-item {
          background: transparent !important;
          color: ${getSubmenuTextColor()} !important;
          transition: all 0.2s;
        }
        .ant-menu-submenu .ant-menu-item:hover {
          background: ${getSubmenuHoverBg()} !important;
          color: ${isLightSidebar ? token.colorPrimary : '#fff'} !important;
        }
        .ant-menu-submenu .ant-menu-item-selected {
          background: ${isLightSidebar 
            ? (currentTheme === THEMES.BLOSSOM 
                ? 'rgba(235, 47, 150, 0.12)' 
                : currentTheme === THEMES.SUNSET
                ? 'rgba(250, 84, 28, 0.12)'
                : currentTheme === THEMES.ROYAL
                ? 'rgba(114, 46, 209, 0.12)'
                : currentTheme === THEMES.DOCUMENT
                ? 'rgba(0, 185, 107, 0.12)'
                : token.colorPrimaryBg)
            : token.colorPrimaryBg} !important;
          color: ${isLightSidebar ? token.colorPrimary : '#fff'} !important;
        }
        .ant-menu-submenu .ant-menu-item-active {
          background: ${getSubmenuHoverBg()} !important;
        }
        .ant-menu-submenu-arrow {
          color: ${getSubmenuTextColor()} !important;
        }
        .ant-menu-submenu-title:hover .ant-menu-submenu-arrow {
          color: ${isLightSidebar ? token.colorPrimary : '#fff'} !important;
        }
        .ant-menu-submenu-open .ant-menu-submenu-arrow {
          color: ${isLightSidebar ? token.colorPrimary : token.colorPrimary} !important;
        }
      `}</style>
      {/* Brand / Logo */}
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0' : '0 24px',
        borderBottom: `1px solid ${isLightSidebar ? token.colorBorderSecondary : 'rgba(255,255,255,0.1)'}`,
        transition: 'all 0.2s',
        background: menuBg
      }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          background: logoBg, 
          borderRadius: 8, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
          flexShrink: 0,
          cursor: 'default',
          boxShadow: isLightSidebar ? 'none' : '0 2px 6px rgba(0, 58, 112, 0.3)'
        }}>
          {import.meta.env.VITE_APP_BRAND_NAME?.[0] || 'B'}
        </div>
        {!collapsed && (
          <span style={{ 
            marginLeft: 12, 
            fontWeight: 700, 
            fontSize: 16, 
            color: textColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}
          </span>
        )}
      </div>

      <ConfigProvider
        theme={{
          components: {
            Menu: {
              subMenuItemBg: getSubmenuBg(),
              itemHoverBg: getSubmenuHoverBg(),
              itemSelectedBg: isLightSidebar 
                ? (currentTheme === THEMES.BLOSSOM 
                    ? 'rgba(235, 47, 150, 0.12)' 
                    : currentTheme === THEMES.SUNSET
                    ? 'rgba(250, 84, 28, 0.12)'
                    : currentTheme === THEMES.ROYAL
                    ? 'rgba(114, 46, 209, 0.12)'
                    : currentTheme === THEMES.DOCUMENT
                    ? 'rgba(0, 185, 107, 0.12)'
                    : token.colorPrimaryBg)
                : token.colorPrimaryBg,
              itemActiveBg: isLightSidebar 
                ? (currentTheme === THEMES.BLOSSOM 
                    ? 'rgba(235, 47, 150, 0.16)' 
                    : currentTheme === THEMES.SUNSET
                    ? 'rgba(250, 84, 28, 0.16)'
                    : currentTheme === THEMES.ROYAL
                    ? 'rgba(114, 46, 209, 0.16)'
                    : currentTheme === THEMES.DOCUMENT
                    ? 'rgba(0, 185, 107, 0.16)'
                    : token.colorPrimaryBgHover)
                : token.colorPrimaryBgHover,
              itemColor: getSubmenuTextColor(),
              subMenuItemBorderRadius: 6,
              itemBorderRadius: 6,
            }
          }
        }}
      >
        <Menu
        mode="inline"
        theme={menuTheme}
        selectedKeys={[activeKey]}
        openKeys={openKeys}
        onClick={({ key }) => {
            // Recursively find item in items and children
            const findItem = (itemsList, targetKey) => {
              for (const item of itemsList) {
                if (item.key === targetKey) {
                  return item
                }
                if (item.children) {
                  const found = findItem(item.children, targetKey)
                  if (found) return found
                }
              }
              return null
            }
            
            // Find which parent (if any) contains this item as a child
            const findParent = (itemsList, targetKey, currentParent = null) => {
              for (const item of itemsList) {
                if (item.key === targetKey) {
                  return currentParent
                }
                if (item.children) {
                  const found = findParent(item.children, targetKey, item)
                  if (found !== null) return found
                }
              }
              return null
            }
            
            const item = findItem(items, key)
            const parentItem = findParent(items, key)
            
            if (item) {
                // onClick only fires for leaf items (items without children)
                // SubMenu items (with children) use onTitleClick instead
                
                // If clicking on an item that's NOT a child of any open submenu,
                // close all submenus. If it IS a child, keep its parent submenu open.
                if (parentItem) {
                  // This is a child item - keep its parent submenu open and close others
                  const newKeys = [parentItem.key]
                  ignoreNextOpenChangeRef.current = true
                  previousOpenKeysRef.current = newKeys
                  setOpenKeys(newKeys)
                  // Reset flag after a short delay to allow onOpenChange to be ignored
                  setTimeout(() => {
                    ignoreNextOpenChangeRef.current = false
                  }, 50)
                } else {
                  // This is a top-level item (not a child) - close all submenus
                  ignoreNextOpenChangeRef.current = true
                  previousOpenKeysRef.current = []
                  setOpenKeys([])
                  // Reset flag after a short delay to allow onOpenChange to be ignored
                  setTimeout(() => {
                    ignoreNextOpenChangeRef.current = false
                  }, 50)
                }
                
                handleItemClick(item)
            }
        }}
        onOpenChange={(keys) => {
          // If we're programmatically changing submenus (from onClick), ignore onOpenChange
          if (ignoreNextOpenChangeRef.current) {
            return
          }
          
          // If we're navigating to a parent item, ensure its submenu stays open
          if (navigatingParentRef.current) {
            const parentKey = navigatingParentRef.current
            if (!keys.includes(parentKey)) {
              // Keep the parent submenu open if we just navigated to it
              const finalKeys = [...keys, parentKey]
              setOpenKeys(finalKeys)
              previousOpenKeysRef.current = finalKeys
              navigatingParentRef.current = null
              return
            }
            navigatingParentRef.current = null
          }
          
          // Check if the active key is a child - if so, keep its parent open
          // If active key is NOT a child, close all submenus
          const activeParent = activeKey ? isChildKey(activeKey) : null
          let finalKeys = keys
          
          if (activeParent) {
            // Active item is a child - ensure its parent is open
            if (!keys.includes(activeParent)) {
              finalKeys = [...keys, activeParent]
            }
          } else if (activeKey) {
            // Active item is a top-level item (not a child) - close all submenus
            finalKeys = []
          }
          
          // Allow normal submenu toggle behavior (user clicking the arrow)
          setOpenKeys(finalKeys)
          previousOpenKeysRef.current = finalKeys
        }}
        style={{ 
          borderRight: 0, 
          padding: '12px 0', 
          background: menuBg 
        }}
        items={items.map(item => {
          const menuItem = {
            key: item.key,
            icon: item.icon,
            label: item.label, 
            ...(item.key === 'logout' && { danger: true }),
            style: { 
              margin: '4px 8px', 
              borderRadius: 6, 
              width: 'auto',
              fontSize: 14 
            }
          }
          
          // Add children if they exist - this creates a SubMenu
          if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            menuItem.children = item.children.map(child => ({
              key: child.key,
              icon: child.icon,
              label: child.label,
              style: { 
                margin: '4px 8px', 
                borderRadius: 6, 
                width: 'auto',
                fontSize: 14
              }
            }))
            
            // Make parent clickable if it has a 'to' property
            // When clicking the title, navigate AND expand the submenu
            if (item.to) {
              menuItem.onTitleClick = () => {
                // Mark that we're navigating to this parent item
                navigatingParentRef.current = item.key
                // Expand the submenu using functional update to avoid stale closure
                setOpenKeys(prev => {
                  if (!prev.includes(item.key)) {
                    return [...prev, item.key]
                  }
                  return prev
                })
                // Navigate to the parent route
                const foundItem = items.find(i => i.key === item.key)
                if (foundItem) {
                  handleItemClick(foundItem)
                }
              }
            }
          }
          return menuItem
        })}
        />
      </ConfigProvider>
      
      {!collapsed && (
        <div style={{ 
          position: 'absolute', 
          bottom: 48, 
          width: '100%', 
          padding: 16, 
          textAlign: 'center' 
        }}>
          <Text type="secondary" style={{ fontSize: 11, color: isLightSidebar ? undefined : 'rgba(255,255,255,0.45)' }}>© {new Date().getFullYear()} {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}</Text>
        </div>
      )}
    </>
  )
}

/**
 * Pure Sidebar Component (UI Only)
 * @param {object[]} items - Menu items
 * @param {string} activeKey - Currently selected key
 * @param {function} onItemClick - Callback when item is clicked
 * @param {object} siderProps - Props passed to Antd Sider
 */
export default function Sidebar({ items = [], activeKey, onItemClick, ...siderProps }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const screens = useBreakpoint()
  const { currentTheme, themeOverrides } = useAppTheme();
  const { token } = theme.useToken();
  
  // Determine if we are on a mobile screen (md breakpoint = 768px)
  const isMobile = (screens.md === false)

  const handleMobileClick = (item) => {
    setMobileOpen(false)
    if (onItemClick) onItemClick(item)
  }

  // Blossom: Light sidebar
  // Sunset: Light sidebar
  // Royal: Light sidebar
  const isLightSidebar = [THEMES.DOCUMENT, THEMES.BLOSSOM, THEMES.SUNSET, THEMES.ROYAL].includes(currentTheme);
  const isDarkTheme = currentTheme === THEMES.DARK;
  
  let siderBg = '#001529'; // Default Blue
  if (currentTheme === THEMES.DOCUMENT || currentTheme === THEMES.SUNSET || currentTheme === THEMES.ROYAL) {
     siderBg = token.colorBgLayout;
  } else if (currentTheme === THEMES.BLOSSOM) {
     siderBg = token.colorBgContainer;
  } else if (isDarkTheme) {
     siderBg = '#141414';
  } else if (themeOverrides.colorPrimary) {
     // If user customized the primary color in Default theme, use that gradient
     siderBg = `linear-gradient(135deg, ${token.colorPrimaryActive || token.colorPrimary} 0%, ${token.colorPrimary} 100%)`;
  }

  return (
    <>
      {isMobile ? (
        <>
          <Button 
            icon={<MenuOutlined />} 
            type="text"
            onClick={() => setMobileOpen(true)}
            style={{ 
              position: 'fixed', 
              top: 16, 
              left: 16, 
              zIndex: 1000,
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} 
          />
          <Drawer
            placement="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            width={260}
            styles={{ body: { padding: 0, background: siderBg } }}
            closable={false}
          >
            <SidebarContent 
              collapsed={false}
              items={items}
              activeKey={activeKey}
              handleItemClick={handleMobileClick}
              backgroundColor={siderBg}
              isLightSidebar={isLightSidebar}
              isDarkTheme={isDarkTheme}
              currentTheme={currentTheme}
            />
          </Drawer>
        </>
      ) : (
        <Sider
          width={260}
          theme={isLightSidebar ? 'light' : 'dark'}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          breakpoint="lg"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            background: siderBg,
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            zIndex: 10,
            ...siderProps.style
          }}
          {...siderProps}
          trigger={
            <div style={{
              background: siderBg,
              color: isLightSidebar ? token.colorTextSecondary : 'rgba(255, 255, 255, 0.65)',
              height: 48,
              lineHeight: '48px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderTop: `1px solid ${isLightSidebar ? token.colorBorderSecondary : 'rgba(255,255,255,0.1)'}`
            }}>
              {collapsed ? <RightOutlined /> : <LeftOutlined />}
            </div>
          }
        >
          <SidebarContent 
            collapsed={collapsed}
            items={items}
            activeKey={activeKey}
            handleItemClick={onItemClick}
            backgroundColor={siderBg}
            isLightSidebar={isLightSidebar}
            isDarkTheme={isDarkTheme}
            currentTheme={currentTheme}
          />
        </Sider>
      )}
    </>
  )
}
