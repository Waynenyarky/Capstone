import React, { useState, useEffect, useMemo } from 'react'
import { Table, Input, Select, Button, Tag, Typography, Dropdown, Splitter, Grid, Pagination, theme } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import { SearchOutlined, FilterOutlined, CloseOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { StaffLayout } from '../../components'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'
import ApplicationDetailPanel from '../components/ApplicationDetailPanel'
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

  const PAGE_SIZE = 20

  useEffect(() => {
    loadApplicationsData()
  }, [])

  useEffect(() => {
    if (selectedApplication && applications?.length) {
      const updated = applications.find((a) => a.applicationId === selectedApplication.applicationId)
      if (updated) setSelectedApplication(updated)
      else setSelectedApplication(null)
    }
  }, [applications])


  const loadApplicationsData = async () => {
    try {
      await loadApplications({
        filters: {},
        pagination: { page: 1, limit: 100 }
      })
    } catch (error) {
      notifyError(error, 'Failed to load applications')
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
  }, [applications, search, statusFilter, typeFilter])

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

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'submitted': { color: 'processing', text: 'Pending' },
      'resubmit': { color: 'processing', text: 'Resubmit' },
      'under_review': { color: 'processing', text: 'Reviewing' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Revision' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text || 'N/A'}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'applicationType',
      key: 'applicationType',
      width: 80,
      render: (type) => (
        <Tag color={type === 'new_registration' ? 'blue' : 'cyan'}>
          {type === 'new_registration' ? 'New' : 'Renewal'}
        </Tag>
      )
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
          <Dropdown
            open={filterOpen}
            onOpenChange={setFilterOpen}
            trigger={['click']}
            dropdownRender={() => (
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
                      { value: 'resubmit', label: 'Resubmit' },
                      { value: 'under_review', label: 'Under Review' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'needs_revision', label: 'Needs Revision' },
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
    <Button
      icon={<ReloadOutlined />}
      onClick={loadApplicationsData}
      loading={loading}
      aria-label="Refresh"
    />
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
      </StaffLayout>
    )
  }

  return (
    <StaffLayout
      pageTitle="Applications"
      pageIcon={<FileTextOutlined />}
      headerActions={headerActions}
    >
      <div style={{ height: 'calc(100vh - 120px)' }}>
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel min="25%" defaultSize="35%" style={{ overflow: 'hidden' }}>
            {tableContent}
          </Splitter.Panel>
          <Splitter.Panel min="40%" defaultSize="65%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ApplicationDetailPanel
              application={selectedApplication}
              onReviewComplete={handleReviewComplete}
              onReviewStarted={handleReviewStarted}
              onReview={reviewApplication}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
    </StaffLayout>
  )
}
