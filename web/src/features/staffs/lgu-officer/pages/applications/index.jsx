import { useState, useCallback, useMemo, useEffect } from 'react'
import ApplicationDetailPanel from './components/ApplicationDetailPanel'
import ListPanel from '@/shared/components/ListPanel'
import PanelCard from '@/shared/components/PanelCard'
import ResponsiveSplitLayout from '@/shared/components/ResponsiveSplitLayout'
import useOfficerData from '../../hooks/useOfficerData'
import { useOfficerDataContext } from '../../contexts/OfficerDataContext'
import BookmarkService from '../../services/bookmarkService'
import { useApplicationEvents } from '@/shared/hooks/useSocket'
import dayjs from 'dayjs'
import { STATUS_CONFIG, STATUS_FILTER_OPTIONS, CLAIM_STATUS_FILTER_OPTIONS } from './constants'

// Stale detection helpers (copied from useOfficerData for use in renderCard)
const STALE_THRESHOLD_HOURS = 48
const ACTIVE_APPLICATION_STATUSES = new Set(['submitted', 'under_review', 'resubmit'])
const TERMINAL_APPLICATION_STATUSES = new Set(['approved', 'rejected', 'returned', 'cancelled'])

const isStale = (item) => {
  if (!item) return false
  const status = String(item.status || item.applicationStatus || '').toLowerCase()
  if (!item.reviewedBy) return false
  if (ACTIVE_APPLICATION_STATUSES.has(status) || !TERMINAL_APPLICATION_STATUSES.has(status)) {
    const reviewedAt = item.reviewedAt
    if (!reviewedAt) return false
    const hoursSinceReview = (new Date() - new Date(reviewedAt)) / (1000 * 60 * 60)
    return hoursSinceReview > STALE_THRESHOLD_HOURS
  }
  return false
}

const getStaleDuration = (item) => {
  if (!item) return null
  const timestamp = item.reviewedAt
  if (!timestamp) return null
  const hoursSince = (new Date() - new Date(timestamp)) / (1000 * 60 * 60)
  if (hoursSince <= 0) return null
  const days = Math.floor(hoursSince / 24)
  const hours = Math.floor(hoursSince % 24)
  if (days > 0 && hours > 0) {
    return `${days} days ${hours} hours`
  } else if (days > 0) {
    return `${days} days`
  } else {
    return `${hours} hours`
  }
}

export default function OfficerApplications() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [activeFilters, setActiveFilters] = useState({ status: 'all', claimStatus: 'needs_attention' })
  const { refreshTrigger, currentUser } = useOfficerDataContext()
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

    const filtered = list.filter(app => {
      // Status filter
      if (activeFilters.status && activeFilters.status !== 'all') {
        const appStatus = app.status || app.applicationStatus
        if (appStatus !== activeFilters.status) return false
      }

      // Claim status filter
      if (activeFilters.claimStatus && activeFilters.claimStatus !== 'all') {
        const isClaimed = Boolean(app.reviewedBy)
        const reviewerId = app.reviewedBy?._id || app.reviewedBy
        const stale = isStale(app)

        if (activeFilters.claimStatus === 'needs_attention') {
          // Needs Attention: unclaimed OR stale (claimed or unclaimed)
          if (!isClaimed) return true
          if (stale) return true
          return false
        } else if (activeFilters.claimStatus === 'unclaimed') {
          if (isClaimed) return false
        } else if (activeFilters.claimStatus === 'claimed_by_me') {
          if (!isClaimed || String(reviewerId) !== String(currentUser?.id || currentUser?._id)) return false
        } else if (activeFilters.claimStatus === 'claimed_by_others') {
          if (!isClaimed || String(reviewerId) === String(currentUser?.id || currentUser?._id)) return false
        }
      }

      return true
    })

    return filtered.sort((a, b) => {
      // Primary: unclaimed vs claimed
      const aClaimed = Boolean(a.reviewedBy)
      const bClaimed = Boolean(b.reviewedBy)
      if (!aClaimed && bClaimed) return -1
      if (aClaimed && !bClaimed) return 1

      // Secondary: time in status (oldest unclaimed first)
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return da - db
    })
  }, [officerData?.applications, activeFilters, currentUser?.id, currentUser?._id])

  const handleReviewComplete = useCallback(() => {
    officerData.refreshApplicationTabs?.()
    officerData.refresh?.()
  }, [officerData])

  const handleBookmarkToggle = useCallback(() => {
    refreshBookmarkStatus()
  }, [refreshBookmarkStatus])

  // WebSocket listener for application claim events
  useApplicationEvents({
    onApplicationClaimed: () => {
      // Refresh list to show updated claim status
      officerData.refresh?.()
    },
  })

  const renderCard = (app, currentSelectedId, onSelect) => {
    const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG[app.applicationStatus] || { color: 'default', label: app.status || app.applicationStatus }
    const permitType = app.formType === 'general_permit' ? (app.formData?.generalPermitCategory || 'General') : 'Regular'
    const submittedDate = app.submittedAt || app.createdAt || app.updatedAt
    const date = submittedDate ? dayjs(submittedDate).format('MMMM D, YYYY') : null
    const appId = app.businessId || app.applicationId || app._id
    const isBookmarked = bookmarkedIds.has(appId)
    const stale = isStale(app)
    const staleDuration = getStaleDuration(app)

    const tags = [
      { label: statusConf.label, color: statusConf.color },
    ]
    if (stale && staleDuration) {
      tags.push({ label: `Stale for ${staleDuration}`, color: 'warning' })
    }
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
        title={app.businessName || app.formData?.businessName || app.formData?.registeredBusinessName || app.formData?.activityName || app.formData?.['Business / trade name'] || app.formData?.businessTradeName || 'Unnamed Business'}
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
          value: activeFilters.status === 'all' ? null : activeFilters.status,
        },
        {
          key: 'claimStatus',
          label: 'Claim Status',
          type: 'select',
          options: CLAIM_STATUS_FILTER_OPTIONS,
          value: activeFilters.claimStatus === 'all' ? null : activeFilters.claimStatus,
        },
      ]}
      onFilterChange={(key, value) => setActiveFilters(prev => ({ ...prev, [key]: value === null ? 'all' : value }))}
      onClearFilters={() => setActiveFilters({ status: 'all', claimStatus: 'all' })}
      onRefresh={officerData.refresh}
      showRefresh={true}
      customFilter={true}
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
