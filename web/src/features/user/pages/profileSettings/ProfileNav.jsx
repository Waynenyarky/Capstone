import { Typography } from 'antd'
import { theme } from 'antd'
import { PROFILE_NAV_ITEMS } from './constants'

const { Text } = Typography

export default function ProfileNav({ selectedTab, onSelectTab, navItems = PROFILE_NAV_ITEMS }) {
  const { token } = theme.useToken()

  const renderItem = ({ key: navKey, label, icon: Icon }, isSelected) => (
    <div
      key={navKey}
      role="button"
      tabIndex={0}
      onClick={() => onSelectTab(navKey)}
      onKeyDown={(e) => e.key === 'Enter' && onSelectTab(navKey)}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {navItems.map((item) => renderItem(item, selectedTab === item.key))}
    </div>
  )
}
