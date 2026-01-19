import React, { useState, useMemo } from 'react'
import { Table, Button, Tag, Space, Typography, Card, theme, Tabs, Input, Select, DatePicker, Row, Col, Checkbox, Modal, Descriptions, Form, message, Spin, Alert } from 'antd'
import { useNavigate } from 'react-router-dom'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons'
import { usePermitApplications } from '../hooks/usePermitApplications'
import { getBusinessProfile, setPrimaryBusiness, updateBusiness } from '@/features/business-owner/services/businessProfileService'
import { getApplicationStatus } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'
import { getRenewalStatus, updateGrossReceipts } from '@/features/business-owner/features/business-renewal/services/businessRenewalService'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

export default function PermitApplicationPage() {
  const navigate = useNavigate()
  const { 
    permits,
    renewals, 
    loading, 
    refresh 
  } = usePermitApplications()
  
  const { token } = theme.useToken()

  // Filter states for Business Registration tab
  const [registrationFilters, setRegistrationFilters] = useState({
    businessName: '',
    businessId: '',
    referenceNumber: '',
    dateRange: null,
    isPrimary: null
  })

  // Filter states for Business Renewal tab
  const [renewalFilters, setRenewalFilters] = useState({
    businessName: '',
    businessId: '',
    referenceNumber: '',
    renewalYear: null,
    renewalStatus: null,
    paymentStatus: null,
    dateRange: null
  })

  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalType, setModalType] = useState(null) // 'registration' or 'renewal'
  const [modalData, setModalData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [editForm] = Form.useForm()

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft', description: 'Application not yet started' },
      'requirements_viewed': { color: 'processing', text: 'Requirements Viewed', description: 'Reviewing requirements' },
      'form_completed': { color: 'processing', text: 'Form Completed', description: 'Application form filled' },
      'documents_uploaded': { color: 'processing', text: 'Documents Uploaded', description: 'Documents submitted' },
      'bir_registered': { color: 'processing', text: 'BIR Registered', description: 'BIR registration completed' },
      'agencies_registered': { color: 'processing', text: 'Agencies Registered', description: 'Agency registrations completed' },
      'submitted': { color: 'processing', text: 'Pending for Approval', description: 'Submitted to LGU Officer' },
      'under_review': { color: 'processing', text: 'Pending for Approval', description: 'Under LGU review' },
      'approved': { color: 'success', text: 'Approved', description: 'Permit approved' },
      'rejected': { color: 'error', text: 'Rejected', description: 'Application rejected' },
      'needs_revision': { color: 'warning', text: 'Needs Revision', description: 'Requires corrections' }
    }
    const config = statusConfig[status] || { color: 'default', text: status, description: '' }
    return (
      <Tag color={config.color} title={config.description}>
        {config.text}
      </Tag>
    )
  }

  const getRenewalStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft', description: 'Renewal not yet submitted' },
      'submitted': { color: 'processing', text: 'Pending for Approval', description: 'Submitted to LGU Officer' },
      'under_review': { color: 'processing', text: 'Pending for Approval', description: 'Under LGU review' },
      'approved': { color: 'success', text: 'Approved', description: 'Renewal approved' },
      'rejected': { color: 'error', text: 'Rejected', description: 'Renewal rejected' }
    }
    const config = statusConfig[status] || { color: 'default', text: status, description: '' }
    return (
      <Tag color={config.color} title={config.description}>
        {config.text}
      </Tag>
    )
  }

  const getPaymentStatusTag = (status) => {
    const statusConfig = {
      'pending': { color: 'warning', text: 'Payment Pending', description: 'Payment not yet completed' },
      'paid': { color: 'success', text: 'Paid', description: 'Payment completed' },
      'failed': { color: 'error', text: 'Payment Failed', description: 'Payment processing failed' }
    }
    const config = statusConfig[status] || { color: 'default', text: status, description: '' }
    return (
      <Tag color={config.color} title={config.description}>
        {config.text}
      </Tag>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const columns = [
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (ref) => (
        <Text copyable={ref !== 'N/A'} strong={ref !== 'N/A'} style={{ color: ref !== 'N/A' ? token.colorPrimary : undefined }}>
          {ref}
        </Text>
      ),
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          {record.isPrimary && <Tag color="blue">Primary</Tag>}
        </Space>
      ),
    },
    {
      title: 'Business ID',
      dataIndex: 'businessId',
      key: 'businessId',
      render: (id) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{id}</Text>,
    },
    {
      title: 'Registration Date',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: formatDate,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
      filters: [
        { text: 'Pending for Approval', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Needs Revision', value: 'needs_revision' },
        { text: 'Draft', value: 'draft' },
        { text: 'In Progress', value: 'in_progress' },
      ],
      onFilter: (value, record) => {
        // Group submitted and under_review as "Pending for Approval"
        if (value === 'pending') {
          return record.status === 'submitted' || record.status === 'under_review'
        }
        // Group requirements_viewed, form_completed, documents_uploaded, bir_registered, agencies_registered as "In Progress"
        if (value === 'in_progress') {
          return ['requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered', 'agencies_registered'].includes(record.status)
        }
        return record.status === value
      },
      sorter: (a, b) => {
        const statusOrder = {
          'draft': 0,
          'requirements_viewed': 1,
          'form_completed': 2,
          'documents_uploaded': 3,
          'bir_registered': 4,
          'agencies_registered': 5,
          'submitted': 6,
          'under_review': 6,
          'needs_revision': 7,
          'approved': 8,
          'rejected': 9
        }
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
      },
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record, 'registration')}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'registration')}
            disabled={!canEdit(record, 'registration')}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  const renewalColumns = [
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (ref) => (
        <Text copyable={ref !== 'N/A'} strong={ref !== 'N/A'} style={{ color: ref !== 'N/A' ? token.colorPrimary : undefined }}>
          {ref}
        </Text>
      ),
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          {record.isPrimary && <Tag color="blue">Primary</Tag>}
        </Space>
      ),
    },
    {
      title: 'Business ID',
      dataIndex: 'businessId',
      key: 'businessId',
      render: (id) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{id}</Text>,
    },
    {
      title: 'Renewal Year',
      dataIndex: 'renewalYear',
      key: 'renewalYear',
      render: (year) => <Text>{year}</Text>,
      sorter: (a, b) => (a.renewalYear || 0) - (b.renewalYear || 0),
    },
    {
      title: 'Renewal Status',
      dataIndex: 'renewalStatus',
      key: 'renewalStatus',
      render: getRenewalStatusTag,
      filters: [
        { text: 'Pending for Approval', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Draft', value: 'draft' },
      ],
      onFilter: (value, record) => {
        // Group submitted and under_review as "Pending for Approval"
        if (value === 'pending') {
          return record.renewalStatus === 'submitted' || record.renewalStatus === 'under_review'
        }
        return record.renewalStatus === value
      },
      sorter: (a, b) => {
        const statusOrder = {
          'draft': 0,
          'submitted': 1,
          'under_review': 1,
          'approved': 2,
          'rejected': 3
        }
        return (statusOrder[a.renewalStatus] || 99) - (statusOrder[b.renewalStatus] || 99)
      },
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: getPaymentStatusTag,
      filters: [
        { text: 'Paid', value: 'paid' },
        { text: 'Payment Pending', value: 'pending' },
        { text: 'Payment Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.paymentStatus === value,
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: formatDate,
      sorter: (a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        return dateA - dateB
      },
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record, 'renewal')}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'renewal')}
            disabled={!canEdit(record, 'renewal')}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  // Filter logic for Business Registration
  const filteredPermits = useMemo(() => {
    return permits.filter(permit => {
      // Business Name filter
      if (registrationFilters.businessName && 
          !permit.businessName?.toLowerCase().includes(registrationFilters.businessName.toLowerCase())) {
        return false
      }
      
      // Business ID filter
      if (registrationFilters.businessId && 
          !permit.businessId?.toLowerCase().includes(registrationFilters.businessId.toLowerCase())) {
        return false
      }
      
      // Reference Number filter
      if (registrationFilters.referenceNumber && 
          !permit.referenceNumber?.toLowerCase().includes(registrationFilters.referenceNumber.toLowerCase())) {
        return false
      }
      
      // Date Range filter
      if (registrationFilters.dateRange && registrationFilters.dateRange[0] && registrationFilters.dateRange[1]) {
        const permitDate = permit.registrationDate ? new Date(permit.registrationDate) : null
        if (!permitDate) return false
        
        const startDate = registrationFilters.dateRange[0].startOf('day').toDate()
        const endDate = registrationFilters.dateRange[1].endOf('day').toDate()
        
        if (permitDate < startDate || permitDate > endDate) {
          return false
        }
      }
      
      // Primary Business filter
      if (registrationFilters.isPrimary !== null && permit.isPrimary !== registrationFilters.isPrimary) {
        return false
      }
      
      return true
    })
  }, [permits, registrationFilters])

  // Filter logic for Business Renewal
  const filteredRenewals = useMemo(() => {
    return renewals.filter(renewal => {
      // Business Name filter
      if (renewalFilters.businessName && 
          !renewal.businessName?.toLowerCase().includes(renewalFilters.businessName.toLowerCase())) {
        return false
      }
      
      // Business ID filter
      if (renewalFilters.businessId && 
          !renewal.businessId?.toLowerCase().includes(renewalFilters.businessId.toLowerCase())) {
        return false
      }
      
      // Reference Number filter
      if (renewalFilters.referenceNumber && 
          !renewal.referenceNumber?.toLowerCase().includes(renewalFilters.referenceNumber.toLowerCase())) {
        return false
      }
      
      // Renewal Year filter
      if (renewalFilters.renewalYear && renewal.renewalYear !== renewalFilters.renewalYear) {
        return false
      }
      
      // Renewal Status filter
      if (renewalFilters.renewalStatus) {
        if (renewalFilters.renewalStatus === 'pending') {
          if (renewal.renewalStatus !== 'submitted' && renewal.renewalStatus !== 'under_review') {
            return false
          }
        } else if (renewal.renewalStatus !== renewalFilters.renewalStatus) {
          return false
        }
      }
      
      // Payment Status filter
      if (renewalFilters.paymentStatus && renewal.paymentStatus !== renewalFilters.paymentStatus) {
        return false
      }
      
      // Submitted Date Range filter
      if (renewalFilters.dateRange && renewalFilters.dateRange[0] && renewalFilters.dateRange[1]) {
        const submittedDate = renewal.submittedAt ? new Date(renewal.submittedAt) : null
        if (!submittedDate) return false
        
        const startDate = renewalFilters.dateRange[0].startOf('day').toDate()
        const endDate = renewalFilters.dateRange[1].endOf('day').toDate()
        
        if (submittedDate < startDate || submittedDate > endDate) {
          return false
        }
      }
      
      return true
    })
  }, [renewals, renewalFilters])

  // Get unique renewal years for filter dropdown
  const renewalYears = useMemo(() => {
    const years = new Set()
    renewals.forEach(renewal => {
      if (renewal.renewalYear) {
        years.add(renewal.renewalYear)
      }
    })
    return Array.from(years).sort((a, b) => b - a) // Sort descending
  }, [renewals])

  // Clear filters functions
  const clearRegistrationFilters = () => {
    setRegistrationFilters({
      businessName: '',
      businessId: '',
      referenceNumber: '',
      dateRange: null,
      isPrimary: null
    })
  }

  const clearRenewalFilters = () => {
    setRenewalFilters({
      businessName: '',
      businessId: '',
      referenceNumber: '',
      renewalYear: null,
      renewalStatus: null,
      paymentStatus: null,
      dateRange: null
    })
  }

  // Check if any registration filters are active
  const hasActiveRegistrationFilters = Object.values(registrationFilters).some(value => 
    value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  )

  // Check if any renewal filters are active
  const hasActiveRenewalFilters = Object.values(renewalFilters).some(value => 
    value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  )

  // Handle View button click
  const handleView = async (record, type) => {
    setSelectedRecord(record)
    setModalType(type)
    setModalLoading(true)
    setViewModalVisible(true)
    
    try {
      if (type === 'registration') {
        const statusData = await getApplicationStatus(record.businessId)
        const profile = await getBusinessProfile()
        const business = profile?.businesses?.find(b => b.businessId === record.businessId)
        setModalData({
          ...record,
          ...statusData,
          businessDetails: business
        })
      } else if (type === 'renewal') {
        // Try to get renewal status, fallback to record data if renewalId is invalid
        try {
          const statusData = await getRenewalStatus(record.businessId, record.renewalId)
          setModalData({
            ...record,
            ...statusData
          })
        } catch (error) {
          // If renewal not found, use record data and show warning
          setModalData(record)
          if (error?.message?.includes('not found')) {
            message.warning('Renewal details may be incomplete. Using available data.')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to load details')
      setModalData(record) // Fallback to record data
    } finally {
      setModalLoading(false)
    }
  }

  // Handle Edit button click
  const handleEdit = async (record, type) => {
    setSelectedRecord(record)
    setModalType(type)
    setModalLoading(true)
    setEditModalVisible(true)
    
    try {
      if (type === 'registration') {
        const statusData = await getApplicationStatus(record.businessId)
        const profile = await getBusinessProfile()
        const business = profile?.businesses?.find(b => b.businessId === record.businessId)
        const formData = {
          ...record,
          ...statusData,
          businessDetails: business
        }
        setModalData(formData)
        editForm.setFieldsValue({
          businessName: business?.businessName || record.businessName,
          isPrimary: business?.isPrimary || record.isPrimary
        })
      } else if (type === 'renewal') {
        // Try to get renewal status
        try {
          const statusData = await getRenewalStatus(record.businessId, record.renewalId)
          const formData = {
            ...record,
            ...statusData
          }
          setModalData(formData)
          
          // Get gross receipts from profile if not in statusData
          if (!statusData?.grossReceipts?.amount && !statusData?.grossReceipts?.cy2025) {
            const profile = await getBusinessProfile()
            const business = profile?.businesses?.find(b => b.businessId === record.businessId)
            const renewal = business?.renewals?.find(r => r.renewalId === record.renewalId)
            const grossReceiptsAmount = renewal?.grossReceipts?.amount || renewal?.grossReceipts?.cy2025 || 0
            editForm.setFieldsValue({
              grossReceipts: grossReceiptsAmount
            })
          } else {
            editForm.setFieldsValue({
              grossReceipts: statusData.grossReceipts?.amount || statusData.grossReceipts?.cy2025 || 0
            })
          }
        } catch (error) {
          // Try to get gross receipts from profile as fallback
          try {
            const profile = await getBusinessProfile()
            const business = profile?.businesses?.find(b => b.businessId === record.businessId)
            const renewal = business?.renewals?.find(r => r.renewalId === record.renewalId)
            const grossReceiptsAmount = renewal?.grossReceipts?.amount || renewal?.grossReceipts?.cy2025 || 0
            setModalData(record)
            editForm.setFieldsValue({
              grossReceipts: grossReceiptsAmount
            })
          } catch (profileError) {
            setModalData(record)
            editForm.setFieldsValue({
              grossReceipts: 0
            })
          }
          
          if (error?.message?.includes('not found')) {
            message.warning('Renewal details may be incomplete. Using available data.')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Failed to load details')
      setModalData(record)
    } finally {
      setModalLoading(false)
    }
  }

  // Handle Edit form submit
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setModalLoading(true)
      
      if (modalType === 'registration') {
        // Update primary business status if changed
        if (values.isPrimary !== modalData.isPrimary && values.isPrimary) {
          await setPrimaryBusiness(selectedRecord.businessId)
          message.success('Business set as primary successfully')
        }
        // Can add more update logic here for other fields if needed
      } else if (modalType === 'renewal') {
        // Update gross receipts
        if (values.grossReceipts !== undefined && values.grossReceipts !== null) {
          const currentYear = new Date().getFullYear()
          const renewalYear = modalData.renewalYear || currentYear
          const calendarYear = renewalYear - 1 // BPLO standard: calendar year is renewal year - 1
          
          const grossReceiptsData = {
            amount: Number(values.grossReceipts),
            calendarYear: calendarYear,
            excludesVat: true,
            excludesReturns: true,
            excludesUncollected: true,
            branchAllocations: []
          }
          
          await updateGrossReceipts(selectedRecord.businessId, selectedRecord.renewalId, grossReceiptsData)
          message.success('Gross receipts updated successfully')
        }
      }
      
      setEditModalVisible(false)
      editForm.resetFields()
      refresh() // Refresh the data
    } catch (error) {
      console.error('Failed to save changes:', error)
      if (!error.errorFields) {
        message.error(error?.message || 'Failed to save changes')
      }
    } finally {
      setModalLoading(false)
    }
  }

  // Check if editing is allowed
  const canEdit = (record, type) => {
    if (type === 'registration') {
      const editableStatuses = ['draft', 'needs_revision']
      return editableStatuses.includes(record.status)
    } else if (type === 'renewal') {
      const editableStatuses = ['draft']
      return editableStatuses.includes(record.renewalStatus)
    }
    return false
  }

  return (
    <BusinessOwnerLayout pageTitle="Permit Applications">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <Title level={2} style={{ color: token.colorPrimary }}>Permit Applications</Title>
              <Paragraph type="secondary">Manage your business registrations and track their status.</Paragraph>
            </div>
            <Space>
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => navigate('/owner/business-registration')}
              >
                New Application
              </Button>
              <Button 
                type="primary"
                icon={<ReloadOutlined />} 
                onClick={() => navigate('/owner/business-renewal')}
                style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}
              >
                Business Renewal
              </Button>
            </Space>
          </div>

          <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Tabs
              defaultActiveKey="registrations"
              items={[
                {
                  key: 'registrations',
                  label: 'Business Registration',
                  children: (
                    <div>
                      {/* Filter Section */}
                      <Card 
                        size="small" 
                        style={{ marginBottom: 16, background: '#fafafa' }}
                        title={
                          <Space>
                            <FilterOutlined />
                            <Text strong>Filters</Text>
                            {hasActiveRegistrationFilters && (
                              <Button 
                                type="link" 
                                size="small" 
                                icon={<ClearOutlined />}
                                onClick={clearRegistrationFilters}
                              >
                                Clear All
                              </Button>
                            )}
                          </Space>
                        }
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="Search Business Name"
                              prefix={<SearchOutlined />}
                              value={registrationFilters.businessName}
                              onChange={(e) => setRegistrationFilters({...registrationFilters, businessName: e.target.value})}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="Search Business ID"
                              prefix={<SearchOutlined />}
                              value={registrationFilters.businessId}
                              onChange={(e) => setRegistrationFilters({...registrationFilters, businessId: e.target.value})}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="Search Reference Number"
                              prefix={<SearchOutlined />}
                              value={registrationFilters.referenceNumber}
                              onChange={(e) => setRegistrationFilters({...registrationFilters, referenceNumber: e.target.value})}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <RangePicker
                              style={{ width: '100%' }}
                              placeholder={['Start Date', 'End Date']}
                              value={registrationFilters.dateRange}
                              onChange={(dates) => setRegistrationFilters({...registrationFilters, dateRange: dates})}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Select
                              style={{ width: '100%' }}
                              placeholder="Primary Business"
                              allowClear
                              value={registrationFilters.isPrimary}
                              onChange={(value) => setRegistrationFilters({...registrationFilters, isPrimary: value})}
                            >
                              <Option value={true}>Primary Only</Option>
                              <Option value={false}>Non-Primary Only</Option>
                            </Select>
                          </Col>
                        </Row>
                      </Card>
                      
                      <Table 
                        columns={columns} 
                        dataSource={filteredPermits} 
                        rowKey="businessId" 
                        loading={loading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => `Total ${total} business registrations`
                        }}
                      />
                    </div>
                  )
                },
                {
                  key: 'renewals',
                  label: 'Business Renewal',
                  children: (
                    <div>
                      {/* Filter Section */}
                      <Card 
                        size="small" 
                        style={{ marginBottom: 16, background: '#fafafa' }}
                        title={
                          <Space>
                            <FilterOutlined />
                            <Text strong>Filters</Text>
                            {hasActiveRenewalFilters && (
                              <Button 
                                type="link" 
                                size="small" 
                                icon={<ClearOutlined />}
                                onClick={clearRenewalFilters}
                              >
                                Clear All
                              </Button>
                            )}
                          </Space>
                        }
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="Search Business Name"
                              prefix={<SearchOutlined />}
                              value={renewalFilters.businessName}
                              onChange={(e) => setRenewalFilters({...renewalFilters, businessName: e.target.value})}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="Search Business ID"
                              prefix={<SearchOutlined />}
                              value={renewalFilters.businessId}
                              onChange={(e) => setRenewalFilters({...renewalFilters, businessId: e.target.value})}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="Search Reference Number"
                              prefix={<SearchOutlined />}
                              value={renewalFilters.referenceNumber}
                              onChange={(e) => setRenewalFilters({...renewalFilters, referenceNumber: e.target.value})}
                              allowClear
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Select
                              style={{ width: '100%' }}
                              placeholder="Renewal Year"
                              allowClear
                              value={renewalFilters.renewalYear}
                              onChange={(value) => setRenewalFilters({...renewalFilters, renewalYear: value})}
                            >
                              {renewalYears.map(year => (
                                <Option key={year} value={year}>{year}</Option>
                              ))}
                            </Select>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Select
                              style={{ width: '100%' }}
                              placeholder="Renewal Status"
                              allowClear
                              value={renewalFilters.renewalStatus}
                              onChange={(value) => setRenewalFilters({...renewalFilters, renewalStatus: value})}
                            >
                              <Option value="draft">Draft</Option>
                              <Option value="pending">Pending for Approval</Option>
                              <Option value="approved">Approved</Option>
                              <Option value="rejected">Rejected</Option>
                            </Select>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Select
                              style={{ width: '100%' }}
                              placeholder="Payment Status"
                              allowClear
                              value={renewalFilters.paymentStatus}
                              onChange={(value) => setRenewalFilters({...renewalFilters, paymentStatus: value})}
                            >
                              <Option value="paid">Paid</Option>
                              <Option value="pending">Payment Pending</Option>
                              <Option value="failed">Payment Failed</Option>
                            </Select>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <RangePicker
                              style={{ width: '100%' }}
                              placeholder={['Start Date', 'End Date']}
                              value={renewalFilters.dateRange}
                              onChange={(dates) => setRenewalFilters({...renewalFilters, dateRange: dates})}
                            />
                          </Col>
                        </Row>
                      </Card>
                      
                      <Table 
                        columns={renewalColumns} 
                        dataSource={filteredRenewals} 
                        rowKey="businessId" 
                        loading={loading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => `Total ${total} renewal applications`
                        }}
                        locale={{
                          emptyText: 'No renewal applications found'
                        }}
                      />
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </div>

        {/* View Modal */}
        <Modal
          title={modalType === 'registration' ? 'Business Registration Details' : 'Business Renewal Details'}
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false)
            setModalData(null)
          }}
          footer={[
            <Button key="close" onClick={() => {
              setViewModalVisible(false)
              setModalData(null)
            }}>
              Close
            </Button>
          ]}
          width={800}
        >
          {modalLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : modalData ? (
            <Descriptions column={1} bordered>
              {modalType === 'registration' ? (
                <>
                  <Descriptions.Item label="Business Name">
                    <Text strong>{modalData.businessName}</Text>
                    {modalData.isPrimary && <Tag color="blue" style={{ marginLeft: 8 }}>Primary</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business ID">
                    <Text copyable style={{ fontFamily: 'monospace' }}>{modalData.businessId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Reference Number">
                    {modalData.referenceNumber && modalData.referenceNumber !== 'N/A' ? (
                      <Text copyable strong style={{ color: token.colorPrimary }}>
                        {modalData.referenceNumber}
                      </Text>
                    ) : (
                      <Text type="secondary">N/A</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Date">
                    {formatDate(modalData.registrationDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {getStatusTag(modalData.status)}
                  </Descriptions.Item>
                  {modalData.businessDetails && (
                    <>
                      <Descriptions.Item label="Business Type">
                        {modalData.businessDetails.businessType || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Registration Status">
                        {modalData.businessDetails.registrationStatus || 'N/A'}
                      </Descriptions.Item>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Descriptions.Item label="Business Name">
                    <Text strong>{modalData.businessName}</Text>
                    {modalData.isPrimary && <Tag color="blue" style={{ marginLeft: 8 }}>Primary</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business ID">
                    <Text copyable style={{ fontFamily: 'monospace' }}>{modalData.businessId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Renewal ID">
                    <Text copyable style={{ fontFamily: 'monospace' }}>{modalData.renewalId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Reference Number">
                    {modalData.referenceNumber && modalData.referenceNumber !== 'N/A' ? (
                      <Text copyable strong style={{ color: token.colorPrimary }}>
                        {modalData.referenceNumber}
                      </Text>
                    ) : (
                      <Text type="secondary">N/A</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Renewal Year">
                    {modalData.renewalYear || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Renewal Status">
                    {getRenewalStatusTag(modalData.renewalStatus)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Status">
                    {getPaymentStatusTag(modalData.paymentStatus)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Submitted Date">
                    {formatDate(modalData.submittedAt)}
                  </Descriptions.Item>
                  {modalData.grossReceiptsDeclared && (
                    <Descriptions.Item label="Gross Receipts Declared">
                      <Text>Yes</Text>
                    </Descriptions.Item>
                  )}
                  {modalData.assessment && (
                    <Descriptions.Item label="Assessment Total">
                      <Text strong>₱{modalData.assessment.total?.toLocaleString() || '0'}</Text>
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          ) : (
            <Alert message="No data available" type="warning" />
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={modalType === 'registration' ? 'Edit Business Registration' : 'Edit Business Renewal'}
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false)
            setModalData(null)
            editForm.resetFields()
          }}
          onOk={handleEditSubmit}
          confirmLoading={modalLoading}
          width={600}
        >
          {modalLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : modalData ? (
            <>
              {!canEdit(selectedRecord, modalType) && (
                <Alert
                  message="Editing Not Allowed"
                  description={
                    modalType === 'registration'
                      ? 'This application cannot be edited because it has been submitted or approved. Only draft applications can be edited.'
                      : 'This renewal cannot be edited because it has been submitted or approved. Only draft renewals can be edited.'
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Form
                form={editForm}
                layout="vertical"
                disabled={!canEdit(selectedRecord, modalType)}
              >
                {modalType === 'registration' ? (
                  <>
                    <Form.Item label="Business Name" name="businessName">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item label="Business ID">
                      <Input value={modalData.businessId} disabled />
                    </Form.Item>
                    <Form.Item label="Reference Number">
                      <Input value={modalData.referenceNumber || 'N/A'} disabled />
                    </Form.Item>
                    <Form.Item label="Status">
                      {getStatusTag(modalData.status)}
                    </Form.Item>
                    <Form.Item label="Primary Business" name="isPrimary" valuePropName="checked">
                      <Checkbox>Mark as Primary Business</Checkbox>
                    </Form.Item>
                  </>
                ) : (
                  <>
                    <Form.Item label="Business Name">
                      <Input value={modalData.businessName} disabled />
                    </Form.Item>
                    <Form.Item label="Business ID">
                      <Input value={modalData.businessId} disabled />
                    </Form.Item>
                    <Form.Item label="Renewal ID">
                      <Input value={modalData.renewalId} disabled />
                    </Form.Item>
                    <Form.Item label="Reference Number">
                      <Input value={modalData.referenceNumber || 'N/A'} disabled />
                    </Form.Item>
                    <Form.Item label="Renewal Year">
                      <Input value={modalData.renewalYear || 'N/A'} disabled />
                    </Form.Item>
                    <Form.Item label="Renewal Status">
                      {getRenewalStatusTag(modalData.renewalStatus)}
                    </Form.Item>
                    <Form.Item 
                      label="Gross Receipts (₱)" 
                      name="grossReceipts"
                      rules={[{ required: true, message: 'Please enter gross receipts' }]}
                    >
                      <Input type="number" min={0} placeholder="Enter gross receipts amount" />
                    </Form.Item>
                  </>
                )}
              </Form>
            </>
          ) : (
            <Alert message="No data available" type="warning" />
          )}
        </Modal>
    </BusinessOwnerLayout>
  )
}
