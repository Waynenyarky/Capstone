import { useState, useEffect } from 'react'
import ListPanel from '@/shared/components/ListPanel'
import PanelCard from '@/shared/components/PanelCard'
import ResponsiveSplitLayout from '@/shared/components/ResponsiveSplitLayout'
import ApplicationDetailPanel from '../pages/applications/components/ApplicationDetailPanel'
import LottieSpinner from '@/shared/components/LottieSpinner'

const STATUS_CONFIG = {
  submitted: { color: 'blue', label: 'Pending Review' },
  under_review: { color: 'gold', label: 'Under Review' },
  resubmit: { color: 'cyan', label: 'Resubmitted' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  returned: { color: 'warning', label: 'Returned' },
  needs_revision: { color: 'volcano', label: 'Needs Revision' },
  appeal_pending: { color: 'purple', label: 'Appeal Pending' },
  appeal_rejected: { color: 'red', label: 'Appeal Rejected' },
  draft: { color: 'default', label: 'Draft' },
}

const mockApplications = [
  {
    _id: 'app-1',
    applicationId: 'app-1',
    businessId: 'biz-1',
    businessName: 'Sari-Sari Store ni Aling Nena',
    applicationReferenceNumber: 'APP-2024-001',
    status: 'submitted',
    applicationStatus: 'submitted',
    formType: 'unified_business_permit',
    formData: { businessName: 'Sari-Sari Store ni Aling Nena' },
    createdAt: '2024-01-15T08:00:00Z',
    submittedAt: '2024-01-15T08:00:00Z',
    reviewedBy: null,
    reviewedByName: null,
  },
  {
    _id: 'app-2',
    applicationId: 'app-2',
    businessId: 'biz-2',
    businessName: 'Carinderia ni Mang Jose',
    applicationReferenceNumber: 'APP-2024-002',
    status: 'under_review',
    applicationStatus: 'under_review',
    formType: 'unified_business_permit',
    formData: { businessName: 'Carinderia ni Mang Jose' },
    createdAt: '2024-01-16T09:00:00Z',
    submittedAt: '2024-01-16T09:00:00Z',
    reviewedBy: 'officer-1',
    reviewedByName: 'Officer Cruz',
  },
  {
    _id: 'app-3',
    applicationId: 'app-3',
    businessId: 'biz-3',
    businessName: 'Hardware Store Depot',
    applicationReferenceNumber: 'APP-2024-003',
    status: 'approved',
    applicationStatus: 'approved',
    formType: 'unified_business_permit',
    formData: { businessName: 'Hardware Store Depot' },
    createdAt: '2024-01-17T10:00:00Z',
    submittedAt: '2024-01-17T10:00:00Z',
    reviewedBy: 'officer-1',
    reviewedByName: 'Officer Santos',
  },
  {
    _id: 'app-4',
    applicationId: 'app-4',
    businessId: 'biz-4',
    businessName: 'Cooperative Market',
    applicationReferenceNumber: 'APP-2024-004',
    status: 'needs_revision',
    applicationStatus: 'needs_revision',
    formType: 'general_permit',
    formData: { 
      businessName: 'Cooperative Market',
      generalPermitCategory: 'cooperative',
    },
    createdAt: '2024-01-18T11:00:00Z',
    submittedAt: '2024-01-18T11:00:00Z',
    reviewedBy: 'officer-2',
    reviewedByName: 'Officer Reyes',
  },
  {
    _id: 'app-5',
    applicationId: 'app-5',
    businessId: 'biz-5',
    businessName: 'Food Stall Vendor',
    applicationReferenceNumber: 'APP-2024-005',
    status: 'rejected',
    applicationStatus: 'rejected',
    formType: 'general_permit',
    formData: { 
      businessName: 'Food Stall Vendor',
      generalPermitCategory: 'bazaar_festival_vendors',
    },
    createdAt: '2024-01-19T12:00:00Z',
    submittedAt: '2024-01-19T12:00:00Z',
    reviewedBy: 'officer-1',
    reviewedByName: 'Officer Cruz',
  },
]

export default function MockPanelDashboard({ isLoading = false, items = mockApplications, _forceDetailLoading = false, _forceSelectedItem = null }) {
  const [selectedItem, setSelectedItem] = useState(_forceSelectedItem)
  const [detailLoading, setDetailLoading] = useState(_forceDetailLoading)
  
  // When loading, pass empty items to show loading state in ListPanel
  const displayItems = isLoading ? [] : items

  const getItemId = (item) => {
    return item.applicationId || item._id || item.businessId
  }

  const handleSelectItem = (item) => {
    setSelectedItem({ ...item, _itemType: 'applications', _itemId: getItemId(item) })
    setDetailLoading(true)
  }

  const handleDrawerClose = () => {
    setSelectedItem(null)
    setDetailLoading(false)
  }

  // Simulate detail panel loading
  useEffect(() => {
    if (selectedItem && detailLoading && !_forceDetailLoading) {
      const timer = setTimeout(() => setDetailLoading(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [selectedItem, detailLoading, _forceDetailLoading])

  const renderCard = (app, currentSelectedId, onSelect) => {
    const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG[app.applicationStatus] || { color: 'default', label: app.status || app.applicationStatus }
    const permitType = app.formType === 'general_permit' ? (app.formData?.generalPermitCategory || 'General') : 'Regular'
    const submittedDate = app.submittedAt || app.createdAt || app.updatedAt
    const date = submittedDate ? new Date(submittedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null

    const tags = [
      { label: statusConf.label, color: statusConf.color },
    ]
    if (permitType) {
      tags.push({ label: permitType, color: 'default' })
    }
    if (app.applicationReferenceNumber) {
      tags.push({ label: app.applicationReferenceNumber, color: 'default' })
    }

    return (
      <PanelCard
        key={getItemId(app)}
        item={app}
        selected={currentSelectedId === getItemId(app)}
        onClick={() => onSelect(app)}
        title={app.businessName || app.formData?.businessName || 'Unnamed Business'}
        description=''
        metaInfo={[
          ...(date ? [{ label: 'Submitted on', value: date }] : []),
          ...(app.reviewedByName ? [{ label: 'Claimed by', value: app.reviewedByName }] : []),
        ]}
        tags={tags}
        isBookmarked={false}
      />
    )
  }

  const listContent = (
    <ListPanel
      items={displayItems}
      isLoading={isLoading}
      selectedId={selectedItem?._itemId}
      onSelectItem={handleSelectItem}
      renderCard={renderCard}
      filterConfig={[
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'all', label: 'All' },
            { value: 'submitted', label: 'Pending Review' },
            { value: 'under_review', label: 'Under Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'needs_revision', label: 'Needs Revision' },
          ],
        },
      ]}
    />
  )

  const detailContent = selectedItem ? (
    detailLoading ? (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LottieSpinner />
      </div>
    ) : (
      <ApplicationDetailPanel
        application={selectedItem}
        onReviewComplete={() => {}}
        onBookmarkToggle={() => {}}
      />
    )
  ) : null

  return (
    <ResponsiveSplitLayout
      listContent={listContent}
      detailContent={detailContent}
      drawerTitle="Application details"
      onDrawerClose={handleDrawerClose}
      mobileDrawerPlacement="bottom"
    />
  )
}
