import { Typography, Badge, theme } from 'antd'
import {
  FileTextOutlined, AuditOutlined, EditOutlined, StopOutlined,
  UserOutlined, FormOutlined, HistoryOutlined, ReloadOutlined,
  EyeOutlined, SettingOutlined, SafetyCertificateOutlined,
  CustomerServiceOutlined, LogoutOutlined,
} from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import AnimatedBrandLogo from '@/shared/components/AnimatedBrandLogo.jsx'

const TABS = [
  { key: 'toReview', label: 'To Review', icon: <EyeOutlined /> },
  { key: 'applications', label: 'Applications', icon: <FileTextOutlined /> },
  { key: 'appeals', label: 'Appeals', icon: <AuditOutlined /> },
  { key: 'editRequests', label: 'Edits', icon: <EditOutlined /> },
  { key: 'renewals', label: 'Renewals', icon: <ReloadOutlined /> },
  { key: 'cessation', label: 'Cessations', icon: <StopOutlined /> },
  { key: 'inspections', label: 'Inspections', icon: <SafetyCertificateOutlined /> },
  { key: 'helpRequests', label: 'Help Requests', icon: <CustomerServiceOutlined /> },
  { key: 'drafts', label: 'My Drafts', icon: <FormOutlined /> },
  { key: 'owners', label: 'Owners', icon: <UserOutlined /> },
  { key: 'logs', label: 'Logs', icon: <HistoryOutlined /> },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
]

export default function OfficerLeftPanel({
  activeTab,
  onTabChange,
  counts = {},
  showSettings = false,
}) {
  const { token } = theme.useToken()
  const { currentUser, logout } = useAuthSession()

  // Determine which tab should appear active
  const displayActiveTab = showSettings ? 'settings' : activeTab

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: token.colorBgContainer }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '16px 12px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <AnimatedBrandLogo style={{ width: 32, height: 32 }} />
        <div style={{ flex: 1 }}>
          <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
            Officer Dashboard
          </Typography.Text>
          {currentUser?.email && (
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {currentUser.email}
            </Typography.Text>
          )}
        </div>
        <LogoutOutlined
          style={{ cursor: 'pointer', color: token.colorTextSecondary, fontSize: 16 }}
          onClick={logout}
        />
      </div>

      {/* Tab buttons - vertical list using settings page style */}
      <div style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {TABS.map(tab => {
            const isActive = displayActiveTab === tab.key
            // Show count for applications, appeals, edits, renewals, cessation, and drafts tabs
            const showCount = ['toReview', 'applications', 'appeals', 'editRequests', 'renewals', 'cessation', 'inspections', 'helpRequests', 'drafts'].includes(tab.key)
            const count = showCount ? (counts[tab.key] || 0) : 0
            return (
              <div
                key={tab.key}
                role="button"
                tabIndex={0}
                onClick={() => onTabChange(tab.key)}
                onKeyDown={(e) => e.key === 'Enter' && onTabChange(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px',
                  borderRadius: token.borderRadius,
                  cursor: 'pointer',
                  background: isActive ? token.colorBgContainer : 'transparent',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = token.colorFillTertiary
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? token.colorFillTertiary : token.colorFillQuaternary,
                    color: isActive ? token.colorPrimary : token.colorTextSecondary,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{tab.icon}</span>
                </span>
                <Typography.Text
                  strong={isActive}
                  type={isActive ? undefined : 'secondary'}
                  style={{
                    fontSize: 13,
                    flex: 1,
                    lineHeight: 1.4,
                    ...(isActive && { color: token.colorPrimary })
                  }}
                >
                  {tab.label}
                </Typography.Text>
                {showCount && (
                  <Badge
                    count={count}
                    size="small"
                    showZero
                    style={{
                      backgroundColor: token.colorFillTertiary,
                      color: token.colorTextSecondary,
                      minWidth: 20,
                      height: 20,
                      lineHeight: '20px',
                      fontSize: 11,
                      border: 'none',
                      boxShadow: 'none'
                    }}
                  />
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
