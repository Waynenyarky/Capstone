import React, { useState, useMemo, useEffect } from 'react'
import { Table, Button, Tag, Space, Typography, Card, theme, Tabs, Input, Select, DatePicker, Row, Col, Checkbox, Modal, Descriptions, Form, App, Spin, Alert, Upload, Divider } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, SearchOutlined, ClearOutlined, FilterOutlined, MessageOutlined, CommentOutlined, UploadOutlined, UserOutlined, ShopOutlined, EnvironmentOutlined, BankOutlined, SafetyOutlined } from '@ant-design/icons'
import { usePermitApplications } from '../hooks/usePermitApplications'
import { getBusinessProfile, setPrimaryBusiness, updateBusiness } from '@/features/business-owner/services/businessProfileService'
import { getApplicationStatus } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'
import { uploadBusinessRegistrationFile } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'
import { getRenewalStatus, updateGrossReceipts } from '@/features/business-owner/features/business-renewal/services/businessRenewalService'
import RequirementsViewModal from '../components/RequirementsViewModal'
import dayjs from 'dayjs'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function PermitApplicationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { 
    permits,
    renewals, 
    loading, 
    refresh 
  } = usePermitApplications()
  
  const { message } = App.useApp()
  const { token } = theme.useToken()
  
  // Get active tab from URL parameter, default to 'registrations'
  const activeTabFromUrl = searchParams.get('tab') || 'registrations'
  const [activeTab, setActiveTab] = useState(activeTabFromUrl)
  
  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab') || 'registrations'
    setActiveTab(tab)
  }, [searchParams])

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
  const [requirementsModalVisible, setRequirementsModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [commentsModalVisible, setCommentsModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalType, setModalType] = useState(null) // 'registration' or 'renewal'
  const [modalData, setModalData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedComments, setSelectedComments] = useState(null)
  const [editForm] = Form.useForm()
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const hasEmployeesValue = Form.useWatch('hasEmployees', editForm)

  // Update last refresh time when data is refreshed
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
      setLastRefreshTime(new Date())
      message.success('Status refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh:', error)
      message.error('Failed to refresh status')
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusTag = (status, record = null) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft', description: 'Application not yet started' },
      'requirements_viewed': { color: 'processing', text: 'Requirements Viewed', description: 'Reviewing requirements' },
      'form_completed': { color: 'processing', text: 'Form Completed', description: 'Application form filled' },
      'documents_uploaded': { color: 'processing', text: 'Documents Uploaded', description: 'Documents submitted' },
      'bir_registered': { color: 'processing', text: 'BIR Registered', description: 'BIR registration completed' },
      'agencies_registered': { color: 'processing', text: 'Agencies Registered', description: 'Agency registrations completed' },
      'submitted': { color: 'processing', text: 'Pending for Approval', description: 'Submitted to LGU Officer' },
      'resubmit': { color: 'processing', text: 'Resubmit', description: 'Resubmitted to LGU Officer for review' },
      'under_review': { color: 'processing', text: 'Under Review', description: 'Application is being reviewed by LGU Officer' },
      'approved': { color: 'success', text: 'Approved', description: 'Permit approved' },
      'rejected': { color: 'error', text: 'Rejected', description: 'Application rejected' },
      'needs_revision': { color: 'warning', text: 'Needs Revision', description: 'Requires corrections' }
    }
    const config = statusConfig[status] || { color: 'default', text: status, description: '' }
    const showCommentsIcon = (status === 'needs_revision' || status === 'rejected') && record
    
    return (
      <Space size="small">
        <Tag color={config.color} title={config.description}>
          {config.text}
        </Tag>
        {showCommentsIcon && (
          <Button
            type="link"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => handleViewComments(record, 'registration')}
            title="View review comments"
          />
        )}
      </Space>
    )
  }

  const getRenewalStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft', description: 'Renewal not yet submitted' },
      'submitted': { color: 'processing', text: 'Pending for Approval', description: 'Submitted to LGU Officer' },
      'under_review': { color: 'processing', text: 'Under Review', description: 'Renewal is being reviewed by LGU Officer' },
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

  const lguDocumentFields = [
    { key: 'idPicture', label: '2x2 ID Picture', listType: 'picture-card', isImage: true },
    { key: 'ctc', label: 'Community Tax Certificate (CTC)' },
    { key: 'barangayClearance', label: 'Barangay Clearance' },
    { key: 'dtiSecCda', label: 'DTI/SEC/CDA Registration' },
    { key: 'leaseOrLandTitle', label: 'Lease Contract or Land Title' },
    { key: 'occupancyPermit', label: 'Certificate of Occupancy' },
    { key: 'healthCertificate', label: 'Health Certificate' }
  ]

  const birDocumentFields = [
    { key: 'certificateUrl', label: 'BIR Certificate' },
    { key: 'booksOfAccountsUrl', label: 'Books of Accounts' },
    { key: 'authorityToPrintUrl', label: 'Authority to Print' },
    { key: 'paymentReceiptUrl', label: 'Payment Receipt' }
  ]

  const buildUploadFileList = (url, fieldKey, isImageOverride = false) => {
    if (!url) return []
    const urlString = typeof url === 'string' ? url : (url?.url || url?.response?.url || '')
    if (!urlString || urlString.trim() === '') return []
    const displayUrl = resolveAvatarUrl(urlString)
    if (!displayUrl) return []
    const urlParts = urlString.split('/')
    const filename = urlParts[urlParts.length - 1] || `${fieldKey}_document`
    const isImage = isImageOverride || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(urlString) || /image/i.test(urlString)
    return [{
      uid: `-${fieldKey}-${Date.now()}`,
      name: filename,
      status: 'done',
      url: displayUrl,
      thumbUrl: isImage ? displayUrl : undefined,
      response: { url: urlString }
    }]
  }

  const normFile = (e) => {
    if (Array.isArray(e)) return e
    if (e?.fileList) return Array.isArray(e.fileList) ? e.fileList : []
    return []
  }

  const extractUploadUrl = (fileList) => {
    if (!fileList || !Array.isArray(fileList) || fileList.length === 0) return ''
    const file = fileList[0]
    return file.response?.url ||
      file.url ||
      file.thumbUrl ||
      (typeof file.response === 'string' ? file.response : null) ||
      ''
  }

  const customUploadRequest = async ({ file, onSuccess, onError }, fieldName) => {
    try {
      const businessId = selectedRecord?.businessId
      if (!businessId) {
        throw new Error('Business ID is missing. Please close and reopen the modal.')
      }
      const result = await uploadBusinessRegistrationFile(businessId, file, fieldName)
      const uploadedUrl = result?.url
      if (!uploadedUrl) {
        throw new Error('Upload failed: missing file URL')
      }
      const displayUrl = resolveAvatarUrl(uploadedUrl)
      const isImageFile = fieldName === 'idPicture' || file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(uploadedUrl)
      const updatedFile = {
        ...file,
        status: 'done',
        url: displayUrl,
        thumbUrl: isImageFile ? displayUrl : undefined,
        response: { url: uploadedUrl }
      }
      onSuccess({ url: uploadedUrl }, updatedFile)
      setTimeout(() => {
        const currentFileList = editForm.getFieldValue(fieldName) || []
        const updatedFileList = currentFileList.map(f => {
          if (f.uid === file.uid || f.name === file.name) {
            return updatedFile
          }
          return f
        })
        if (JSON.stringify(currentFileList) !== JSON.stringify(updatedFileList)) {
          editForm.setFieldValue(fieldName, updatedFileList)
        }
      }, 150)
    } catch (error) {
      console.error('Document upload failed:', error)
      message.error(error?.message || 'Failed to upload document. Please try again.')
      onError?.(error)
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
      render: (status, record) => getStatusTag(status, record),
      filters: [
        { text: 'Pending for Approval', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Needs Revision', value: 'needs_revision' },
        { text: 'Resubmit', value: 'resubmit' },
        { text: 'Draft', value: 'draft' },
        { text: 'In Progress', value: 'in_progress' },
      ],
      onFilter: (value, record) => {
        // Group submitted and under_review as "Pending for Approval"
        if (value === 'pending') {
          return record.status === 'submitted' || record.status === 'under_review' || record.status === 'resubmit'
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
          'resubmit': 6,
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
            onClick={() => handleViewRequirements(record, 'registration')}
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
          businessDetails: business,
          // Include all requirement data from business
          requirementsChecklist: business?.requirementsChecklist,
          lguDocuments: business?.lguDocuments,
          birRegistration: business?.birRegistration,
          otherAgencyRegistrations: business?.otherAgencyRegistrations
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

  // Handle View Requirements button click
  const handleViewRequirements = async (record, type) => {
    if (type !== 'registration') {
      message.info('Requirements view is only available for Business Registration applications')
      return
    }
    
    setSelectedRecord(record)
    setModalType(type)
    setModalLoading(true)
    setRequirementsModalVisible(true)
    
    try {
      const statusData = await getApplicationStatus(record.businessId)
      const profile = await getBusinessProfile()
      const business = profile?.businesses?.find(b => b.businessId === record.businessId)
      setModalData({
        ...record,
        ...statusData,
        businessDetails: business,
        // Include all requirement data from business
        requirementsChecklist: business?.requirementsChecklist,
        lguDocuments: business?.lguDocuments,
        birRegistration: business?.birRegistration,
        otherAgencyRegistrations: business?.otherAgencyRegistrations
      })
    } catch (error) {
      console.error('Failed to load requirements data:', error)
      message.error('Failed to load requirements details')
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
          businessDetails: business,
          // Include all business data for comprehensive editing
          ownerIdentity: profile?.ownerIdentity || {},
          businessRegistration: business?.businessRegistration || business || {},
          location: business?.location || {},
          lguDocuments: business?.lguDocuments || {},
          birRegistration: business?.birRegistration || {},
          otherAgencyRegistrations: business?.otherAgencyRegistrations || {},
          requirementsChecklist: business?.requirementsChecklist || {}
        }
        setModalData(formData)
        
        // Set form values for comprehensive editing
        const businessData = business || {}
        const resolvedStreet = businessData?.location?.street || businessData?.street || businessData?.businessAddress || ''
        const resolvedBarangay = businessData?.location?.barangay || businessData?.barangay || ''
        const resolvedCity = businessData?.location?.city || businessData?.location?.cityMunicipality || businessData?.city || businessData?.cityMunicipality || ''
        const resolvedProvince = businessData?.location?.province || businessData?.province || ''
        const resolvedPostalCode = businessData?.location?.zipCode || businessData?.location?.postalCode || businessData?.zipCode || businessData?.postalCode || ''

        const resolvedBirRegistrationNumber = businessData?.birRegistration?.registrationNumber || businessData?.birRegistrationNumber || ''
        const resolvedBirCertificateUrl = businessData?.birRegistration?.certificateUrl || businessData?.certificateUrl || ''
        const resolvedBirBooksUrl = businessData?.birRegistration?.booksOfAccountsUrl || businessData?.booksOfAccountsUrl || ''
        const resolvedBirAuthorityUrl = businessData?.birRegistration?.authorityToPrintUrl || businessData?.authorityToPrintUrl || ''
        const resolvedBirReceiptUrl = businessData?.birRegistration?.paymentReceiptUrl || businessData?.paymentReceiptUrl || ''
        const resolvedSssProofUrl = businessData?.otherAgencyRegistrations?.sss?.proofUrl || ''
        const resolvedPhilhealthProofUrl = businessData?.otherAgencyRegistrations?.philhealth?.proofUrl || ''
        const resolvedPagibigProofUrl = businessData?.otherAgencyRegistrations?.pagibig?.proofUrl || ''

        editForm.setFieldsValue({
          businessName: businessData?.businessName || record.businessName,
          isPrimary: businessData?.isPrimary || record.isPrimary,
          // Owner Identity
          ownerFullName: businessData?.ownerFullName || businessData?.businessRegistration?.ownerFullName || profile?.ownerIdentity?.fullName || '',
          ownerTin: businessData?.ownerTin || businessData?.businessRegistration?.ownerTin || '',
          governmentIdType: businessData?.governmentIdType || businessData?.businessRegistration?.governmentIdType || '',
          governmentIdNumber: businessData?.governmentIdNumber || businessData?.businessRegistration?.governmentIdNumber || '',
          // Business Registration
          registeredBusinessName: businessData?.registeredBusinessName || businessData?.businessRegistration?.registeredBusinessName || businessData?.businessName || '',
          businessTradeName: businessData?.businessTradeName || businessData?.businessRegistration?.businessTradeName || '',
          businessRegistrationType: businessData?.businessRegistrationType || businessData?.businessRegistration?.businessRegistrationType || '',
          businessRegistrationNumber: businessData?.businessRegistrationNumber || businessData?.businessRegistration?.businessRegistrationNumber || '',
          primaryLineOfBusiness: businessData?.primaryLineOfBusiness || businessData?.businessRegistration?.primaryLineOfBusiness || '',
          businessType: businessData?.businessType || businessData?.businessRegistration?.businessType || '',
          businessClassification: businessData?.businessClassification || businessData?.businessRegistration?.businessClassification || '',
          // Location
          street: resolvedStreet,
          barangay: resolvedBarangay,
          city: resolvedCity,
          province: resolvedProvince,
          postalCode: resolvedPostalCode,
          // BIR Registration
          birRegistrationNumber: resolvedBirRegistrationNumber,
          certificateUrl: buildUploadFileList(resolvedBirCertificateUrl, 'certificateUrl'),
          booksOfAccountsUrl: buildUploadFileList(resolvedBirBooksUrl, 'booksOfAccountsUrl'),
          authorityToPrintUrl: buildUploadFileList(resolvedBirAuthorityUrl, 'authorityToPrintUrl'),
          paymentReceiptUrl: buildUploadFileList(resolvedBirReceiptUrl, 'paymentReceiptUrl'),
          // LGU Documents
          idPicture: buildUploadFileList(businessData?.lguDocuments?.idPicture, 'idPicture', true),
          ctc: buildUploadFileList(businessData?.lguDocuments?.ctc, 'ctc'),
          barangayClearance: buildUploadFileList(businessData?.lguDocuments?.barangayClearance, 'barangayClearance'),
          dtiSecCda: buildUploadFileList(businessData?.lguDocuments?.dtiSecCda, 'dtiSecCda'),
          leaseOrLandTitle: buildUploadFileList(businessData?.lguDocuments?.leaseOrLandTitle, 'leaseOrLandTitle'),
          occupancyPermit: buildUploadFileList(businessData?.lguDocuments?.occupancyPermit, 'occupancyPermit'),
          healthCertificate: buildUploadFileList(businessData?.lguDocuments?.healthCertificate, 'healthCertificate'),
          // Other Agencies
          hasEmployees: businessData?.otherAgencyRegistrations?.hasEmployees || false,
          sssRegistered: businessData?.otherAgencyRegistrations?.sss?.registered || false,
          philhealthRegistered: businessData?.otherAgencyRegistrations?.philhealth?.registered || false,
          pagibigRegistered: businessData?.otherAgencyRegistrations?.pagibig?.registered || false,
          sssProofUrl: buildUploadFileList(resolvedSssProofUrl, 'sssProofUrl'),
          philhealthProofUrl: buildUploadFileList(resolvedPhilhealthProofUrl, 'philhealthProofUrl'),
          pagibigProofUrl: buildUploadFileList(resolvedPagibigProofUrl, 'pagibigProofUrl')
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

  // Handle Resubmit - Reset status and save changes
  const handleResubmit = async () => {
    try {
      const values = await editForm.validateFields()
      setModalLoading(true)
      
      if (modalType === 'registration') {
        const existingBusiness = modalData?.businessDetails || {}
        const resolvedBusinessType = values.businessType || existingBusiness.businessType
        const resolvedBusinessClassification = values.businessClassification || existingBusiness.businessClassification
        const resolvedRegistrationType = values.businessRegistrationType || existingBusiness.businessRegistrationType
        const resolvedPrimaryLine = values.primaryLineOfBusiness || existingBusiness.primaryLineOfBusiness
        const lguDocuments = lguDocumentFields.reduce((acc, field) => {
          const url = extractUploadUrl(values[field.key])
          if (url) acc[field.key] = url
          return acc
        }, {})
        const birDocuments = birDocumentFields.reduce((acc, field) => {
          const url = extractUploadUrl(values[field.key])
          if (url) acc[field.key] = url
          return acc
        }, {})
        const otherAgencyProofs = {
          sssProofUrl: extractUploadUrl(values.sssProofUrl),
          philhealthProofUrl: extractUploadUrl(values.philhealthProofUrl),
          pagibigProofUrl: extractUploadUrl(values.pagibigProofUrl)
        }
        const mergedBirRegistration = {
          ...(existingBusiness.birRegistration || {}),
          registrationNumber: values.birRegistrationNumber || existingBusiness.birRegistration?.registrationNumber || '',
          ...birDocuments
        }

        // Prepare update data - fields are at top level of business object
        const updateData = {
          // Business registration fields (top level)
          registeredBusinessName: values.registeredBusinessName || existingBusiness.registeredBusinessName || existingBusiness.businessName,
          businessTradeName: values.businessTradeName || '',
          businessRegistrationNumber: values.businessRegistrationNumber || modalData.businessDetails?.businessRegistrationNumber || '',
          ...(resolvedRegistrationType ? { businessRegistrationType: resolvedRegistrationType } : {}),
          ...(resolvedPrimaryLine ? { primaryLineOfBusiness: resolvedPrimaryLine } : {}),
          ...(resolvedBusinessType ? { businessType: resolvedBusinessType } : {}),
          ...(resolvedBusinessClassification ? { businessClassification: resolvedBusinessClassification } : {}),
          // Location fields (top level)
          street: values.street || '',
          barangay: values.barangay || '',
          cityMunicipality: values.city || '',
          // Owner fields (top level)
          ownerFullName: values.ownerFullName || '',
          ownerTin: values.ownerTin || '',
          governmentIdType: values.governmentIdType || '',
          governmentIdNumber: values.governmentIdNumber || '',
          // Location (nested)
          location: {
            street: values.street || '',
            barangay: values.barangay || '',
            city: values.city || '',
            cityMunicipality: values.city || '',
            province: values.province || '',
            zipCode: values.postalCode || ''
          },
          // BIR Registration (nested)
          birRegistration: mergedBirRegistration,
          // LGU Documents (nested)
          ...(Object.keys(lguDocuments).length > 0 ? { lguDocuments: { ...(existingBusiness.lguDocuments || {}), ...lguDocuments } } : {}),
          // Other Agency Registrations (nested)
          otherAgencyRegistrations: {
            hasEmployees: values.hasEmployees || false,
            sss: {
              registered: values.sssRegistered || false,
              ...(otherAgencyProofs.sssProofUrl ? { proofUrl: otherAgencyProofs.sssProofUrl } : {})
            },
            philhealth: {
              registered: values.philhealthRegistered || false,
              ...(otherAgencyProofs.philhealthProofUrl ? { proofUrl: otherAgencyProofs.philhealthProofUrl } : {})
            },
            pagibig: {
              registered: values.pagibigRegistered || false,
              ...(otherAgencyProofs.pagibigProofUrl ? { proofUrl: otherAgencyProofs.pagibigProofUrl } : {})
            }
          },
          // Reset application status and clear review fields
          applicationStatus: 'resubmit',
          reviewComments: null,
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        }
        
        // Update business with new data
        await updateBusiness(selectedRecord.businessId, updateData)
        
        // Update primary business status if changed
        if (values.isPrimary !== modalData.isPrimary && values.isPrimary) {
          await setPrimaryBusiness(selectedRecord.businessId)
        }
        
        message.success('Application updated successfully. You can now resubmit your application.')
        setEditModalVisible(false)
        setModalData(null)
        editForm.resetFields()
        refresh() // Refresh the data
      }
    } catch (error) {
      console.error('Failed to resubmit:', error)
      if (!error.errorFields) {
        message.error(error?.message || 'Failed to resubmit application')
      }
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
        const existingBusiness = modalData?.businessDetails || {}
        const resolvedBusinessType = values.businessType || existingBusiness.businessType
        const resolvedBusinessClassification = values.businessClassification || existingBusiness.businessClassification
        const resolvedRegistrationType = values.businessRegistrationType || existingBusiness.businessRegistrationType
        const resolvedPrimaryLine = values.primaryLineOfBusiness || existingBusiness.primaryLineOfBusiness
        const lguDocuments = lguDocumentFields.reduce((acc, field) => {
          const url = extractUploadUrl(values[field.key])
          if (url) acc[field.key] = url
          return acc
        }, {})
        const birDocuments = birDocumentFields.reduce((acc, field) => {
          const url = extractUploadUrl(values[field.key])
          if (url) acc[field.key] = url
          return acc
        }, {})
        const otherAgencyProofs = {
          sssProofUrl: extractUploadUrl(values.sssProofUrl),
          philhealthProofUrl: extractUploadUrl(values.philhealthProofUrl),
          pagibigProofUrl: extractUploadUrl(values.pagibigProofUrl)
        }
        const mergedBirRegistration = {
          ...(existingBusiness.birRegistration || {}),
          registrationNumber: values.birRegistrationNumber || existingBusiness.birRegistration?.registrationNumber || '',
          ...birDocuments
        }

        // For draft status, update business data - fields are at top level
        const updateData = {
          // Business registration fields (top level)
          registeredBusinessName: values.registeredBusinessName || existingBusiness.registeredBusinessName || existingBusiness.businessName,
          businessTradeName: values.businessTradeName || '',
          businessRegistrationNumber: values.businessRegistrationNumber || modalData.businessDetails?.businessRegistrationNumber || '',
          ...(resolvedRegistrationType ? { businessRegistrationType: resolvedRegistrationType } : {}),
          ...(resolvedPrimaryLine ? { primaryLineOfBusiness: resolvedPrimaryLine } : {}),
          ...(resolvedBusinessType ? { businessType: resolvedBusinessType } : {}),
          ...(resolvedBusinessClassification ? { businessClassification: resolvedBusinessClassification } : {}),
          // Location fields (top level)
          street: values.street || '',
          barangay: values.barangay || '',
          cityMunicipality: values.city || '',
          // Owner fields (top level)
          ownerFullName: values.ownerFullName || '',
          ownerTin: values.ownerTin || '',
          governmentIdType: values.governmentIdType || '',
          governmentIdNumber: values.governmentIdNumber || '',
          // Location (nested)
          location: {
            street: values.street || '',
            barangay: values.barangay || '',
            city: values.city || '',
            cityMunicipality: values.city || '',
            province: values.province || '',
            zipCode: values.postalCode || ''
          },
          // BIR Registration (nested)
          birRegistration: mergedBirRegistration,
          // LGU Documents (nested)
          ...(Object.keys(lguDocuments).length > 0 ? { lguDocuments: { ...(existingBusiness.lguDocuments || {}), ...lguDocuments } } : {}),
          // Other Agency Registrations (nested)
          otherAgencyRegistrations: {
            hasEmployees: values.hasEmployees || false,
            sss: {
              registered: values.sssRegistered || false,
              ...(otherAgencyProofs.sssProofUrl ? { proofUrl: otherAgencyProofs.sssProofUrl } : {})
            },
            philhealth: {
              registered: values.philhealthRegistered || false,
              ...(otherAgencyProofs.philhealthProofUrl ? { proofUrl: otherAgencyProofs.philhealthProofUrl } : {})
            },
            pagibig: {
              registered: values.pagibigRegistered || false,
              ...(otherAgencyProofs.pagibigProofUrl ? { proofUrl: otherAgencyProofs.pagibigProofUrl } : {})
            }
          },
          // Save Changes should set status to needs_revision
          applicationStatus: 'needs_revision'
        }
        
        await updateBusiness(selectedRecord.businessId, updateData)
        
        // Update primary business status if changed
        if (values.isPrimary !== modalData.isPrimary && values.isPrimary) {
          await setPrimaryBusiness(selectedRecord.businessId)
          message.success('Business set as primary successfully')
        } else {
          message.success('Business details updated successfully')
        }
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
      const editableStatuses = ['draft', 'needs_revision', 'rejected']
      return editableStatuses.includes(record.status)
    } else if (type === 'renewal') {
      const editableStatuses = ['draft']
      return editableStatuses.includes(record.renewalStatus)
    }
    return false
  }

  // Handle view comments
  const handleViewComments = async (record, type) => {
    try {
      if (type === 'registration') {
        const statusData = await getApplicationStatus(record.businessId)
        // Backend returns 'applicationStatus' but we use 'status' in the frontend
        const applicationStatus = statusData.applicationStatus || statusData.status || record.status
        
        // Handle empty strings - convert to null for proper display
        // Check multiple possible fields (statusData first, then record)
        const reviewComments = statusData.reviewComments !== undefined && statusData.reviewComments !== null
          ? statusData.reviewComments
          : (statusData.comments !== undefined && statusData.comments !== null
              ? statusData.comments
              : (statusData.review?.comments !== undefined && statusData.review?.comments !== null
                  ? statusData.review.comments
                  : (record.reviewComments !== undefined && record.reviewComments !== null ? record.reviewComments : null)))
        const rejectionReason = statusData.rejectionReason !== undefined && statusData.rejectionReason !== null
          ? statusData.rejectionReason
          : (statusData.review?.rejectionReason !== undefined && statusData.review?.rejectionReason !== null
              ? statusData.review.rejectionReason
              : (record.rejectionReason !== undefined && record.rejectionReason !== null ? record.rejectionReason : null))

        // Support separate fields (comments + required changes) when provided
        const directComments = statusData.comments ?? statusData.review?.comments ?? null
        const directRequiredChanges = statusData.requestChangesMessage ?? statusData.review?.requestChangesMessage ?? statusData.requiredChangesMessage ?? null
        const reviewCommentsObject = typeof reviewComments === 'object' && reviewComments !== null ? reviewComments : null

        let combinedReviewComments = reviewComments
        if (!combinedReviewComments && (directComments || directRequiredChanges)) {
          combinedReviewComments = directRequiredChanges
            ? `${directComments || ''}\n\nRequired Changes:\n${directRequiredChanges}`
            : directComments
        }
        if (reviewCommentsObject) {
          const objComments = reviewCommentsObject.comments ?? reviewCommentsObject.reviewComments ?? null
          const objRequired = reviewCommentsObject.requestChangesMessage ?? reviewCommentsObject.requiredChangesMessage ?? null
          combinedReviewComments = objRequired
            ? `${objComments || ''}\n\nRequired Changes:\n${objRequired}`
            : (objComments || combinedReviewComments)
        }
        
        // Convert to string and trim, but keep empty strings as empty (not null) to distinguish from missing
        const reviewCommentsValue = combinedReviewComments !== null && combinedReviewComments !== undefined
          ? (typeof combinedReviewComments === 'string' ? combinedReviewComments.trim() : String(combinedReviewComments).trim())
          : null
        const rejectionReasonValue = rejectionReason !== null && rejectionReason !== undefined
          ? (typeof rejectionReason === 'string' ? rejectionReason.trim() : String(rejectionReason).trim())
          : null
        
        // If trimmed value is empty string, set to null for display purposes
        const finalReviewComments = (reviewCommentsValue && reviewCommentsValue.length > 0) ? reviewCommentsValue : null
        const finalRejectionReason = (rejectionReasonValue && rejectionReasonValue.length > 0) ? rejectionReasonValue : null
        const originalReviewComments = finalReviewComments
        
        // Parse reviewComments for needs_revision status to separate general comments from required changes
        let generalComments = null
        let requiredChanges = null
        
        // Use originalReviewComments for parsing
        const reviewCommentsForParsing = originalReviewComments
        
        if (applicationStatus === 'needs_revision' && reviewCommentsForParsing) {
          // Check if reviewComments contains "Required Changes:" separator
          // Format from LGU Officer: `${comments}\n\nRequired Changes:\n${requestChangesMessage}`
          // Use a more robust pattern to find the separator
          const separatorIndex = reviewCommentsForParsing.indexOf('\n\nRequired Changes:')
          
          if (separatorIndex !== -1) {
            // Get the part before "Required Changes:" (general comments)
            const beforeRequiredChanges = reviewCommentsForParsing.substring(0, separatorIndex).trim()
            // Get the part after "Required Changes:" (required changes message)
            const afterSeparator = reviewCommentsForParsing.substring(separatorIndex + '\n\nRequired Changes:'.length).trim()
            
            // Remove leading newline if present
            const afterRequiredChanges = afterSeparator.replace(/^\n+/, '').trim()
            
            // Set general comments (part before "Required Changes:")
            generalComments = (beforeRequiredChanges && beforeRequiredChanges.length > 0) ? beforeRequiredChanges : null
            // Set required changes (part after "Required Changes:")
            requiredChanges = (afterRequiredChanges && afterRequiredChanges.length > 0) ? afterRequiredChanges : null
          } else {
            // No separator found, check if it starts with "Required Changes:"
            if (reviewCommentsForParsing.trim().startsWith('Required Changes:')) {
              generalComments = null
              const extracted = reviewCommentsForParsing.replace(/^Required Changes:\s*\n?/, '').trim()
              requiredChanges = (extracted && extracted.length > 0) ? extracted : null
            } else {
              // No separator found - this means LGU Officer provided comments but no "Required Changes Message"
              // Show the entire comments as general comments, and no required changes section
              generalComments = (reviewCommentsForParsing && reviewCommentsForParsing.length > 0) ? reviewCommentsForParsing : null
              requiredChanges = null
            }
          }
        } else {
          // For other statuses (approved, under_review, etc.), use reviewComments as-is
          generalComments = reviewCommentsForParsing
          requiredChanges = null
        }

        // Non-destructive fallback: if parsing produced nothing but we have original text
        if (!generalComments && !requiredChanges && originalReviewComments) {
          generalComments = originalReviewComments
        }
        
        console.log('[handleViewComments] Status data:', {
          applicationStatus,
          generalComments,
          requiredChanges,
          reviewComments: originalReviewComments,
          rejectionReason: finalRejectionReason,
          reviewedAt: statusData.reviewedAt || record.reviewedAt,
          rawReviewComments: statusData.reviewComments,
          rawRecordComments: record.reviewComments,
          statusDataReviewComments: statusData.reviewComments,
          recordReviewComments: record.reviewComments,
          directComments,
          directRequiredChanges,
          combinedReviewComments
        })
        
        setSelectedComments({
          status: applicationStatus,
          reviewComments: finalReviewComments, // Keep original for backward compatibility
          generalComments,
          requiredChanges,
          rejectionReason: finalRejectionReason,
          reviewedAt: statusData.reviewedAt || record.reviewedAt || null,
          businessName: record.businessName || statusData.businessName,
          applicationReferenceNumber: statusData.applicationReferenceNumber || record.referenceNumber
        })
        setCommentsModalVisible(true)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
      message.error('Failed to load review comments')
      // Fallback to record data
      const reviewComments = record.reviewComments !== undefined && record.reviewComments !== null 
        ? record.reviewComments 
        : null
      const rejectionReason = record.rejectionReason !== undefined && record.rejectionReason !== null
        ? record.rejectionReason
        : null
      
      // Convert to string and trim
      const reviewCommentsValue = reviewComments !== null && reviewComments !== undefined 
        ? (typeof reviewComments === 'string' ? reviewComments.trim() : String(reviewComments).trim())
        : null
      const rejectionReasonValue = rejectionReason !== null && rejectionReason !== undefined
        ? (typeof rejectionReason === 'string' ? rejectionReason.trim() : String(rejectionReason).trim())
        : null
      
      // If trimmed value is empty string, set to null for display purposes
      const finalReviewComments = (reviewCommentsValue && reviewCommentsValue.length > 0) ? reviewCommentsValue : null
      const finalRejectionReason = (rejectionReasonValue && rejectionReasonValue.length > 0) ? rejectionReasonValue : null
      
      // Parse reviewComments for needs_revision status
      let generalComments = null
      let requiredChanges = null
      
      const reviewCommentsForParsing = finalReviewComments
      
      if (record.status === 'needs_revision' && reviewCommentsForParsing) {
        // Format from LGU Officer: `${comments}\n\nRequired Changes:\n${requestChangesMessage}`
        // Use a more robust pattern to find the separator
        const separatorIndex = reviewCommentsForParsing.indexOf('\n\nRequired Changes:')
        
        if (separatorIndex !== -1) {
          // Get the part before "Required Changes:" (general comments)
          const beforeRequiredChanges = reviewCommentsForParsing.substring(0, separatorIndex).trim()
          // Get the part after "Required Changes:" (required changes message)
          const afterSeparator = reviewCommentsForParsing.substring(separatorIndex + '\n\nRequired Changes:'.length).trim()
          
          // Remove leading newline if present
          const afterRequiredChanges = afterSeparator.replace(/^\n+/, '').trim()
          
          // Set general comments (part before "Required Changes:")
          generalComments = (beforeRequiredChanges && beforeRequiredChanges.length > 0) ? beforeRequiredChanges : null
          // Set required changes (part after "Required Changes:")
          requiredChanges = (afterRequiredChanges && afterRequiredChanges.length > 0) ? afterRequiredChanges : null
        } else {
          // No separator found, check if it starts with "Required Changes:"
          if (reviewCommentsForParsing.trim().startsWith('Required Changes:')) {
            generalComments = null
            const extracted = reviewCommentsForParsing.replace(/^Required Changes:\s*\n?/, '').trim()
            requiredChanges = (extracted && extracted.length > 0) ? extracted : null
          } else {
            // No separator found - this means LGU Officer provided comments but no "Required Changes Message"
            // Show the entire comments as general comments, and no required changes section
            generalComments = (reviewCommentsForParsing && reviewCommentsForParsing.length > 0) ? reviewCommentsForParsing : null
            requiredChanges = null
          }
        }
      } else {
        generalComments = reviewCommentsForParsing
        requiredChanges = null
      }
      
      setSelectedComments({
        status: record.status,
        reviewComments: finalReviewComments,
        generalComments,
        requiredChanges,
        rejectionReason: finalRejectionReason,
        reviewedAt: record.reviewedAt || null,
        businessName: record.businessName
      })
      setCommentsModalVisible(true)
    }
  }

  return (
    <BusinessOwnerLayout pageTitle="Permit Applications">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <Title level={2} style={{ color: token.colorPrimary }}>Permit Applications</Title>
              <Paragraph type="secondary">
                Manage your business registrations and track their status.
                {lastRefreshTime && (
                  <span style={{ marginLeft: 8, fontSize: '12px', color: token.colorTextSecondary }}>
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </span>
                )}
              </Paragraph>
            </div>
            <Space>
              <Button 
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={handleRefresh}
                loading={refreshing}
                title="Refresh status (auto-refreshes every 30 seconds)"
              >
                Refresh
              </Button>
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
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key)
                // Update URL without page reload
                navigate(`/owner/permit-applications?tab=${key}`, { replace: true })
              }}
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

        {/* Requirements View Modal */}
        {modalType === 'registration' && (
          <RequirementsViewModal
            visible={requirementsModalVisible}
            application={modalData}
            type={modalType}
            loading={modalLoading}
            onClose={() => {
              setRequirementsModalVisible(false)
              setModalData(null)
            }}
          />
        )}

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
          title={modalType === 'registration' ? 'Edit & Resubmit Business Registration' : 'Edit Business Renewal'}
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false)
            setModalData(null)
            editForm.resetFields()
          }}
          footer={null}
          width={900}
          style={{ top: 20 }}
        >
          {modalLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : modalData ? (
            <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', padding: '8px 0' }}>
              {modalType === 'registration' ? (
                <Form
                  form={editForm}
                  layout="vertical"
                >
                  <Tabs
                    items={[
                      {
                        key: 'owner',
                        label: <span><UserOutlined />Owner Identity</span>,
                        children: (
                          <Card size="small" style={{ marginBottom: 16 }}>
                            <Form.Item label="Owner Full Name" name="ownerFullName">
                              <Input placeholder="Enter owner full name" />
                            </Form.Item>
                            <Form.Item label="Owner TIN" name="ownerTin">
                              <Input placeholder="Enter TIN" />
                            </Form.Item>
                            <Form.Item label="Government ID Type" name="governmentIdType">
                              <Select placeholder="Select ID type">
                                <Option value="Driver's License">Driver's License</Option>
                                <Option value="Passport">Passport</Option>
                                <Option value="National ID">National ID</Option>
                                <Option value="SSS ID">SSS ID</Option>
                                <Option value="PhilHealth ID">PhilHealth ID</Option>
                                <Option value="Voter's ID">Voter's ID</Option>
                                <Option value="Other">Other</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item label="Government ID Number" name="governmentIdNumber">
                              <Input placeholder="Enter ID number" />
                            </Form.Item>
                          </Card>
                        )
                      },
                      {
                        key: 'business',
                        label: <span><ShopOutlined />Business Details</span>,
                        children: (
                          <Card size="small" style={{ marginBottom: 16 }}>
                            <Form.Item label="Registered Business Name" name="registeredBusinessName" rules={[{ required: true, message: 'Business name is required' }]}>
                              <Input placeholder="Enter registered business name" />
                            </Form.Item>
                            <Form.Item label="Business Trade Name" name="businessTradeName">
                              <Input placeholder="Enter trade name" />
                            </Form.Item>
                            <Form.Item label="Business Registration Type" name="businessRegistrationType">
                              <Select placeholder="Select registration type">
                                <Option value="sole_proprietorship">Sole Proprietorship</Option>
                                <Option value="partnership">Partnership</Option>
                                <Option value="corporation">Corporation</Option>
                                <Option value="cooperative">Cooperative</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item label="Business Registration Number" name="businessRegistrationNumber">
                              <Input placeholder="Enter registration number" />
                            </Form.Item>
                            <Form.Item label="Primary Line of Business" name="primaryLineOfBusiness">
                              <Input placeholder="Enter primary line of business" />
                            </Form.Item>
                            <Form.Item label="Business Type" name="businessType">
                              <Select placeholder="Select business type">
                                <Option value="retail">Retail</Option>
                                <Option value="wholesale">Wholesale</Option>
                                <Option value="service">Service</Option>
                                <Option value="manufacturing">Manufacturing</Option>
                                <Option value="other">Other</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item label="Business Classification" name="businessClassification">
                              <Input placeholder="Enter business classification" />
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
                          </Card>
                        )
                      },
                      {
                        key: 'location',
                        label: <span><EnvironmentOutlined />Location</span>,
                        children: (
                          <Card size="small" style={{ marginBottom: 16 }}>
                            <Form.Item label="Street Address" name="street">
                              <Input placeholder="Enter street address" />
                            </Form.Item>
                            <Form.Item label="Barangay" name="barangay">
                              <Input placeholder="Enter barangay" />
                            </Form.Item>
                            <Form.Item label="City" name="city">
                              <Input placeholder="Enter city" />
                            </Form.Item>
                            <Form.Item label="Province" name="province">
                              <Input placeholder="Enter province" />
                            </Form.Item>
                            <Form.Item label="Postal Code" name="postalCode">
                              <Input placeholder="Enter postal code" />
                            </Form.Item>
                          </Card>
                        )
                      },
                      {
                        key: 'lguDocuments',
                        label: <span><UploadOutlined />LGU Documents</span>,
                        children: (
                          <Card size="small" style={{ marginBottom: 16 }}>
                            {lguDocumentFields.map((field) => (
                              <Form.Item
                                key={field.key}
                                label={field.label}
                                name={field.key}
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                              >
                                <Upload
                                  listType={field.listType || 'picture'}
                                  accept="image/*,.pdf"
                                  maxCount={1}
                                  customRequest={(options) => customUploadRequest(options, field.key)}
                                >
                                  {field.listType === 'picture-card' ? (
                                    <div>
                                      <PlusOutlined />
                                      <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                  ) : (
                                    <Button icon={<UploadOutlined />}>Upload</Button>
                                  )}
                                </Upload>
                              </Form.Item>
                            ))}
                          </Card>
                        )
                      },
                      {
                        key: 'bir',
                        label: <span><BankOutlined />BIR Registration</span>,
                        children: (
                          <Card size="small" style={{ marginBottom: 16 }}>
                            <Form.Item label="BIR Registration Number" name="birRegistrationNumber">
                              <Input placeholder="Enter BIR registration number" />
                            </Form.Item>
                            {birDocumentFields.map((field) => (
                              <Form.Item
                                key={field.key}
                                label={field.label}
                                name={field.key}
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                              >
                                <Upload
                                  listType="picture"
                                  accept="image/*,.pdf"
                                  maxCount={1}
                                  customRequest={(options) => customUploadRequest(options, field.key)}
                                >
                                  <Button icon={<UploadOutlined />}>Upload</Button>
                                </Upload>
                              </Form.Item>
                            ))}
                            <Alert
                              message="BIR Documents"
                              description="Upload updated BIR documents here before saving or resubmitting."
                              type="info"
                              showIcon
                              style={{ marginTop: 16 }}
                            />
                          </Card>
                        )
                      },
                      {
                        key: 'agencies',
                        label: <span><SafetyOutlined />Other Agencies</span>,
                        children: (
                          <Card size="small" style={{ marginBottom: 16 }}>
                            <Form.Item label="Has Employees" name="hasEmployees" valuePropName="checked">
                              <Checkbox>This business has employees</Checkbox>
                            </Form.Item>
                            {hasEmployeesValue && (
                              <>
                                <Form.Item label="SSS Registered" name="sssRegistered" valuePropName="checked">
                                  <Checkbox>SSS Registration completed</Checkbox>
                                </Form.Item>
                                <Form.Item
                                  label="SSS Proof"
                                  name="sssProofUrl"
                                  valuePropName="fileList"
                                  getValueFromEvent={normFile}
                                >
                                  <Upload
                                    listType="picture"
                                    accept="image/*,.pdf"
                                    maxCount={1}
                                    customRequest={(options) => customUploadRequest(options, 'sssProofUrl')}
                                  >
                                    <Button icon={<UploadOutlined />}>Upload</Button>
                                  </Upload>
                                </Form.Item>
                                <Form.Item label="PhilHealth Registered" name="philhealthRegistered" valuePropName="checked">
                                  <Checkbox>PhilHealth Registration completed</Checkbox>
                                </Form.Item>
                                <Form.Item
                                  label="PhilHealth Proof"
                                  name="philhealthProofUrl"
                                  valuePropName="fileList"
                                  getValueFromEvent={normFile}
                                >
                                  <Upload
                                    listType="picture"
                                    accept="image/*,.pdf"
                                    maxCount={1}
                                    customRequest={(options) => customUploadRequest(options, 'philhealthProofUrl')}
                                  >
                                    <Button icon={<UploadOutlined />}>Upload</Button>
                                  </Upload>
                                </Form.Item>
                                <Form.Item label="Pag-IBIG Registered" name="pagibigRegistered" valuePropName="checked">
                                  <Checkbox>Pag-IBIG Registration completed</Checkbox>
                                </Form.Item>
                                <Form.Item
                                  label="Pag-IBIG Proof"
                                  name="pagibigProofUrl"
                                  valuePropName="fileList"
                                  getValueFromEvent={normFile}
                                >
                                  <Upload
                                    listType="picture"
                                    accept="image/*,.pdf"
                                    maxCount={1}
                                    customRequest={(options) => customUploadRequest(options, 'pagibigProofUrl')}
                                  >
                                    <Button icon={<UploadOutlined />}>Upload</Button>
                                  </Upload>
                                </Form.Item>
                              </>
                            )}
                          </Card>
                        )
                      }
                    ]}
                  />
                  <Divider />
                  {(selectedRecord?.status === 'rejected' || selectedRecord?.status === 'needs_revision') && (
                    <Alert
                      message="Resubmission Notice"
                      description="Clicking 'Resubmit' will update your application status to Resubmit and clear review comments."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
                    <Button onClick={() => {
                      setEditModalVisible(false)
                      setModalData(null)
                      editForm.resetFields()
                    }}>
                      Cancel
                    </Button>
                    {(selectedRecord?.status === 'rejected' || selectedRecord?.status === 'needs_revision') && (
                      <Button
                        type="primary"
                        onClick={handleResubmit}
                        loading={modalLoading}
                      >
                        Resubmit
                      </Button>
                    )}
                    {selectedRecord?.status === 'draft' && (
                      <Button
                        type="primary"
                        onClick={handleEditSubmit}
                        loading={modalLoading}
                      >
                        Save Changes
                      </Button>
                    )}
                  </Space>
                </Form>
              ) : (
                <>
                  {!canEdit(selectedRecord, modalType) && (
                    <Alert
                      message="Editing Not Allowed"
                      description="This renewal cannot be edited because it has been submitted or approved. Only draft renewals can be edited."
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
                  </Form>
                  <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
                    <Button onClick={() => {
                      setEditModalVisible(false)
                      setModalData(null)
                      editForm.resetFields()
                    }}>
                      Cancel
                    </Button>
                    {canEdit(selectedRecord, modalType) && (
                      <Button
                        type="primary"
                        onClick={handleEditSubmit}
                        loading={modalLoading}
                      >
                        Save Changes
                      </Button>
                    )}
                  </Space>
                </>
              )}
            </div>
          ) : (
            <Alert message="No data available" type="warning" />
          )}
        </Modal>

        {/* Review Comments Modal */}
        <Modal
          title={
            <Space>
              <MessageOutlined />
              <span>Review Comments & Feedback</span>
            </Space>
          }
          open={commentsModalVisible}
          onCancel={() => {
            setCommentsModalVisible(false)
            setSelectedComments(null)
          }}
          footer={[
            <Button key="close" onClick={() => {
              setCommentsModalVisible(false)
              setSelectedComments(null)
            }}>
              Close
            </Button>
          ]}
          width={600}
        >
          {selectedComments && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>Business Name:</Text>
                <Text style={{ marginLeft: 8 }}>{selectedComments.businessName || 'N/A'}</Text>
              </div>
              {selectedComments.applicationReferenceNumber && (
                <div>
                  <Text strong>Application Reference:</Text>
                  <Text style={{ marginLeft: 8 }}>{selectedComments.applicationReferenceNumber}</Text>
                </div>
              )}
              <div>
                <Text strong>Status:</Text>
                <span style={{ marginLeft: 8 }}>
                  {getStatusTag(selectedComments.status)}
                </span>
              </div>
              
              {selectedComments.status === 'rejected' && selectedComments.rejectionReason && (
                <div>
                  <Alert
                    message="Rejection Reason"
                    description={selectedComments.rejectionReason}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                </div>
              )}
              
              {selectedComments.status === 'needs_revision' && selectedComments.generalComments && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Comments:
                  </Text>
                  <Card size="small" style={{ backgroundColor: '#fafafa', marginBottom: 16 }}>
                    <Text>{selectedComments.generalComments}</Text>
                  </Card>
                </div>
              )}
              
              {selectedComments.status === 'needs_revision' && selectedComments.requiredChanges && (
                <div>
                  <Alert
                    message="Required Changes"
                    description={selectedComments.requiredChanges}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                </div>
              )}

              {selectedComments.status === 'needs_revision' && !selectedComments.generalComments && !selectedComments.requiredChanges && selectedComments.reviewComments && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    LGU Officer Message:
                  </Text>
                  <Card size="small" style={{ backgroundColor: '#fafafa', marginBottom: 16 }}>
                    <Text>{selectedComments.reviewComments}</Text>
                  </Card>
                </div>
              )}
              
              {/* Fallback: If parsing didn't work, show original reviewComments */}
              
              {/* Show fallback message only if no comments or changes are available */}
              {selectedComments.status === 'needs_revision' && !selectedComments.generalComments && !selectedComments.requiredChanges && !selectedComments.reviewComments && (
                <Alert
                  message="No Changes Specified"
                  description="This application has been marked as needing revision, but no specific changes have been specified yet."
                  type="warning"
                  showIcon
                />
              )}
              
              {selectedComments.status === 'rejected' && selectedComments.reviewComments && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Additional Comments:
                  </Text>
                  <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                    <Text>{selectedComments.reviewComments}</Text>
                  </Card>
                </div>
              )}
              
              {selectedComments.status !== 'rejected' && selectedComments.status !== 'needs_revision' && selectedComments.reviewComments && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Review Comments:
                  </Text>
                  <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                    <Text>{selectedComments.reviewComments}</Text>
                  </Card>
                </div>
              )}
              
              {selectedComments.reviewedAt && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Reviewed on: {dayjs(selectedComments.reviewedAt).format('MMMM D, YYYY [at] h:mm A')}
                  </Text>
                </div>
              )}
              
              {selectedComments.status === 'rejected' && !selectedComments.rejectionReason && (
                <Alert
                  message="No Rejection Reason Available"
                  description="This application has been rejected, but no specific rejection reason has been provided."
                  type="error"
                  showIcon
                />
              )}
              
              {selectedComments.status !== 'rejected' && selectedComments.status !== 'needs_revision' && !selectedComments.reviewComments && !selectedComments.rejectionReason && (
                <Alert
                  message="No Comments Available"
                  description="No review comments or feedback have been provided for this application."
                  type="info"
                  showIcon
                />
              )}
            </Space>
          )}
        </Modal>
    </BusinessOwnerLayout>
  )
}
