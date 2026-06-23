import React from 'react'
import { Card, Typography, Space, Button, Skeleton, theme } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography

export default function CompactListCard({
  icon: Icon,
  title,
  items = [],
  viewAllLabel,
  viewAllTo,
  loading = false,
  emptyMessage = 'No items',
}) {
  const { token } = theme.useToken()
  const navigate = useNavigate()

  if (loading) {
    return (
      <Card
        size="small"
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: token.borderRadiusLG,
        }}
        bodyStyle={{ padding: 16, paddingTop: 96 }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    )
  }

  const displayItems = items.slice(0, 2)

  return (
    <Card
      size="small"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
      }}
      bodyStyle={{ padding: 16, paddingTop: 96 }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {Icon && <Icon style={{ fontSize: 20, color: token.colorTextSecondary }} />}
        <Title level={5} style={{ margin: 0, fontSize: 16 }}>
          {title}
        </Title>
      </div>

      {/* Card Body */}
      {displayItems.length > 0 ? (
        <Space.Compact direction="vertical" style={{ width: '100%' }}>
          {displayItems.map((item) => (
            <Button
              key={item.key}
              type="default"
              size="small"
              onClick={() => {
                if (viewAllTo) navigate(viewAllTo)
              }}
              style={{
                textAlign: 'left',
                height: 'auto',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'flex-start',
              }}
            >
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                {item.label}
              </span>
            </Button>
          ))}
          {viewAllLabel && viewAllTo && (
            <Button
              type="default"
              size="small"
              onClick={() => navigate(viewAllTo)}
              style={{
                textAlign: 'left',
                height: 'auto',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'flex-start',
              }}
            >
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                {viewAllLabel}
              </span>
            </Button>
          )}
        </Space.Compact>
      ) : (
        <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
          {emptyMessage}
        </div>
      )}
    </Card>
  )
}
