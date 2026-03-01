import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Typography, Spin, theme, Space, Empty, Button, App, Tag, Pagination } from 'antd'
import dayjs from 'dayjs'
import { PlusOutlined, ReloadOutlined, ShopOutlined, ArrowLeftOutlined, BugOutlined, DeleteOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../components/BusinessOwnerLayout'
import BusinessCard from '../components/BusinessCard'
import AddBusinessForm from '../components/AddBusinessForm'
import PendingApplicationView from '../components/PendingApplicationView'
import ApprovedBusinessView from '../components/ApprovedBusinessView'
import { useAuthSession } from '@/features/authentication'
import { getBusinesses, updateBusiness, deleteBusiness } from '../services/businessProfileService'

const { Title, Text } = Typography

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

const getStatusTagColor = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'active' || statusLower === 'approved') return 'success'
  if (statusLower === 'for renewal' || statusLower.includes('renewal')) return 'warning'
  if (statusLower === 'pending' || statusLower.includes('pending') || statusLower.includes('review') || statusLower === 'submitted') return 'processing'
  if (statusLower === 'expired' || statusLower === 'rejected') return 'error'
  if (statusLower === 'needs_revision' || statusLower === 'resubmit') return 'warning'
  if (statusLower === 'draft') return 'default'
  return 'default'
}

