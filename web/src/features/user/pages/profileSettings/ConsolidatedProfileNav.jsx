import React from 'react'
import { Typography, Divider } from 'antd'
import { theme } from 'antd'
import { CONSOLIDATED_NAV_ITEMS } from './constants'

const { Text } = Typography

export default function ConsolidatedProfileNav({ selectedKey, onSelectKey, navItems = CONSOLIDATED_NAV_ITEMS }) {
  const { token } = theme.useToken()

  // Group items by section
  const groupedItems = navItems.reduce((groups, item) => {
    if (!groups[item.section]) {
      groups[item.section] = []
    }
    groups[item.section].push(item)
    return groups
  }, {})

  // Section labels mapping
  const sectionLabels = {
    general: 'General',
    security: 'Security', 
    theme: 'Theme',
  }

  const renderItem = ({ key: navKey, label, icon: Icon }, isSelected) => (
    <div
      key={navKey}
      role="button"
      tabIndex={0}
      onClick={() => onSelectKey(navKey)}
      onKeyDown={(e) => e.key === 'Enter' && onSelectKey(navKey)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none',
        transition: 'all 0.15s ease',
        fontWeight: isSelected ? 600 : 400,
        whiteSpace: 'normal',
        height: 'auto',
        minHeight: 40,
        lineHeight: 1.4,
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
        style={{ 
          fontSize: 13, 
          flex: 1, 
          lineHeight: 1.4,
          color: isSelected ? token.colorPrimary : undefined
        }}
      >
        {label}
      </Text>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(groupedItems).map(([section, items], index) => (
        <div key={section}>
          {/* Section header */}
          <div style={{ marginBottom: 8 }}>
            <Text
              strong
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                color: token.colorTextTertiary,
                letterSpacing: '0.5px',
                paddingLeft: 12,
              }}
            >
              {sectionLabels[section] || section}
            </Text>
          </div>
          
          {/* Section items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map((item) => renderItem(item, selectedKey === item.key))}
          </div>
          
          {/* Divider between sections (but not after the last one) */}
          {index < Object.keys(groupedItems).length - 1 && (
            <Divider 
              style={{ 
                margin: '16px 0 8px 0', 
                borderColor: token.colorBorderSecondary 
              }} 
            />
          )}
        </div>
      ))}
    </div>
  )
}
