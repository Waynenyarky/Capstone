import React, { useState, useEffect, useCallback } from 'react'
import { Typography, Spin, theme, Tag, Space, Empty, Button, message } from 'antd'
import { 
  DashboardOutlined, 
  ShopOutlined, 
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import BusinessOwnerLayout from '../components/BusinessOwnerLayout'
import BusinessCard from '../components/BusinessCard'
import AddBusinessForm from '../components/AddBusinessForm'
import PendingApplicationView from '../components/PendingApplicationView'
import ApprovedBusinessView from '../components/ApprovedBusinessView'
import { useAuthSession } from '@/features/authentication'
import { getBusinesses, updateBusiness } from '../services/businessProfileService'

const { Title, Text } = Typography

const PENDING_STATUSES = ['draft', 'submitted', 'under_review', 'needs_revision', 'resubmit']
const APPROVED_STATUSES = ['approved', 'active']
const REJECTED_STATUSES = ['rejected']

function getViewType(status) {
  const statusLower = (status || '').toLowerCase()
  if (APPROVED_STATUSES.includes(statusLower)) return 'approved'
  if (REJECTED_STATUSES.includes(statusLower)) return 'rejected'
  return 'pending'
}

const getStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'active' || statusLower === 'approved') return 'success'
  if (statusLower === 'for renewal' || statusLower === 'pending_renewal') return 'warning'
  if (statusLower === 'pending' || statusLower === 'submitted' || statusLower === 'under_review') return 'processing'
  if (statusLower === 'expired' || statusLower === 'rejected') return 'error'
  return 'default'
}

const getStatusLabel = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'submitted') return 'Pending Review'
  if (statusLower === 'under_review') return 'Under Review'
  if (statusLower === 'pending_renewal') return 'For Renewal'
  if (statusLower === 'approved') return 'Active'
  if (statusLower === 'needs_revision' || statusLower === 'resubmit') return 'Needs Revision'
  if (statusLower === 'rejected') return 'Rejected'
  if (statusLower === 'draft') return 'Draft'
  return status || 'Unknown'
}

export default function BusinessOwnerDashboard() {
  const { currentUser, role, isLoading: authLoading } = useAuthSession()
  const { token } = theme.useToken()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const roleSlug = String(role?.slug ?? role ?? '').toLowerCase()

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBusinesses()
      setBusinesses(data || [])
      if (data?.length > 0 && !selectedBusinessId) {
        setSelectedBusinessId(data[0].businessId || data[0]._id)
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
      message.error('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }, [selectedBusinessId])

  useEffect(() => {
    if (currentUser && roleSlug === 'business_owner') {
      fetchBusinesses()
    }
  }, [currentUser, roleSlug, fetchBusinesses])

  const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)

  const handleBackFromForm = () => {
    setShowAddForm(false)
    setEditingBusiness(null)
    fetchBusinesses()
  }

  const handleEditBusiness = (business) => {
    setEditingBusiness(business)
    setShowAddForm(true)
  }

  const handleSubmitApplication = async (business) => {
    const businessId = business.businessId || business._id
    setSubmitting(true)
    try {
      await updateBusiness(businessId, {
        applicationStatus: 'submitted',
        submittedAt: new Date().toISOString(),
      })
      message.success('Application submitted successfully!')
      fetchBusinesses()
    } catch (err) {
      console.error('Failed to submit application:', err)
      message.error(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!currentUser || roleSlug !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Redirecting..."><div style={{ minHeight: 48 }} /></Spin>
      </div>
    )
  }

  if (showAddForm) {
    return (
      <BusinessOwnerLayout 
        pageTitle={editingBusiness ? "Edit Application" : "Add Business"} 
        pageIcon={<PlusOutlined />}
      >
        <AddBusinessForm 
          onBack={handleBackFromForm} 
          editingBusiness={editingBusiness}
        />
      </BusinessOwnerLayout>
    )
  }

  return (
    <BusinessOwnerLayout 
      pageTitle="Dashboard" 
      pageIcon={<DashboardOutlined />}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          minHeight: 400,
          borderRadius: token.borderRadiusLG,
          overflow: 'hidden',
        }}
      >
        {/* Left panel - Business List (30%) */}
        <div
          style={{
            width: '30%',
            minWidth: 280,
            maxWidth: 400,
            flexShrink: 0,
            borderRight: `1px solid ${token.colorBorder}`,
            padding: 16,
            overflowY: 'auto',
            background: token.colorBgLayout,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0 }}>My Businesses</Title>
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />} 
              onClick={fetchBusinesses}
              loading={loading}
            />
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : businesses.length === 0 ? (
            <Empty 
              description="No businesses yet" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '24px 0' }}
            />
          ) : (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {businesses.map((business) => (
                <BusinessCard
                  key={business.businessId || business._id}
                  business={{
                    id: business.businessId || business._id,
                    name: business.businessName || business.tradeName || 'Unnamed Business',
                    address: business.businessAddress?.full || 
                      [business.businessAddress?.street, business.businessAddress?.barangayName, business.businessAddress?.cityName].filter(Boolean).join(', ') ||
                      'No address',
                    permitStatus: getStatusLabel(business.applicationStatus || business.permitStatus),
                    businessType: business.primaryLineOfBusiness || business.lineOfBusiness || business.formType || 'N/A',
                  }}
                  isSelected={(business.businessId || business._id) === selectedBusinessId}
                  onClick={() => setSelectedBusinessId(business.businessId || business._id)}
                />
              ))}
            </Space>
          )}
          
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => setShowAddForm(true)}
          >
            Add Business
          </Button>
        </div>

        {/* Right panel - Business Details (70%) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: token.colorBgContainer,
            overflow: 'hidden',
          }}
        >
          {selectedBusiness ? (
            <>
              {/* Header */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '16px 24px',
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space size={12}>
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: token.borderRadius,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: token.colorPrimaryBg,
                        color: token.colorPrimary,
                      }}
                    >
                      <ShopOutlined style={{ fontSize: 20 }} />
                    </span>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        {selectedBusiness.businessName || selectedBusiness.tradeName || 'Unnamed Business'}
                      </Title>
                      <Text type="secondary">
                        {selectedBusiness.applicationReferenceNumber || selectedBusiness.registrationNumber || 'No reference number'}
                      </Text>
                    </div>
                  </Space>
                  <Tag 
                    color={getStatusColor(selectedBusiness.applicationStatus || selectedBusiness.permitStatus)} 
                    style={{ fontSize: 13, padding: '4px 12px' }}
                  >
                    {getStatusLabel(selectedBusiness.applicationStatus || selectedBusiness.permitStatus)}
                  </Tag>
                </div>
              </div>

              {/* Content based on status */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {getViewType(selectedBusiness.applicationStatus || selectedBusiness.permitStatus) === 'approved' ? (
                  <ApprovedBusinessView business={selectedBusiness} />
                ) : (
                  <PendingApplicationView 
                    business={selectedBusiness} 
                    onEdit={handleEditBusiness}
                    onSubmit={handleSubmitApplication}
                    submitting={submitting}
                  />
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description={businesses.length === 0 ? "Add your first business to get started" : "Select a business to view details"} />
            </div>
          )}
        </div>
      </div>
    </BusinessOwnerLayout>
  )
}
