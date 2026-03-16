import React, { useState, useEffect } from 'react'
import { Typography, Descriptions, Card, Space, Tag, Button, Empty, Spin, theme, Modal } from 'antd'
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
  const [ownerProfilePreview, setOwnerProfilePreview] = useState(null)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadOwnerApplications = async () => {
      if (!owner?._id) {
        if (isMounted) {
          setBusinesses([])
          setOwnerProfilePreview(null)
          setSelectedBusiness(null)
        }
        return
      }

      if (isMounted) {
        setLoading(true)
        setOwnerProfilePreview(null)
        setSelectedBusiness(null)
      }

      try {
        const res = await get(`/api/lgu-officer/permit-applications?ownerId=${owner._id}&limit=50`, { skipAutoLogout: true })
        const apps = res?.data?.applications || res?.applications || []
        if (isMounted) {
          setBusinesses(apps)
        }

        const firstAppId = apps?.[0]?.applicationId || apps?.[0]?.businessId || apps?.[0]?._id
        if (firstAppId) {
          try {
            const detail = await get(`/api/lgu-officer/permit-applications/${firstAppId}`, { skipAutoLogout: true })
            if (isMounted) {
              setOwnerProfilePreview({
                businessOwner: detail?.businessOwner || {},
                ownerIdentity: detail?.ownerIdentity || {},
                businessRegistration: detail?.businessRegistration || {},
              })
            }
          } catch {
            if (isMounted) setOwnerProfilePreview(null)
          }
        }
      } catch {
        if (isMounted) {
          setBusinesses([])
          setOwnerProfilePreview(null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadOwnerApplications()

    return () => {
      isMounted = false
    }
  }, [owner?._id])

  const previewBusinessOwner = ownerProfilePreview?.businessOwner || {}
  const previewOwnerIdentity = ownerProfilePreview?.ownerIdentity || {}
  const previewBusinessReg = ownerProfilePreview?.businessRegistration || {}
  const previewAddress = previewBusinessOwner?.address || previewOwnerIdentity?.address || {}

  const ownerDisplayName = [
    owner?.firstName || previewBusinessOwner?.firstName,
    owner?.lastName || previewBusinessOwner?.lastName,
  ].filter(Boolean).join(' ') || previewBusinessOwner?.name || previewOwnerIdentity?.fullName || '—'

  const ownerPhone = owner?.phoneNumber || owner?.phone || previewBusinessOwner?.phoneNumber || previewBusinessReg?.mobileNumber
  const accountCreatedAt = owner?.createdAt
  const ownerSex = previewBusinessOwner?.sex || previewOwnerIdentity?.sex
  const ownerDob = previewBusinessOwner?.dateOfBirth || previewOwnerIdentity?.dateOfBirth
  const ownerMaritalStatus = previewBusinessOwner?.maritalStatus || previewOwnerIdentity?.maritalStatus
  const ownerNationality = previewBusinessOwner?.nationality || previewOwnerIdentity?.nationality || previewBusinessReg?.ownerNationality
  const ownerAddress = [
    previewAddress?.streetAddress || previewAddress?.street,
    previewAddress?.barangayName || previewAddress?.barangay,
    previewAddress?.cityName || previewAddress?.city,
    previewAddress?.provinceName || previewAddress?.province,
    previewAddress?.postalCode || previewAddress?.zipCode,
  ].filter(Boolean).join(', ')

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
            <Text strong>{ownerDisplayName}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Email">{owner.email || previewBusinessOwner?.email || '—'}</Descriptions.Item>
        {ownerPhone && <Descriptions.Item label="Phone">{ownerPhone}</Descriptions.Item>}
        {ownerSex && <Descriptions.Item label="Sex">{String(ownerSex)}</Descriptions.Item>}
        {ownerDob && <Descriptions.Item label="Date of Birth">{dayjs(ownerDob).format('MMM D, YYYY')}</Descriptions.Item>}
        {ownerMaritalStatus && <Descriptions.Item label="Marital Status">{String(ownerMaritalStatus)}</Descriptions.Item>}
        {ownerNationality && <Descriptions.Item label="Nationality">{ownerNationality}</Descriptions.Item>}
        {ownerAddress && <Descriptions.Item label="Address">{ownerAddress}</Descriptions.Item>}
        <Descriptions.Item label="User ID"><Text code>{owner._id}</Text></Descriptions.Item>
        <Descriptions.Item label="Account Created">
          {accountCreatedAt ? dayjs(accountCreatedAt).format('MMM D, YYYY') : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Text strong style={{ display: 'block', marginBottom: 12 }}>Businesses / Applications ({businesses.length})</Text>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : businesses.length === 0 ? (
        <Empty description="No businesses found for this owner" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {businesses.map(biz => (
            <Card
              key={biz.applicationId || biz._id}
              size="small"
              hoverable
              onClick={() => setSelectedBusiness(biz)}
              style={{
                cursor: 'pointer',
                borderColor: selectedBusiness?.applicationId === biz?.applicationId ? token.colorPrimary : undefined,
              }}
            >
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

      <Modal
        title={selectedBusiness?.businessName || 'Business Application'}
        open={Boolean(selectedBusiness)}
        onCancel={() => setSelectedBusiness(null)}
        footer={null}
      >
        <Text type="secondary">Application modal content placeholder.</Text>
      </Modal>
    </div>
  )
}
