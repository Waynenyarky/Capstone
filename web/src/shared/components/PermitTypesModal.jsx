import React from 'react'
import { Typography, Modal, theme, Divider } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { GENERAL_PERMIT_CATEGORIES } from '@/features/business-owner/constants/businessFormConstants'
import {
  TeamOutlined, HeartOutlined, ToolOutlined, FireOutlined,
  GiftOutlined, ShoppingCartOutlined, RiseOutlined,
  ExperimentOutlined, BlockOutlined, InboxOutlined, MoreOutlined
} from '@ant-design/icons'

const { Text } = Typography

const ICON_MAP = {
  TeamOutlined,
  HeartOutlined,
  ToolOutlined,
  FireOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  ShopOutlined,
  ExperimentOutlined,
  BlockOutlined,
  InboxOutlined,
  MoreOutlined,
}

export default function PermitTypesModal({ open, onCancel, selectedPermitType = 'regular' }) {
  const { token } = theme.useToken()

  const getSelectedPermitCard = () => {
    if (selectedPermitType === 'regular') {
      return {
        label: 'Unified Business Permit',
        description: 'Standard business permit for regular operations including retail, services, and other established businesses.',
        bestFor: ['Retail stores', 'Service businesses', 'Restaurants and food establishments', 'Professional services'],
        icon: ShopOutlined
      }
    }
    const category = GENERAL_PERMIT_CATEGORIES.find(cat => cat.value === selectedPermitType)
    if (category) {
      return {
        label: category.label,
        description: category.description,
        bestFor: category.bestFor,
        icon: ICON_MAP[category.icon] || MoreOutlined
      }
    }
    return null
  }

  const selectedCard = getSelectedPermitCard()

  return (
    <Modal
      title="Business Permit Types"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div style={{ display: 'flex', flexDirection: 'column', }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            Selected permit type:
          </Text>
          {selectedCard && (
            <div
              style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgContainer,
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <div
                style={{
                  flex: '0 0 40%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '16px 20px',
                  paddingTop: 60,
                }}
              >
                {React.createElement(selectedCard.icon, {
                  style: {
                    fontSize: 24,
                    color: token.colorTextSecondary,
                    marginBottom: 8,
                  }
                })}
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {selectedCard.label}
                </Typography.Title>
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '24px',
                  borderLeft: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Text
                  style={{
                    display: 'block',
                    marginBottom: 16,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: token.colorText,
                  }}
                >
                  {selectedCard.description}
                </Text>
                <div>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Best for:
                  </Text>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: token.colorTextSecondary }}>
                    {selectedCard.bestFor.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <Divider />

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
            Other permit types:
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {GENERAL_PERMIT_CATEGORIES.map((category) => {
              const IconComponent = ICON_MAP[category.icon] || MoreOutlined
              return (
                <div
                  key={category.value}
                  style={{
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadiusLG,
                    background: token.colorBgContainer,
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <div
                    style={{
                      flex: '0 0 40%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      padding: '16px 20px',
                      paddingTop: 60,
                    }}
                  >
                    <IconComponent
                      style={{
                        fontSize: 24,
                        color: token.colorTextSecondary,
                        marginBottom: 8,
                      }}
                    />
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {category.label}
                    </Typography.Title>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '24px',
                      borderLeft: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: 16,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: token.colorText,
                      }}
                    >
                      {category.description}
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Best for:
                      </Text>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: token.colorTextSecondary }}>
                        {category.bestFor.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
