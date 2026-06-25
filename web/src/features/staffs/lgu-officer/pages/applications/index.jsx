import { useState, useCallback, useMemo, useEffect } from 'react'
import ApplicationDetailPanel from './components/ApplicationDetailPanel'
import ListPanel from '@/shared/components/ListPanel'
import PanelCard from '@/shared/components/PanelCard'
import ResponsiveSplitLayout from '@/shared/components/ResponsiveSplitLayout'
import useOfficerData from '../../hooks/useOfficerData'
import { useOfficerDataContext } from '../../contexts/OfficerDataContext'
import BookmarkService from '../../infrastructure/services/bookmarkService'
import dayjs from 'dayjs'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resubmit', label: 'Resubmitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'returned', label: 'Returned' },
]

const STATUS_CONFIG = {
  submitted: { color: 'blue', label: 'Pending Review' },
  under_review: { color: 'gold', label: 'Under Review' },
  resubmit: { color: 'cyan', label: 'Resubmitted' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  returned: { color: 'warning', label: 'Returned' },
  draft: { color: 'default', label: 'Draft' },
}

export default function OfficerApplications() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const { refreshTrigger } = useOfficerDataContext()
  const officerData = useOfficerData('applications', refreshTrigger)
  const bookmarkService = useMemo(() => new BookmarkService(), [])

  // Check bookmark status for all applications
  const refreshBookmarkStatus = useCallback(async () => {
    const applications = officerData?.applications || []
    const bookmarkStatus = new Set()
    
    await Promise.all(
      applications.map(async (app) => {
        const appId = app.businessId || app.applicationId || app._id
        try {
          const check = await bookmarkService.checkBookmark('application', appId)
          if (check.isBookmarked) {
            bookmarkStatus.add(appId)
          }
        } catch {
          // Ignore errors, treat as not bookmarked
        }
      })
    )
    
    setBookmarkedIds(bookmarkStatus)
  }, [officerData?.applications, bookmarkService])

  useEffect(() => {
    refreshBookmarkStatus()
  }, [refreshBookmarkStatus])

  const getItemId = useCallback((item) => {
    return item.applicationId || item._id || item.businessId
  }, [])

  const handleSelectApplication = useCallback((app) => {
    setSelectedItem({ ...app, _itemType: 'applications', _itemId: getItemId(app) })
  }, [getItemId])

  const handleDrawerClose = useCallback(() => {
    setSelectedItem(null)
  }, [])

  // Sync selectedItem with refreshed data
  useEffect(() => {
    if (selectedItem && officerData?.applications) {
      const updatedItem = officerData.applications.find(app => getItemId(app) === selectedItem._itemId)
      if (updatedItem) {
        const currentData = { ...selectedItem }
        delete currentData._itemType
        delete currentData._itemId
        const newData = { ...updatedItem }
        if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
          setSelectedItem({ ...updatedItem, _itemType: 'applications', _itemId: getItemId(updatedItem) })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officerData?.applications, selectedItem?._itemId, getItemId])

  const filteredList = useMemo(() => {
    const list = officerData?.applications || []
    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return db - da
    })
  }, [officerData?.applications])

  const handleReviewComplete = useCallback(() => {
    officerData.refreshApplicationTabs?.()
    officerData.refresh?.()
  }, [officerData])

  const handleBookmarkToggle = useCallback(() => {
    refreshBookmarkStatus()
  }, [refreshBookmarkStatus])

  const renderCard = (app, currentSelectedId, onSelect) => {
    const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG[app.applicationStatus] || { color: 'default', label: app.status || app.applicationStatus }
    const permitType = app.formType === 'general_permit' ? (app.formData?.generalPermitCategory || 'General') : 'Regular'
    const submittedDate = app.submittedAt || app.createdAt || app.updatedAt
    const date = submittedDate ? dayjs(submittedDate).format('MMMM D, YYYY') : null
    const appId = app.businessId || app.applicationId || app._id
    const isBookmarked = bookmarkedIds.has(appId)

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
        isBookmarked={isBookmarked}
      />
    )
  }

  const listContent = (
    <ListPanel
      items={filteredList}
      isLoading={officerData?.loadingMap?.applications}
      selectedId={selectedItem?._itemId}
      onSelectItem={handleSelectApplication}
      renderCard={renderCard}
      filterConfig={[
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: STATUS_FILTER_OPTIONS,
        },
      ]}
    />
  )

  const detailContent = selectedItem ? (
    <ApplicationDetailPanel
      application={selectedItem}
      onReviewComplete={handleReviewComplete}
      onBookmarkToggle={handleBookmarkToggle}
    />
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
