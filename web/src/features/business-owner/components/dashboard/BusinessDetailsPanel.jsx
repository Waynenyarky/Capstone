import React from 'react'
import { Typography, Space, Tag, Button, Empty } from 'antd'
import { ShopOutlined, BugOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import ApprovedBusinessView from '../ApprovedBusinessView'
import PendingApplicationView from '../PendingApplicationView'
import AddBusinessForm from '../AddBusinessForm'

const { Title } = Typography

function getStatusTagColor(status) {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'active' || statusLower === 'approved') return 'success'
  if (statusLower === 'for renewal' || statusLower.includes('renewal')) return 'warning'
  if (statusLower === 'pending' || statusLower.includes('pending') || statusLower.includes('review') || statusLower === 'submitted') return 'processing'
  if (statusLower === 'expired' || statusLower === 'rejected') return 'error'
  if (statusLower === 'needs_revision' || statusLower === 'resubmit') return 'warning'
  if (statusLower === 'draft') return 'default'
  return 'default'
}

function getStatusLabel(status) {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'submitted') return 'Pending Review'
  if (statusLower === 'under_review') return 'Under Review'
  if (statusLower === 'pending_renewal') return 'For Renewal'
  if (statusLower === 'approved') return 'Active'
  if (statusLower === 'needs_revision') return 'Action Required'
  if (statusLower === 'resubmit') return 'Resubmitted'
  if (statusLower === 'rejected') return 'Rejected'
  if (statusLower === 'draft') return 'Draft'
  return status || 'Unknown'
}

function BusinessDetailsPanel({ 
  selectedBusiness, 
  showAddForm, 
  formRef, 
  formSubmitting,
  onToggleForm,
  onDeleteDraft,
  onSaveDraft,
  onSubmitApplication,
  onFillTestData,
  onBackFromForm,
  onSubmitted,
  onDraftCreated
}) {
  if (!selectedBusiness) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="Select a business to view details" />
      </div>
    )
  }

  const appStatus = (selectedBusiness?.applicationStatus || selectedBusiness?.permitStatus || '').toLowerCase()
  const isDraft = appStatus === 'draft'
  const isApproved = appStatus === 'approved'
  const displayName = selectedBusiness
    ? (selectedBusiness.businessName || selectedBusiness.tradeName || selectedBusiness.formData?.businessName || selectedBusiness.formData?.['Business / trade name'] || selectedBusiness.formData?.registeredBusinessName || selectedBusiness.formData?.['Business Name'] || selectedBusiness.formData?.['Trade Name'] || selectedBusiness.formData?.tradeName || 'Unnamed Business')
    : ''
  const displayReferenceNumber = selectedBusiness?.applicationReferenceNumber || selectedBusiness?.registrationNumber || null

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 24px',
          borderBottom: '1px solid #d9d9d9',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space size={12}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f5ff',
                color: '#1890ff',
              }}
            >
              <ShopOutlined style={{ fontSize: 20 }} />
            </span>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {displayName}
              </Title>
            </div>
          </Space>
          <Space size="small">
            {!isDraft && !isApproved ? (
              <Button type="primary" onClick={onToggleForm}>
                {showAddForm ? 'View Progress' : 'View Submitted Application'}
              </Button>
            ) : isDraft ? (
              <>
                {import.meta.env.DEV && (
                  <Button
                    type="dashed"
                    icon={<BugOutlined />}
                    onClick={onFillTestData}
                  >
                    Fill with test data
                  </Button>
                )}
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={onDeleteDraft}
                >
                  Delete draft
                </Button>
                <Button
                  onClick={onSaveDraft}
                  loading={formSubmitting}
                >
                  Save as Draft
                </Button>
                <Button
                  type="primary"
                  onClick={onSubmitApplication}
                  loading={formSubmitting}
                >
                  Submit
                </Button>
              </>
            ) : null}
          </Space>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isApproved && !showAddForm ? (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <ApprovedBusinessView business={selectedBusiness} onRefresh={() => {}} />
          </div>
        ) : !isDraft && !showAddForm ? (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <PendingApplicationView business={selectedBusiness} />
          </div>
        ) : (
          <AddBusinessForm
            ref={formRef}
            embedded
            onSubmittingChange={() => {}}
            key={`${selectedBusiness?.businessId || selectedBusiness?._id || 'edit'}-${showAddForm}`}
            onBack={onBackFromForm}
            editingBusiness={selectedBusiness}
            readOnly={!isDraft}
            onSubmitted={onSubmitted}
            onDraftCreated={onDraftCreated}
          />
        )}
      </div>
    </div>
  )
}

export default BusinessDetailsPanel