export default function BusinessOwnerDashboard() {
  const { currentUser, role, isLoading: authLoading } = useAuthSession()
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showProgressView, setShowProgressView] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const roleSlug = String(role?.slug ?? role ?? '').toLowerCase()

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBusinesses()
      setBusinesses(data || [])
      setLastUpdatedAt(new Date())
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
      message.error('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (currentUser && roleSlug === 'business_owner') {
      fetchBusinesses()
    }
  }, [currentUser, roleSlug, fetchBusinesses])

  const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)
  const appStatus = (selectedBusiness?.applicationStatus || selectedBusiness?.permitStatus || '').toLowerCase()
  const isDraft = selectedBusiness && appStatus === 'draft'
  const isApproved = selectedBusiness && appStatus === 'approved'
  const displayName = selectedBusiness
    ? (selectedBusiness.businessName || selectedBusiness.tradeName || selectedBusiness.formData?.['Business Name'] || selectedBusiness.formData?.['businessName'] || selectedBusiness.formData?.['Trade Name'] || selectedBusiness.formData?.['tradeName'] || 'Unnamed Business')
    : ''
  const displayReferenceNumber = selectedBusiness?.applicationReferenceNumber || selectedBusiness?.registrationNumber || null

  const handleBackFromForm = () => {
    setShowAddForm(false)
    setShowProgressView(false)
    setEditingBusiness(null)
    setSelectedBusinessId(null)
    fetchBusinesses()
  }

  const handleDeleteApplication = async (business) => {
    const businessId = business.businessId || business._id
    try {
      await deleteBusiness(businessId)
      message.success('Application deleted.')
      if (selectedBusinessId === businessId) {
        setSelectedBusinessId(null)
        setShowAddForm(false)
        setEditingBusiness(null)
      }
      fetchBusinesses()
    } catch (err) {
      console.error('Failed to delete application:', err)
      message.error(err?.message || 'Failed to delete application')
    }
  }

  const handleDeleteDraftClick = () => {
    if (!selectedBusiness) return
    modal.confirm({
      title: 'Delete draft application?',
      content: 'This will permanently remove this draft. You can add a new business later if needed.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDeleteApplication(selectedBusiness),
    })
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

  return (
    <BusinessOwnerLayout
      headerActions={
        <Space size="middle" wrap>
          {lastUpdatedAt && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last updated: {lastUpdatedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              {lastUpdatedAt.toDateString() !== new Date().toDateString() && ` · ${lastUpdatedAt.toLocaleDateString()}`}
            </Text>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchBusinesses}
            loading={loading}
          >
          </Button>
        </Space>
      }
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
        {/* Left panel - Business List (30%) - always visible */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>My Businesses</Title>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : businesses.length === 0 ? (
            <Empty description="No businesses registered yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
          ) : (
            <>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {businesses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((business) => {
                  const businessName = business.businessName || business.tradeName || business.formData?.['Business Name'] || business.formData?.['businessName'] || business.formData?.['Trade Name'] || business.formData?.['tradeName'] || 'Unnamed Business'
                  const referenceNumber = business.applicationReferenceNumber || business.registrationNumber || null
                  return (
                  <BusinessCard
                    key={business.businessId || business._id}
                    business={{
                      id: business.businessId || business._id,
                      name: businessName,
                      referenceNumber,
                      updatedAt: business.updatedAt,
                      address: business.businessAddress?.full ||
                        [business.businessAddress?.streetAddress || business.businessAddress?.street, business.businessAddress?.barangayName, business.businessAddress?.cityName].filter(Boolean).join(', ') ||
                        'No address',
                      permitStatus: getStatusLabel(business.applicationStatus || business.permitStatus),
                      businessType: business.primaryLineOfBusiness || business.lineOfBusiness || business.formType || 'N/A',
                    }}
                    isSelected={(business.businessId || business._id) === selectedBusinessId}
                    onClick={() => {
                      setSelectedBusinessId(business.businessId || business._id)
                      fetchBusinesses()
                    }}
                  />
                  )
                })}
              </Space>
              {businesses.length > PAGE_SIZE && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Pagination size="small" current={currentPage} pageSize={PAGE_SIZE} total={businesses.length} onChange={setCurrentPage} showSizeChanger={false} />
                </div>
              )}
            </>
          )}
          
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              setShowAddForm(true)
              setEditingBusiness(null)
              setSelectedBusinessId(null)
            }}
          >
            Add Business
          </Button>
        </div>

        {/* Right panel - Business Details or Add Form (70%) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: token.colorBgContainer,
            overflow: 'hidden',
          }}
        >
          {(showAddForm || selectedBusiness) ? (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {selectedBusiness ? (
                <>
                  <div
                    style={{
                      flexShrink: 0,
                      padding: '16px 24px',
                      borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorBgContainer,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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
                            {displayName}
                          </Title>
                          <Space size={8} style={{ marginTop: 4 }}>
                            {isDraft && !displayReferenceNumber && selectedBusiness?.updatedAt ? (
                              <Tag>Last updated: {dayjs(selectedBusiness.updatedAt).format('MMM D, YYYY h:mm A')}</Tag>
                            ) : (
                              <Tag>{displayReferenceNumber ? `${displayReferenceNumber}` : 'Pending'}</Tag>
                            )}
                            <Tag color={getStatusTagColor(selectedBusiness.applicationStatus || selectedBusiness.permitStatus)}>
                              {getStatusLabel(selectedBusiness.applicationStatus || selectedBusiness.permitStatus)}
                            </Tag>
                          </Space>
                        </div>
                      </Space>
                      <Space size="small">
                        {!isDraft && !isApproved ? (
                          <Button type="primary" onClick={() => setShowAddForm(prev => !prev)}>
                            {showAddForm ? 'View Progress' : 'View Application Form'}
                          </Button>
                        ) : isDraft ? (
                          <>
                            {import.meta.env.DEV && (
                              <Button
                                type="dashed"
                                icon={<BugOutlined />}
                                onClick={() => formRef.current?.fillTestData?.()}
                              >
                                Fill with test data
                              </Button>
                            )}
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={handleDeleteDraftClick}
                            >
                              Delete draft
                            </Button>
                            <Button
                              onClick={() => formRef.current?.saveDraft?.()}
                              loading={formSubmitting}
                            >
                              Save
                            </Button>
                            <Button
                              type="primary"
                              onClick={() => formRef.current?.submitApplication?.()}
                              loading={formSubmitting}
                            >
                              Submit
                            </Button>
                          </>
                        ) : null}
                      </Space>
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {isApproved && !showAddForm ? (
                      <ApprovedBusinessView business={selectedBusiness} onRefresh={fetchBusinesses} />
                    ) : !isDraft && !showAddForm ? (
                      <PendingApplicationView business={selectedBusiness} />
                    ) : (
                      <AddBusinessForm
                        ref={formRef}
                        embedded
                        onSubmittingChange={setFormSubmitting}
                        key={`${selectedBusiness?.businessId || selectedBusiness?._id || 'edit'}-${showAddForm}`}
                        onBack={handleBackFromForm}
                        editingBusiness={selectedBusiness}
                        readOnly={!isDraft}
                        onSubmitted={(response) => {
                          if (response?.businesses?.length) setBusinesses(response.businesses)
                          else fetchBusinesses()
                          setShowAddForm(false)
                        }}
                        onDraftCreated={(newBusiness) => {
                          setEditingBusiness(newBusiness)
                          setSelectedBusinessId(newBusiness.businessId || newBusiness._id)
                          fetchBusinesses()
                        }}
                      />
                    )}
                  </div>
                </>
              ) : (
                <AddBusinessForm
                  key="add-new"
                  onBack={handleBackFromForm}
                  editingBusiness={null}
                  onDraftCreated={(newBusiness) => {
                    setEditingBusiness(newBusiness)
                    setSelectedBusinessId(newBusiness.businessId || newBusiness._id)
                    fetchBusinesses()
                  }}
                />
              )}
            </div>
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
