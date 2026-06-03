import { useState, useEffect, useMemo, useCallback } from 'react'
import { Table, Input, Select, Button, Tag, Typography, Dropdown, Splitter, Grid, Pagination, theme, Space, Drawer, AutoComplete, Empty, Descriptions, message } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import { SearchOutlined, FilterOutlined, CloseOutlined, FileTextOutlined, ReloadOutlined, PlusOutlined, StarOutlined, StarFilled } from '@ant-design/icons'
import { StaffLayout } from '../../components'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'
import ApplicationDetailPanel from '../components/ApplicationDetailPanel'
import { createWalkInApplication } from '@/features/business-owner/services/businessProfileService'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Text } = Typography

export default function PermitReviewPage() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const { loading, applications, pagination, loadApplications, reviewApplication } = usePermitApplications()
  const { error: notifyError } = useNotifier()
  
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [walkInOpen, setWalkInOpen] = useState(false)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerOptions, setOwnerOptions] = useState([])
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('officer_bookmarks') || '[]') } catch { return [] }
  })
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  const toggleBookmark = useCallback((appId) => {
    setBookmarks(prev => {
      const next = prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
      localStorage.setItem('officer_bookmarks', JSON.stringify(next))
      return next
    })
  }, [])

  const PAGE_SIZE = 20
  const POLL_INTERVAL_MS = 30 * 1000 // 30 seconds

  useEffect(() => {
    loadApplicationsData()
  }, [])

  // Poll for fresh applications list so the table stays up to date (silent = no loading spinner)
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadApplicationsData(true)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (selectedApplication && applications?.length) {
      const updated = applications.find((a) => a.applicationId === selectedApplication.applicationId)
      if (updated) setSelectedApplication(updated)
      else setSelectedApplication(null)
    }
  }, [applications])


  const loadApplicationsData = async (silent = false) => {
    try {
      await loadApplications({
        filters: {},
        pagination: { page: 1, limit: 100 },
        silent
      })
      setLastUpdated(new Date())
    } catch (err) {
      if (!silent) notifyError(err, 'Failed to load applications')
    }
  }

  const handleReviewComplete = async () => {
    await loadApplicationsData()
  }

  const handleReviewStarted = async (updatedApplication) => {
    if (updatedApplication?.applicationId || updatedApplication?.businessId) {
      setSelectedApplication(updatedApplication)
    }
    await loadApplicationsData()
  }

  const activeFilterCount = [statusFilter, typeFilter].filter(Boolean).length

  const filteredApplications = useMemo(() => {
    let list = applications || []
    if (showBookmarkedOnly) {
      list = list.filter((rec) => bookmarks.includes(rec?.applicationId))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((rec) => {
        const businessName = (rec?.businessName || '').toLowerCase()
        const refNumber = (rec?.applicationReferenceNumber || '').toLowerCase()
        return businessName.includes(q) || refNumber.includes(q)
      })
    }
    if (statusFilter) {
      list = list.filter((rec) => rec?.status === statusFilter)
    }
    if (typeFilter) {
      list = list.filter((rec) => rec?.applicationType === typeFilter)
    }
    list.sort((a, b) => {
      const dateA = new Date(a?.updatedAt || a?.submittedAt || 0).getTime()
      const dateB = new Date(b?.updatedAt || b?.submittedAt || 0).getTime()
      return dateB - dateA
    })
    return list
  }, [applications, search, statusFilter, typeFilter, showBookmarkedOnly, bookmarks])

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return (filteredApplications || []).slice(start, start + PAGE_SIZE)
  }, [filteredApplications, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter])

  const clearFilters = () => {
    setStatusFilter(null)
    setTypeFilter(null)
  }

  const handleOwnerSearch = useCallback(async (value) => {
    setOwnerSearch(value)
    if (!value || value.length < 2) { setOwnerOptions([]); return }
    setSearchLoading(true)
    try {
      const users = await get(`/api/auth/users/search?q=${encodeURIComponent(value)}&role=business_owner`)
      const list = Array.isArray(users) ? users : users?.data || []
      setOwnerOptions(list.map(u => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName} (${u.email})`,
        user: u,
      })))
    } catch { setOwnerOptions([]) }
    finally { setSearchLoading(false) }
  }, [])

  const handleOwnerSelect = (_value, option) => {
    setSelectedOwner(option.user)
  }

  const openWalkIn = () => {
    setWalkInOpen(true)
    setSelectedOwner(null)
    setOwnerSearch('')
    setOwnerOptions([])
  }

  const closeWalkIn = () => {
    setWalkInOpen(false)
    setSelectedOwner(null)
    setOwnerSearch('')
  }

  const getStatusTag = (status, hasActiveAppeal) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'submitted': { color: 'processing', text: 'Pending Review' },
      'resubmit': { color: 'gold', text: 'Resubmitted' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Waiting for Applicant' },
      'appeal_pending': { color: 'orange', text: 'Appeal Pending' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns = [
    {
      title: '',
      key: 'bookmark',
      width: 36,
      render: (_, rec) => {
        const isBookmarked = bookmarks.includes(rec?.applicationId)
        return isBookmarked
          ? <StarFilled style={{ color: '#faad14', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggleBookmark(rec.applicationId) }} />
          : <StarOutlined style={{ color: '#d9d9d9', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggleBookmark(rec.applicationId) }} />
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => getStatusTag(status, record?.hasActiveAppeal)
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text || 'N/A'}</Text>
    },
    {
      title: 'Business Type',
      dataIndex: 'businessRegistration',
      key: 'businessType',
      width: 100,
      render: (businessReg) => {
        const businessType = businessReg?.businessType
        return (
          <Tag color={businessType === 'temporary' ? 'orange' : 'green'}>
            {businessType === 'temporary' ? 'Temporary' : 'Regular'}
          </Tag>
        )
      }
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 100,
      render: (_, record) => {
        const displayDate = record.submittedAt || record.updatedAt
        return displayDate ? dayjs(displayDate).format('MMM D') : 'N/A'
      }
    },
  ]

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search business or reference"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Button
            icon={showBookmarkedOnly ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            type={showBookmarkedOnly ? 'primary' : 'default'}
            ghost={showBookmarkedOnly}
            onClick={() => setShowBookmarkedOnly(prev => !prev)}
            aria-label="Toggle bookmarked applications"
          />
          <Dropdown
            open={filterOpen}
            onOpenChange={setFilterOpen}
            trigger={['click']}
            popupRender={() => (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#fff',
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                  minWidth: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13 }}>Filters</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    onClick={() => setFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                  <Select
                    placeholder="All statuses"
                    allowClear
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'submitted', label: 'Pending Review' },
                      { value: 'resubmit', label: 'Resubmitted' },
                      { value: 'under_review', label: 'Under Review' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'appeal_pending', label: 'Appeal Pending' },
                      { value: 'needs_revision', label: 'Waiting for Applicant' },
                      { value: 'draft', label: 'Draft' },
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Type</Text>
                  <Select
                    placeholder="All types"
                    allowClear
                    value={typeFilter}
                    onChange={setTypeFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'new_registration', label: 'New Registration' },
                      { value: 'renewal', label: 'Renewal' },
                    ]}
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          >
            <Button
              icon={<FilterOutlined />}
              type={activeFilterCount > 0 ? 'primary' : 'default'}
              ghost={activeFilterCount > 0}
              aria-label="Toggle filters"
            />
          </Dropdown>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="applicationId"
            columns={columns}
            dataSource={paginatedApplications}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description="No permit applications to review" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            rowClassName={(rec) => rec?.applicationId === selectedApplication?.applicationId ? 'app-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => setSelectedApplication(rec),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredApplications?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.app-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const headerActions = (
    <Space size="middle">
      {lastUpdated != null && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {dayjs(lastUpdated).format('MMM D, h:mm A')}
        </Text>
      )}
      <Button
        icon={<ReloadOutlined />}
        onClick={loadApplicationsData}
        loading={loading}
        aria-label="Refresh"
      />
      <Button type="primary" icon={<PlusOutlined />} onClick={openWalkIn}>
        Walk-In
      </Button>
    </Space>
  )

  const walkInDrawer = (
    <Drawer
      title="Walk-In Application"
      placement="right"
      width={520}
      open={walkInOpen}
      onClose={closeWalkIn}
      destroyOnHidden
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Search Business Owner</Text>
          <AutoComplete
            style={{ width: '100%' }}
            options={ownerOptions}
            onSearch={handleOwnerSearch}
            onSelect={handleOwnerSelect}
            placeholder="Search by name or email (min 2 chars)"
            value={ownerSearch}
            onChange={setOwnerSearch}
            notFoundContent={searchLoading ? 'Searching...' : ownerSearch.length >= 2 ? 'No owners found' : null}
          />
        </div>

        {selectedOwner && (
          <div>
            <Descriptions
              size="small"
              bordered
              column={1}
              style={{ marginBottom: 16 }}
              items={[
                { key: 'name', label: 'Name', children: `${selectedOwner.firstName} ${selectedOwner.lastName}` },
                { key: 'email', label: 'Email', children: selectedOwner.email },
              ]}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              This will create a walk-in application on behalf of this business owner.
              The application will appear in your review queue.
            </Text>
            <Button
              type="primary"
              block
              loading={actionLoading}
              onClick={async () => {
                try {
                  setActionLoading(true)
                  await createWalkInApplication({ ownerId: selectedOwner._id })
                  message.success(`Walk-in application created for ${selectedOwner.firstName} ${selectedOwner.lastName}`)
                  closeWalkIn()
                  await loadApplicationsData()
                } catch (err) {
                  notifyError(err, 'Failed to create walk-in application')
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              Create Walk-In Application
            </Button>
          </div>
        )}

        {!selectedOwner && ownerSearch.length >= 2 && ownerOptions.length === 0 && !searchLoading && (
          <Empty
            description="No business owners found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              The business owner must have a registered account first.
            </Text>
          </Empty>
        )}
      </div>
    </Drawer>
  )

  if (isMobile) {
    return (
      <StaffLayout
        pageTitle="Applications"
        pageIcon={<FileTextOutlined />}
        headerActions={headerActions}
      >
        <div style={{ height: 'calc(100vh - 120px)' }}>
          {tableContent}
        </div>
        {walkInDrawer}
      </StaffLayout>
    )
  }

  return (
    <StaffLayout
      pageTitle="Applications"
      pageIcon={<FileTextOutlined />}
      headerActions={headerActions}
    >
      <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel min="25%" defaultSize="30%" style={{ overflow: 'hidden' }}>
            {tableContent}
          </Splitter.Panel>
          <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden'}}>
              <ApplicationDetailPanel
                application={selectedApplication}
                onReviewComplete={handleReviewComplete}
                onReviewStarted={handleReviewStarted}
                onReview={reviewApplication}
              />
          </Splitter.Panel>
        </Splitter>
      </div>
      {walkInDrawer}
    </StaffLayout>
  )
}
