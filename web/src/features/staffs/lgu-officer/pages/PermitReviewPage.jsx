import React, { useState, useEffect, useMemo } from 'react'
import { Table, Card, Input, Select, DatePicker, Button, Space, Tag, Typography, Row, Col, message, Badge } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons'
import { StaffLayout } from '../../views/components'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'
import PermitApplicationDetail from '../components/PermitApplicationDetail'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

export default function PermitReviewPage() {
  const { loading, applications, pagination, loadApplications, reviewApplication } = usePermitApplications()
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [filters, setFilters] = useState({
    status: undefined,
    businessName: '',
    applicationType: undefined,
    dateRange: null
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    loadApplicationsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, filters])

  const loadApplicationsData = async () => {
    try {
      const filterParams = {
        ...(filters.status && { status: filters.status }),
        ...(filters.businessName && { businessName: filters.businessName }),
        ...(filters.applicationType && { applicationType: filters.applicationType }),
        ...(filters.dateRange && filters.dateRange[0] && { dateFrom: filters.dateRange[0].format('YYYY-MM-DD') }),
        ...(filters.dateRange && filters.dateRange[1] && { dateTo: filters.dateRange[1].format('YYYY-MM-DD') })
      }

      await loadApplications({
        filters: filterParams,
        pagination: {
          page: currentPage,
          limit: pageSize
        }
      })
    } catch (error) {
      console.error('Failed to load applications:', error)
    }
  }

  const handleViewDetails = (application) => {
    setSelectedApplication(application)
    setDetailModalVisible(true)
  }

  const handleReviewComplete = async () => {
    setDetailModalVisible(false)
    setSelectedApplication(null)
    await loadApplicationsData()
    message.success('Application reviewed successfully')
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({
      status: undefined,
      businessName: '',
      applicationType: undefined,
      dateRange: null
    })
    setCurrentPage(1)
  }

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'submitted': { color: 'processing', text: 'Pending Review' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Needs Revision' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getAIValidationBadge = (aiValidation) => {
    if (!aiValidation || !aiValidation.completed) {
      return <Badge status="default" text="Not Validated" />
    }

    const status = aiValidation.results?.overallStatus || 'pass'
    const statusConfig = {
      'pass': { status: 'success', text: 'Pass' },
      'warning': { status: 'warning', text: 'Warning' },
      'fail': { status: 'error', text: 'Fail' }
    }
    const config = statusConfig[status] || statusConfig.pass
    return <Badge status={config.status} text={config.text} />
  }

  const columns = [
    {
      title: 'Application Reference',
      dataIndex: 'applicationReferenceNumber',
      key: 'applicationReferenceNumber',
      width: 180,
      render: (text) => <Text strong style={{ fontFamily: 'monospace' }}>{text || 'N/A'}</Text>
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      width: 200,
      render: (text) => <Text>{text || 'N/A'}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'applicationType',
      key: 'applicationType',
      width: 120,
      render: (type) => (
        <Tag color={type === 'new_registration' ? 'blue' : 'cyan'}>
          {type === 'new_registration' ? 'New Registration' : 'Renewal'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'AI Validation',
      dataIndex: 'aiValidation',
      key: 'aiValidation',
      width: 120,
      render: (aiValidation) => getAIValidationBadge(aiValidation)
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (_, record) => {
        const displayDate = record.submittedAt || record.updatedAt
        return displayDate ? dayjs(displayDate).format('YYYY-MM-DD HH:mm') : 'N/A'
      },
      sorter: (a, b) => {
        const dateA = a.submittedAt || a.updatedAt
        const dateB = b.submittedAt || b.updatedAt
        if (!dateA) return 1
        if (!dateB) return -1
        return new Date(dateA) - new Date(dateB)
      },
      defaultSortOrder: 'descend'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            Review
          </Button>
        </Space>
      )
    }
  ]

  const hasActiveFilters = filters.status || filters.businessName || filters.applicationType || filters.dateRange

  const sortedApplications = useMemo(() => {
    const items = Array.isArray(applications) ? [...applications] : []
    items.sort((a, b) => {
      const dateA = new Date(a?.updatedAt || a?.submittedAt || 0).getTime()
      const dateB = new Date(b?.updatedAt || b?.submittedAt || 0).getTime()
      return dateB - dateA
    })
    return items
  }, [applications])

  return (
    <StaffLayout
      title="Permit Applications Review"
      description="Review and process permit applications from business owners"
      roleLabel="LGU Officer"
      fullWidth={true}
    >
      <Card style={{ width: '100%' }}>
        {/* Filters Section */}
        <Card
          type="inner"
          title={
            <Space>
              <FilterOutlined />
              <Text strong>Filters</Text>
            </Space>
          }
          style={{ marginBottom: 24, width: '100%' }}
          extra={
            hasActiveFilters && (
              <Button
                type="link"
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            )
          }
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Status</Text>
              <Select
                placeholder="All Statuses"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
              >
                <Option value="submitted">Pending Review</Option>
                <Option value="under_review">Under Review</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="needs_revision">Needs Revision</Option>
                <Option value="draft">Draft</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Application Type</Text>
              <Select
                placeholder="All Types"
                style={{ width: '100%' }}
                value={filters.applicationType}
                onChange={(value) => handleFilterChange('applicationType', value)}
                allowClear
              >
                <Option value="new_registration">New Registration</Option>
                <Option value="renewal">Renewal</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Business Name</Text>
              <Input
                placeholder="Search business name"
                prefix={<SearchOutlined />}
                value={filters.businessName}
                onChange={(e) => handleFilterChange('businessName', e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Date Range</Text>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                format="YYYY-MM-DD"
              />
            </Col>
          </Row>
        </Card>

        {/* Applications Table */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Applications ({pagination?.total || 0})
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadApplicationsData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={sortedApplications}
          loading={loading}
          rowKey="applicationId"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} applications`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(1)
              setPageSize(size)
            }
          }}
          scroll={{ x: 'max-content' }}
          style={{ width: '100%' }}
        />
      </Card>

      {/* Detail Modal */}
      {selectedApplication && (
        <PermitApplicationDetail
          visible={detailModalVisible}
          application={selectedApplication}
          onClose={() => {
            setDetailModalVisible(false)
            setSelectedApplication(null)
          }}
          onReviewComplete={handleReviewComplete}
          onReview={reviewApplication}
        />
      )}
    </StaffLayout>
  )
}
