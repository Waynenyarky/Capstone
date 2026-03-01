import React from 'react'
import { Card, Tag, Space, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import { ShopOutlined } from '@ant-design/icons'

const { Text } = Typography

const getStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'active' || statusLower === 'approved') return 'success'
  if (statusLower === 'for renewal' || statusLower.includes('renewal')) return 'warning'
  if (statusLower === 'pending' || statusLower.includes('pending') || statusLower.includes('review') || statusLower === 'submitted') return 'processing'
  if (statusLower === 'expired' || statusLower === 'rejected') return 'error'
  return 'default'
}

export default function BusinessCard({ business, isSelected, onClick }) {
  const { token } = theme.useToken()
  const isDraft = (business.permitStatus || '').toLowerCase() === 'draft'
  const hasRef = business.referenceNumber != null && business.referenceNumber !== ''

  return (
    <Card
      hoverable
      size="small"
      onClick={onClick}
      style={{
        width: '100%',
        cursor: 'pointer',
        border: isSelected ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Space size={8}>
          <ShopOutlined style={{ fontSize: 16, color: isSelected ? token.colorPrimary : token.colorTextSecondary }} />
          <Text strong style={{ fontSize: 13 }}>{business.name}</Text>
        </Space>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        {hasRef && (
          <Tag style={{ fontSize: 11 }}>{business.referenceNumber}</Tag>
        )}
        {isDraft && !hasRef && business.updatedAt && (
          <Tag style={{ fontSize: 11 }}>Last updated: {dayjs(business.updatedAt).format('MMM D')}</Tag>
        )}
        <Tag color={getStatusColor(business.permitStatus)} style={{ fontSize: 11 }}>{business.permitStatus}</Tag>
      </div>
    </Card>
  )
}
