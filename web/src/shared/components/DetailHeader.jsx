import { Button, Select, Form, Space, Grid, Typography, theme, Tooltip } from 'antd'

const { useBreakpoint } = Grid
const { Text } = Typography

export default function DetailHeader({
  title,
  primaryButton,
  iconButtons = [],
  selectFields = [],
  actionButtons = [],
  desktopOnly = true,
}) {
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  return (
    <div style={{ padding: '16px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
      {desktopOnly && screens.lg && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 16 }}>
            {title}
          </Text>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', width: screens.md ? 'auto' : '100%' }}>
          {primaryButton && (
            <Button
              type={primaryButton.type || 'primary'}
              onClick={primaryButton.onClick}
              loading={primaryButton.loading}
              disabled={primaryButton.disabled}
              style={{ flex: screens.xs ? 1 : 'auto' }}
            >
              {primaryButton.icon} {primaryButton.text}
            </Button>
          )}
          {iconButtons.length > 0 && (
            <Space.Compact>
              {iconButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  icon={btn.icon}
                  onClick={btn.onClick}
                  title={btn.title}
                  disabled={btn.disabled}
                />
              ))}
            </Space.Compact>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', width: screens.md ? 'auto' : '100%' }}>
          {selectFields.length > 0 && selectFields.map((field, idx) => (
            <Form.Item key={idx} label={field.label} style={{ marginBottom: 0, flex: screens.md ? 'none' : 1 }}>
              <Select
                value={field.value}
                onChange={field.onChange}
                loading={field.loading}
                style={{ width: screens.md ? field.width || 160 : '100%' }}
                disabled={field.disabled}
                options={field.options}
              />
            </Form.Item>
          ))}
          {actionButtons.length > 0 && (
            <>
              {actionButtons.map((btn, idx) => {
                if (btn.fullWidthOnMobile && !screens.md) {
                  return (
                    <Tooltip key={idx} title={btn.tooltip}>
                      <Button
                        type={btn.type || 'default'}
                        onClick={btn.disabled && btn.onDisabledClick ? btn.onDisabledClick : btn.onClick}
                        loading={btn.loading}
                        disabled={btn.disabled && !btn.onDisabledClick}
                        danger={btn.danger}
                        icon={btn.icon}
                        style={{ 
                          width: '100%',
                          color: btn.disabled ? token.colorTextDisabled : undefined,
                        }}
                      >
                        {btn.text}
                      </Button>
                    </Tooltip>
                  )
                }
                return null
              })}
              <Space.Compact style={{ width: screens.md ? 'auto' : '100%' }}>
                {actionButtons.map((btn, idx) => {
                  if (btn.fullWidthOnMobile && !screens.md) return null
                  return (
                    <Tooltip key={idx} title={btn.tooltip}>
                      <Button
                        type={btn.type || 'default'}
                        onClick={btn.disabled && btn.onDisabledClick ? btn.onDisabledClick : btn.onClick}
                        loading={btn.loading}
                        disabled={btn.disabled && !btn.onDisabledClick}
                        danger={btn.danger}
                        icon={btn.icon}
                        style={{ 
                          flex: screens.xs ? 1 : 'auto',
                          color: btn.disabled ? token.colorTextDisabled : undefined,
                        }}
                      >
                        {btn.text}
                      </Button>
                    </Tooltip>
                  )
                })}
              </Space.Compact>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
