import React from 'react'
import { Typography, Card, Row, Col, Button, Tooltip, ColorPicker, Grid } from 'antd'
import { theme } from 'antd'
import { BgColorsOutlined, CheckCircleFilled } from '@ant-design/icons'

const { Title, Text } = Typography

export default function ThemeTabContent({
  themeOptions,
  presetColors,
  pendingTheme,
  hoveredTheme,
  currentPrimaryColor,
  onSelectTheme,
  onMouseEnterTheme,
  onMouseLeaveTheme,
  onApplyTheme,
  onColorChange,
  onColorMouseEnter,
  onColorMouseLeave,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()

  return (
    <Card
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      styles={{ body: { padding: screens.xs ? 16 : 24 } }}
    >
      <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'flex-start' : 'center', gap: screens.xs ? 16 : 0, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: token.borderRadius,
                background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${token.colorPrimary}30`,
              }}
            >
              <BgColorsOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 4 }}>Customize Theme</Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Personalize your application appearance
              </Text>
            </div>
          </div>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={onApplyTheme}
          style={{
            minWidth: screens.xs ? '100%' : 140,
            height: 40,
            fontWeight: 500,
            boxShadow: `0 2px 8px ${token.colorPrimary}30`,
          }}
        >
          Apply Changes
        </Button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Choose Theme</Text>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Select a base theme that defines the overall look and feel of your application
          </Text>
        </div>
        <Row gutter={[16, 20]}>
          {themeOptions.map((option) => {
            const isSelected = pendingTheme === option.key
            const isHovered = hoveredTheme === option.key
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={option.key}>
                <Tooltip title={option.label}>
                  <div
                    onClick={() => onSelectTheme(option.key)}
                    onMouseEnter={() => onMouseEnterTheme(option.key)}
                    onMouseLeave={onMouseLeaveTheme}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      borderRadius: token.borderRadiusLG,
                      overflow: 'hidden',
                      border: isSelected
                        ? `2px solid ${option.active}`
                        : (isHovered ? `2px solid ${option.active}80` : `1px solid ${token.colorBorderSecondary}`),
                      boxShadow: isSelected
                        ? `0 4px 12px ${option.active}25`
                        : (isHovered ? `0 4px 8px ${token.colorBorderSecondary}40` : '0 2px 4px rgba(0,0,0,0.04)'),
                      transform: isHovered ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: token.colorBgContainer,
                    }}
                  >
                    <div
                      style={{
                        height: 20,
                        background: option.header,
                        borderBottom: `1px solid ${option.border}`,
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: option.active,
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', height: 60 }}>
                      <div
                        style={{
                          width: '25%',
                          background: option.side,
                          borderRight: `1px solid ${option.border}`,
                        }}
                      />
                      <div
                        style={{
                          width: '75%',
                          background: option.content,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <CheckCircleFilled
                            style={{
                              color: option.active,
                              fontSize: 18,
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Tooltip>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <Text
                    strong={isSelected}
                    style={{
                      fontSize: 13,
                      color: isSelected ? option.active : token.colorText,
                      transition: 'all 0.2s',
                    }}
                  >
                    {option.label}
                  </Text>
                </div>
              </Col>
            )
          })}
        </Row>
      </div>

      <div
        style={{
          paddingTop: 32,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Primary Color</Text>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Customize the primary accent color used throughout the application
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: screens.xs ? 'column' : 'row',
            gap: screens.xs ? 20 : 24,
            alignItems: screens.xs ? 'stretch' : 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: screens.xs ? '100%' : 300 }}>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              Preset Colors
            </Text>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                padding: 16,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              {presetColors.map((color) => {
                const isSelected = currentPrimaryColor === color
                return (
                  <Tooltip key={color} title={color}>
                    <div
                      onClick={() => onColorChange(color)}
                      onMouseEnter={() => onColorMouseEnter(color)}
                      onMouseLeave={onColorMouseLeave}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: token.borderRadius,
                        background: color,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isSelected
                          ? `0 0 0 3px ${token.colorBgContainer}, 0 0 0 5px ${color}`
                          : '0 2px 4px rgba(0,0,0,0.1)',
                        border: `2px solid ${token.colorBgContainer}`,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <CheckCircleFilled
                          style={{
                            color: '#fff',
                            fontSize: 18,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                          }}
                        />
                      )}
                    </div>
                  </Tooltip>
                )
              })}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: screens.xs ? '100%' : 200,
              padding: screens.xs ? 0 : '0 0 0 24px',
              borderLeft: screens.xs ? 'none' : `1px solid ${token.colorBorderSecondary}`,
              paddingLeft: screens.xs ? 0 : 24,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              Custom Color
            </Text>
            <div
              style={{
                padding: 16,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ColorPicker
                value={currentPrimaryColor}
                onChange={onColorChange}
                showText
                disabledAlpha
                trigger="click"
                size="large"
                format="hex"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
