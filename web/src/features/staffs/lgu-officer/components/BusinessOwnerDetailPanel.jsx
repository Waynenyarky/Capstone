import React, { useState, useEffect } from 'react'
import { Typography, Descriptions, Card, Space, Tag, Button, Empty, Spin, theme } from 'antd'
import { UserOutlined, ShopOutlined, FormOutlined, EditOutlined } from '@ant-design/icons'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS_COLORS = {
  approved: 'success',
  active: 'success',
  submitted: 'processing',
  under_review: 'processing',
  pending: 'processing',
  draft: 'default',
  rejected: 'error',
  needs_revision: 'warning',
}

export default function BusinessOwnerDetailPanel({ owner, onCreateWalkIn, onEditOwner }) {
  const { token } = theme.useToken()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!owner?._id) { setBusinesses([]); return }
    setLoading(true)
    get(`/api/lgu-officer/permit-applications?ownerId=${owner._id}&limit=50`, { skipAutoLogout: true })
      .then(res => {
        const apps = res?.data?.applications || res?.applications || []
        setBusinesses(apps)
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false))
  }, [owner?._id])

  if (!owner) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a business owner to view details" />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>Owner Details</Text>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEditOwner?.(owner)}>
            Edit Details
          </Button>
          <Button type="primary" icon={<FormOutlined />} onClick={() => onCreateWalkIn?.(owner)}>
            Process Application
          </Button>
        </Space>
      </div>

      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Name">
          <Space>
            <UserOutlined />
            <Text strong>{owner.firstName} {owner.lastName}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Email">{owner.email}</Descriptions.Item>
        {owner.phone && <Descriptions.Item label="Phone">{owner.phone}</Descriptions.Item>}
        <Descriptions.Item label="User ID"><Text code>{owner._id}</Text></Descriptions.Item>
        <Descriptions.Item label="Account Created">
          {owner.createdAt ? dayjs(owner.createdAt).format('MMM D, YYYY') : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Text strong style={{ display: 'block', marginBottom: 12 }}>Businesses / Applications</Text>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : businesses.length === 0 ? (
        <Empty description="No businesses found for this owner" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {businesses.map(biz => (
            <Card key={biz.applicationId || biz._id} size="small" hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ShopOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>{biz.businessName || 'Unnamed'}</Text>
                </Space>
                <Tag color={STATUS_COLORS[biz.status] || 'default'}>{biz.status || 'unknown'}</Tag>
              </div>
              {biz.applicationReferenceNumber && (
                <Text type="secondary" style={{ fontSize: 11 }}>{biz.applicationReferenceNumber}</Text>
              )}
            </Card>
          ))}
        </Space>
      )}
    </div>
  )
}
