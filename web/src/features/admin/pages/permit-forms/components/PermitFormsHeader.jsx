import React from 'react'
import { Button, Space, Tooltip, Typography, Dropdown } from 'antd'
import {
  PlusOutlined,
  UndoOutlined,
  RedoOutlined,
  RollbackOutlined,
  SendOutlined,
  PoweroffOutlined,
  MoreOutlined,
} from '@ant-design/icons'

const { Text } = Typography

export default function PermitFormsHeader({
  statusTag,
  canUndo,
  canRedo,
  hasChanges,
  isEnabled,
  publishing,
  onToggle,
  onAddCard,
  onUndo,
  onRedo,
  onRevertAll,
  onPublish,
  onBackToMenu,
  tabSelector,
  token,
  isMobile = false,
}) {
  const mobileMenuItems = [
    {
      key: 'addCard',
      label: 'Add Card',
      icon: <PlusOutlined />,
      onClick: onAddCard,
    },
    {
      key: 'undo',
      label: 'Undo',
      icon: <UndoOutlined />,
      onClick: onUndo,
      disabled: !canUndo,
    },
    {
      key: 'redo',
      label: 'Redo',
      icon: <RedoOutlined />,
      onClick: onRedo,
      disabled: !canRedo,
    },
    {
      key: 'revert',
      label: 'Revert All',
      icon: <RollbackOutlined />,
      onClick: onRevertAll,
      disabled: !hasChanges,
    },
  ]

  return (
    <div
      style={{
        flexShrink: 0,
        padding: isMobile ? '12px 16px' : '16px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        zIndex: 1,
      }}
    >
      {/* First row: title, tag, back button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: isMobile ? 8 : 12,
        }}
      >
        {onBackToMenu && onBackToMenu}
        <Text strong style={{ fontSize: 16 }}>
          Permit Forms
        </Text>
        {statusTag}
      </div>

      {/* Second row: tab selector on left, actions on right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {tabSelector && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {tabSelector}
          </div>
        )}
        <Space wrap size={isMobile ? 'small' : 'middle'}>
          {isMobile ? (
            <>
              <Dropdown
                menu={{ items: mobileMenuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
              <Button
                icon={<PoweroffOutlined />}
                onClick={() => onToggle(!isEnabled)}
                danger={isEnabled}
              >
                {isEnabled ? 'Disable' : 'Enable'}
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={onPublish}
                loading={publishing}
                disabled={!hasChanges}
              >
                Publish
              </Button>
            </>
          ) : (
            <>
              <Button icon={<PlusOutlined />} onClick={onAddCard}>
                Add Card
              </Button>
              <Tooltip title="Undo last change">
                <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo}>
                  Undo
                </Button>
              </Tooltip>
              <Tooltip title="Redo last undone change">
                <Button icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo}>
                  Redo
                </Button>
              </Tooltip>
              <Tooltip title="Revert all changes to last published version">
                <Button
                  icon={<RollbackOutlined />}
                  onClick={onRevertAll}
                  disabled={!hasChanges}
                >
                  Revert All
                </Button>
              </Tooltip>
              <Button
                icon={<PoweroffOutlined />}
                onClick={() => onToggle(!isEnabled)}
                danger={isEnabled}
              >
                {isEnabled ? 'Disable Section' : 'Enable Section'}
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={onPublish}
                loading={publishing}
                disabled={!hasChanges}
              >
                Publish
              </Button>
            </>
          )}
        </Space>
      </div>
    </div>
  )
}
