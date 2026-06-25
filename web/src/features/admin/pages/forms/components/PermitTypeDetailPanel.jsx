import { useState } from 'react'
import { theme, Button, Space, Typography, Tag, Select } from 'antd'
import { SaveOutlined, HistoryOutlined, UndoOutlined, RedoOutlined, RollbackOutlined, InfoCircleOutlined, DashboardOutlined, FileTextOutlined, DollarOutlined } from '@ant-design/icons'
import FormTab from './FormTab'
import FeesTab from './FeesTab'
import { FORM_TABS } from '../constants/forms.constants'

const { Text } = Typography

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

const ICON_MAP = {
  DashboardOutlined,
  FileTextOutlined,
  DollarOutlined,
}

export default function PermitTypeDetailPanel({ permitType, isMobile = false }) {
  const { token } = theme.useToken()
  const [activeTab, setActiveTab] = useState('overview')
  const [feeGroupId, setFeeGroupId] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ padding: 24 }}>
            <Typography.Title level={5}>Overview</Typography.Title>
            <Text type="secondary">Permit type overview - coming soon</Text>
          </div>
        )
      case 'form_versions':
        return <FormTab permitTypeId={permitType?.cardId} feeGroupId={feeGroupId} onFeeGroupChange={setFeeGroupId} onChange={() => setHasChanges(true)} isMobile={isMobile} />
      case 'fees':
        return <FeesTab feeGroupId={feeGroupId} onFeeGroupChange={setFeeGroupId} />
      default:
        return null
    }
  }

  const renderTabSwitcher = () => {
    if (isMobile) {
      return (
        <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0 }}>
          <Select
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            style={{ width: '100%' }}
            options={FORM_TABS.map((tab) => ({
              value: tab.key,
              label: tab.label,
            }))}
          />
        </div>
      )
    }

    return (
      <div
        style={{
          width: 200,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {FORM_TABS.map((tab) => {
          const Icon = ICON_MAP[tab.icon]
          return (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? 'primary' : 'default'}
              onClick={() => setActiveTab(tab.key)}
              icon={Icon && <Icon />}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
              }}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
          flexShrink: 0,
        }}
      >
        {!isMobile && (
          <div style={{ marginBottom: 12 }}>
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                Form Details
              </Text>
              <Tag color={hasChanges ? 'warning' : 'success'} style={{ fontWeight: 'normal' }}>
                {hasChanges ? 'Unsaved' : 'Published'}
              </Tag>
            </Space>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0 }}>
          <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
            <Button type="primary" icon={<SaveOutlined />} disabled={!hasChanges} style={{ flex: isMobile ? 1 : 'auto' }}>
              Publish Changes
            </Button>
            <Space.Compact>
              <Button icon={<UndoOutlined />} disabled={!canUndo} />
              <Button icon={<RedoOutlined />} disabled={!canRedo} />
              <Button icon={<RollbackOutlined />} />
            </Space.Compact>
            <Space.Compact>
              <Button icon={<InfoCircleOutlined />} disabled />
              <Button icon={<HistoryOutlined />} />
            </Space.Compact>
          </div>
          {!isMobile && (
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
              <Select
                value="active"
                style={{ width: 120 }}
                options={STATUS_OPTIONS}
              />
            </Space>
          )}
        </div>
      </div>

      {/* Body with tab switcher */}
      {isMobile ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderTabSwitcher()}
          <div style={{ flex: 1, overflow: 'auto' }}>{renderTabContent()}</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {renderTabSwitcher()}
          <div style={{ flex: 1, overflow: 'auto' }}>{renderTabContent()}</div>
        </div>
      )}
    </div>
  )
}
