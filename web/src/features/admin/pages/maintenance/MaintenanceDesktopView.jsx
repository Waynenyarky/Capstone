import React from 'react'
import { Typography, theme, Button, Table, Space, Tag } from 'antd'
import { ToolOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons'
import MaintenanceStatusCard from './MaintenanceStatusCard'

const { Text } = Typography

const NAV_ITEMS = [
  { key: 'status', label: 'Status', icon: ToolOutlined },
  { key: 'requests', label: 'Requests', icon: FileTextOutlined },
]

export default function MaintenanceDesktopView({
  tabKey,
  setTabKey,
  current,
  loading,
  approvals,
  onApprove,
  onOpenRequestModal,
  headerActions,
}) {
  const { token } = theme.useToken()

  const columns = [
    { title: 'ID', dataIndex: 'approvalId', key: 'approvalId' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={v === 'pending' ? 'gold' : v === 'approved' ? 'green' : 'red'}>{v}</Tag>
      ),
    },
    { title: 'Action', key: 'action', render: (_, rec) => rec.requestDetails?.action || '-' },
    { title: 'Message', key: 'message', render: (_, rec) => rec.requestDetails?.message || '-' },
    {
      title: 'Approve',
      key: 'approve',
      render: (_, rec) =>
        rec.status === 'pending' ? (
          <Space>
            <Button size="small" type="primary" onClick={() => onApprove(rec.approvalId, true)}>
              Approve
            </Button>
            <Button size="small" danger onClick={() => onApprove(rec.approvalId, false)}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  const tabChildren = {
    status: (
      <div style={{ padding: 16 }}>
        <MaintenanceStatusCard current={current} loading={loading} />
      </div>
    ),
    requests: (
      <div style={{ padding: 16 }}>
        <Table
          rowKey="approvalId"
          dataSource={approvals}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    ),
  }

  const renderNavItem = ({ key, label, icon: Icon }, isSelected) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => setTabKey(key)}
      onKeyDown={(e) => e.key === 'Enter' && setTabKey(key)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = token.colorFillTertiary
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {Icon && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 16 }} />
        </span>
      )}
      <Text
        strong={isSelected}
        type={isSelected ? undefined : 'secondary'}
        style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}
      >
        {label}
      </Text>
    </div>
  )

  const selectedLabel = NAV_ITEMS.find((i) => i.key === tabKey)?.label ?? tabKey
  const SelectedIcon = NAV_ITEMS.find((i) => i.key === tabKey)?.icon
  const requestButtonLabel = current?.isActive
    ? 'Disable maintenance'
    : 'Enable maintenance'
  const rightPanelHeaderActions =
    tabKey === 'status' ? (
      <>
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenRequestModal}>
          {requestButtonLabel}
        </Button>
        {headerActions}
      </>
    ) : (
      headerActions
    )

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: 400,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorder}`,
          padding: 12,
          overflowY: 'auto',
          background: token.colorBgLayout,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => renderNavItem(item, tabKey === item.key))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '16px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {SelectedIcon && (
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: token.colorFillTertiary,
                    color: token.colorPrimary,
                  }}
                >
                  <SelectedIcon style={{ fontSize: 18 }} />
                </span>
              )}
              <Text strong style={{ fontSize: 16 }}>
                {selectedLabel}
              </Text>
            </div>
            {rightPanelHeaderActions}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tabChildren[tabKey]}
        </div>
      </div>
    </div>
  )
}
