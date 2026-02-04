import React, { useState, useEffect } from 'react'
import {
  Modal,
  Tabs,
  Descriptions,
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Form,
  Radio,
  Input,
  Alert,
  List,
  Badge,
  Divider,
  Spin,
  Checkbox,
  Row,
  Col,
  theme,
  Image,
  App
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SafetyOutlined,
  CheckOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileOutlined
} from '@ant-design/icons'
import { PermitApplicationService } from '@/features/lgu-officer/infrastructure/services'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import { getBusinessTypeLabel } from '@/constants/businessTypes'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function PermitApplicationDetail({
  visible,
  application: initialApplication,
  onClose,
  onReviewComplete,
  onReview,
  onReviewStarted
}) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [startingReview, setStartingReview] = useState(false)
  const [application, setApplication] = useState(initialApplication)
  const [decision, setDecision] = useState(null)
  const { token } = theme.useToken()
  const { message } = App.useApp()

  const permitService = new PermitApplicationService()

  useEffect(() => {
    if (visible && initialApplication) {
      setApplication(initialApplication)
      loadApplicationDetails()
      setDecision(null)
      // Auto-start review if status is 'submitted'
      handleStartReview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialApplication])

  // Reset form fields when application changes and form is available
  // Only reset if the form will be rendered (when status allows review)
  useEffect(() => {
    if (visible && application) {
      const canReviewApp = application?.status === 'submitted' || 
                           application?.status === 'under_review' || 
                           application?.status === 'needs_revision'
      if (canReviewApp) {
        // Use setTimeout to ensure Form component is mounted before resetting fields
        const timer = setTimeout(() => {
          try {
            form.resetFields()
          } catch (err) {
            // Form might not be mounted yet, ignore error
            console.debug('Form not ready for reset:', err)
          }
        }, 100)
        return () => clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, application?.applicationId, application?.status])

  const handleStartReview = async () => {
    if (!initialApplication?.applicationId) return
    
    // Only auto-start if status is 'submitted', 'resubmit' or 'needs_revision'
    if (!['submitted', 'resubmit', 'needs_revision'].includes(initialApplication?.status)) return

    setStartingReview(true)
    try {
      const result = await permitService.startReview({
        applicationId: initialApplication.applicationId,
        businessId: initialApplication.businessId
      })
      
      if (result?.application) {
        setApplication(result.application)
        if (onReviewStarted) {
          onReviewStarted(result.application)
        }
      } else {
        // Reload application details to get updated status
        await loadApplicationDetails()
      }
    } catch (error) {
      console.error('Failed to start review:', error)
      // Don't show error - this is a background operation
      // If it fails, the officer can still proceed with the review
      // But reload details to ensure we have the correct status
      await loadApplicationDetails()
    } finally {
      setStartingReview(false)
    }
  }

  const loadApplicationDetails = async () => {
    if (!initialApplication?.applicationId) return

    setLoading(true)
    try {
      const details = await permitService.getApplicationById(
        initialApplication.applicationId,
        initialApplication.businessId
      )
      setApplication(details)
    } catch (error) {
      console.error('Failed to load application details:', error)
      message.error('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }

  const handleDecisionChange = (e) => {
    setDecision(e.target.value)
    form.setFieldsValue({ 
      rejectionReason: undefined,
      requestChangesMessage: undefined
    })
  }

  const handleReview = async (values) => {
    if (!decision) {
      message.error('Please select a decision')
      return
    }

    if (!values.comments || values.comments.trim() === '') {
      message.error('Comments are required')
      return
    }

    if (decision === 'reject' && (!values.rejectionReason || values.rejectionReason.trim() === '')) {
      message.error('Rejection reason is required when rejecting an application')
      return
    }

    if (decision === 'request_changes' && (!values.requestChangesMessage || values.requestChangesMessage.trim() === '')) {
      message.error('Please specify what changes are needed')
      return
    }

    setReviewing(true)
    try {
      // For request_changes, combine comments and requestChangesMessage
      const reviewComments = decision === 'request_changes' && values.requestChangesMessage
        ? `${values.comments}\n\nRequired Changes:\n${values.requestChangesMessage}`
        : values.comments

      const result = await onReview({
        applicationId: application.applicationId,
        decision,
        comments: reviewComments,
        rejectionReason: values.rejectionReason,
        businessId: application.businessId
      })

      // Update application state with the returned result
      if (result?.application) {
        setApplication(result.application)
      } else {
        // Reload application details to get updated status
        await loadApplicationDetails()
      }

      if (onReviewComplete) {
        onReviewComplete()
      }
    } catch (error) {
      console.error('Review failed:', error)
      message.error(error.message || 'Failed to review application')
    } finally {
      setReviewing(false)
    }
  }

  const handleConfirmReview = (values) => {
    const decisionValue = values?.decision || decision
    const decisionLabel = decisionValue === 'approve'
      ? 'approve'
      : decisionValue === 'reject'
        ? 'reject'
        : 'request changes for'
    Modal.confirm({
      title: 'Submit Review?',
      content: `You are about to ${decisionLabel} this application. Do you want to continue?`,
      okText: 'Yes, submit',
      cancelText: 'Cancel',
      onOk: () => handleReview(values)
    })
  }

  // Helper Functions
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A'
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatBoolean = (value) => {
    if (value === true || value === 'yes' || value === 'Yes') return <Tag color="success">Yes</Tag>
    if (value === false || value === 'no' || value === 'No') return <Tag color="default">No</Tag>
    return 'N/A'
  }

  const formatBusinessType = (type) => {
    if (!type) return 'N/A'
    return getBusinessTypeLabel(type)
  }

  const formatRegistrationType = (type) => {
    if (!type) return 'N/A'
    const typeMap = {
      'sole_proprietorship': 'Sole Proprietorship',
      'partnership': 'Partnership',
      'corporation': 'Corporation',
      'cooperative': 'Cooperative'
    }
    return typeMap[type] || type
  }

  const formatRiskLevel = (level) => {
    if (!level) return 'N/A'
    const colorMap = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error'
    }
    const textMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High'
    }
    return <Tag color={colorMap[level]}>{textMap[level] || level}</Tag>
  }

  const formatAddress = (location) => {
    if (!location) return 'N/A'
    const parts = [
      location.unitBuildingName,
      location.street,
      location.barangay,
      location.city || location.cityMunicipality,
      location.province,
      location.zipCode
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'submitted': { color: 'processing', text: 'Pending Review' },
      'resubmit': { color: 'processing', text: 'Resubmit' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Needs Revision' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // Document Viewer Helper Component
  const DocumentViewer = ({ url, label, showLabel = false, size = 'default' }) => {
    if (!url || url.trim() === '') {
      return <Text type="secondary">Not Available</Text>
    }

    // Resolve IPFS URL to gateway URL if needed
    const resolvedUrl = resolveIpfsUrl(url)
    if (!resolvedUrl) {
      return <Text type="secondary">Not Available</Text>
    }

    const getFileType = (url) => {
      if (!url) return 'unknown'
      const lowerUrl = url.toLowerCase()
      // Check for PDF
      if (lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf')) return 'pdf'
      // Check for images
      if (lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) || 
          lowerUrl.includes('image/')) return 'image'
      return 'other'
    }

    const fileType = getFileType(resolvedUrl)
    const isImage = fileType === 'image'
    const isPdf = fileType === 'pdf'

    const getFileIcon = () => {
      if (isImage) return <FileImageOutlined style={{ color: token.colorSuccess }} />
      if (isPdf) return <FilePdfOutlined style={{ color: token.colorError }} />
      return <FileOutlined style={{ color: token.colorTextSecondary }} />
    }

    if (isImage) {
      return (
        <Space>
          <Image
            src={resolvedUrl}
            alt={label || 'Document'}
            width={size === 'small' ? 80 : size === 'large' ? 200 : 120}
            height={size === 'small' ? 80 : size === 'large' ? 200 : 120}
            style={{
              objectFit: 'cover',
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorderSecondary}`,
              cursor: 'pointer'
            }}
            preview={{
              mask: (
                <Space direction="vertical" size="small">
                  <EyeOutlined style={{ fontSize: 16 }} />
                  <Text style={{ fontSize: 12, color: '#fff' }}>Preview</Text>
                </Space>
              )
            }}
          />
          {showLabel && label && (
            <Space direction="vertical" size="small">
              <Text strong>{label}</Text>
              <Button
                type="link"
                icon={<DownloadOutlined />}
                href={resolvedUrl}
                download
                size="small"
              >
                Download
              </Button>
            </Space>
          )}
        </Space>
      )
    }

    if (isPdf) {
      return (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {showLabel && label && <Text strong>{label}</Text>}
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => {
                const modal = Modal.info({
                  title: label || 'PDF Document',
                  width: '90%',
                  style: { top: 20 },
                  content: (
                    <iframe
                      src={resolvedUrl}
                      style={{
                        width: '100%',
                        height: '80vh',
                        border: 'none',
                        borderRadius: token.borderRadius
                      }}
                      title={label || 'PDF Document'}
                    />
                  ),
                  footer: (
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        href={resolvedUrl}
                        download
                      >
                        Download PDF
                      </Button>
                      <Button onClick={() => modal.destroy()}>Close</Button>
                    </Space>
                  )
                })
              }}
            >
              View PDF
            </Button>
            <Button
              icon={<DownloadOutlined />}
              href={resolvedUrl}
              download
            >
              Download
            </Button>
          </Space>
        </Space>
      )
    }

    // Other file types
    return (
      <Space>
        {getFileIcon()}
        <Button
          type="link"
          icon={<EyeOutlined />}
          href={resolvedUrl}
          target="_blank"
        >
          View
        </Button>
        <Button
          type="link"
          icon={<DownloadOutlined />}
          href={resolvedUrl}
          download
        >
          Download
        </Button>
      </Space>
    )
  }

  const canReview = application?.status === 'submitted' ||
    application?.status === 'resubmit' ||
    application?.status === 'under_review' ||
    application?.status === 'needs_revision'
  const isFinalDecision = application?.status === 'approved' || application?.status === 'rejected'

  const ownerIdentity = application?.ownerIdentity || {}
  const businessReg = application?.businessRegistration || {}
  const location = application?.location || {}
  const riskProfile = application?.riskProfile || {}
  const birRegistration = application?.birRegistration || {}
  const otherAgencies = application?.otherAgencyRegistrations || {}
  const requirementsChecklist = application?.requirementsChecklist || {}

  const documentList = [
    { key: 'idPicture', label: '2x2 ID Picture', url: resolveIpfsUrl(application?.documents?.idPicture) },
    { key: 'ctc', label: 'Community Tax Certificate', url: resolveIpfsUrl(application?.documents?.ctc) },
    { key: 'barangayClearance', label: 'Barangay Business Clearance', url: resolveIpfsUrl(application?.documents?.barangayClearance) },
    { key: 'dtiSecCda', label: 'DTI/SEC/CDA Registration', url: resolveIpfsUrl(application?.documents?.dtiSecCda) },
    { key: 'leaseOrLandTitle', label: 'Lease Contract or Land Title', url: resolveIpfsUrl(application?.documents?.leaseOrLandTitle) },
    { key: 'occupancyPermit', label: 'Certificate of Occupancy', url: resolveIpfsUrl(application?.documents?.occupancyPermit) },
    { key: 'healthCertificate', label: 'Health Certificate', url: resolveIpfsUrl(application?.documents?.healthCertificate) }
  ]

  const aiValidation = application?.aiValidation

  // Render Review & Decision Panel
  const renderReviewPanel = () => (
    <Card
      title={
        <Space>
          <EditOutlined style={{ color: token.colorPrimary }} />
          <Text strong>Review & Decision</Text>
        </Space>
      }
      style={{
        height: '100%',
        position: 'sticky',
        top: 0,
        boxShadow: token.boxShadowSecondary,
        border: `1px solid ${token.colorBorderSecondary}`
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Status Display */}
        <div style={{ 
          textAlign: 'center', 
          padding: '20px 16px', 
          borderBottom: `2px solid ${token.colorBorderSecondary}`,
          background: token.colorFillAlter,
          borderRadius: token.borderRadius,
          marginBottom: 16
        }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Current Status
          </Text>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {getStatusTag(application?.status)}
          </div>
          {application?.reviewedAt && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
              Review started: {formatDate(application.reviewedAt)}
            </Text>
          )}
        </div>

        {/* Application Info */}
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Reference Number">
            <Text copyable strong style={{ fontFamily: 'monospace', fontSize: 14, color: token.colorPrimary }}>
              {application?.applicationReferenceNumber || 'N/A'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Business Owner">
            <Text strong>
              {ownerIdentity.fullName || 
               businessReg.ownerFullName || 
               application?.businessOwner?.name || 
               'N/A'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Application Type">
            <Tag color={application?.applicationType === 'new_registration' ? 'blue' : 'cyan'}>
              {application?.applicationType === 'new_registration' ? 'New Registration' : 'Renewal'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted Date">
            {formatDate(application?.submittedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Created Date">
            {formatDate(application?.createdAt)}
          </Descriptions.Item>
        </Descriptions>

        {/* AI Validation Summary */}
        {aiValidation?.completed && (
          <Card 
            size="small" 
            style={{ 
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <RobotOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 13 }}>AI Validation Status</Text>
              </Space>
              <Badge
                status={
                  aiValidation.results?.overallStatus === 'pass' ? 'success' :
                  aiValidation.results?.overallStatus === 'warning' ? 'warning' : 'error'
                }
                text={
                  aiValidation.results?.overallStatus === 'pass' ? 'Pass' :
                  aiValidation.results?.overallStatus === 'warning' ? 'Warning' : 'Fail'
                }
                style={{ fontSize: 13 }}
              />
              {aiValidation.results?.overallStatus !== 'pass' && (
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  Review AI validation tab for details
                </Text>
              )}
            </Space>
          </Card>
        )}

        {/* Review Form */}
        {!canReview ? (
          <Alert
            message={`Application is ${application?.status}`}
            description="This application cannot be reviewed as it has already reached a final decision."
            type="info"
            showIcon
          />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleConfirmReview}
          >
            <Form.Item
              label={<Text strong style={{ fontSize: 14 }}>Decision</Text>}
              name="decision"
              rules={[{ required: true, message: 'Please select a decision' }]}
            >
              <Radio.Group onChange={handleDecisionChange} value={decision} style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div
                    onClick={() => {
                      setDecision('approve')
                      form.setFieldsValue({ decision: 'approve' })
                    }}
                    style={{
                      border: decision === 'approve' ? `2px solid ${token.colorSuccess}` : `1px solid ${token.colorBorderSecondary}`,
                      background: decision === 'approve' ? token.colorSuccessBg : token.colorFillAlter,
                      borderRadius: token.borderRadius,
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      width: '100%'
                    }}
                  >
                    <Radio value="approve" style={{ marginRight: 12 }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
                        <Text strong style={{ fontSize: 14, color: decision === 'approve' ? token.colorSuccess : undefined }}>
                          Approve Application
                        </Text>
                      </Space>
                    </Radio>
                  </div>
                  <div
                    onClick={() => {
                      setDecision('reject')
                      form.setFieldsValue({ decision: 'reject' })
                    }}
                    style={{
                      border: decision === 'reject' ? `2px solid ${token.colorError}` : `1px solid ${token.colorBorderSecondary}`,
                      background: decision === 'reject' ? token.colorErrorBg : token.colorFillAlter,
                      borderRadius: token.borderRadius,
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      width: '100%'
                    }}
                  >
                    <Radio value="reject" style={{ marginRight: 12 }}>
                      <Space>
                        <CloseCircleOutlined style={{ color: token.colorError, fontSize: 18 }} />
                        <Text strong style={{ fontSize: 14, color: decision === 'reject' ? token.colorError : undefined }}>
                          Reject Application
                        </Text>
                      </Space>
                    </Radio>
                  </div>
                  <div
                    onClick={() => {
                      setDecision('request_changes')
                      form.setFieldsValue({ decision: 'request_changes' })
                    }}
                    style={{
                      border: decision === 'request_changes' ? `2px solid ${token.colorWarning}` : `1px solid ${token.colorBorderSecondary}`,
                      background: decision === 'request_changes' ? token.colorWarningBg : token.colorFillAlter,
                      borderRadius: token.borderRadius,
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      width: '100%'
                    }}
                  >
                    <Radio value="request_changes" style={{ marginRight: 12 }}>
                      <Space>
                        <EditOutlined style={{ color: token.colorWarning, fontSize: 18 }} />
                        <Text strong style={{ fontSize: 14, color: decision === 'request_changes' ? token.colorWarning : undefined }}>
                          Request Changes
                        </Text>
                      </Space>
                    </Radio>
                  </div>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label={<Text strong style={{ fontSize: 14 }}>Comments</Text>}
              name="comments"
              rules={[{ required: true, message: 'Comments are required' }]}
            >
              <TextArea
                rows={4}
                placeholder="Enter your review comments..."
                style={{ fontSize: 13 }}
              />
            </Form.Item>

            {decision === 'reject' && (
              <Form.Item
                label={<Text strong style={{ fontSize: 14 }}>Rejection Reason</Text>}
                name="rejectionReason"
                rules={[{ required: true, message: 'Rejection reason is required' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Please specify the reason for rejection..."
                  style={{ fontSize: 13 }}
                />
              </Form.Item>
            )}

            {decision === 'request_changes' && (
              <>
                <Alert
                  message="Request Changes"
                  description="The applicant will be notified to make corrections and resubmit the application. Please specify the required changes in the comments field below."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form.Item
                  label={<Text strong style={{ fontSize: 14 }}>Required Changes Message</Text>}
                  name="requestChangesMessage"
                  rules={[{ required: true, message: 'Please specify what changes are needed' }]}
                  tooltip="This message will be sent to the applicant along with your comments"
                >
                  <TextArea
                    rows={3}
                    placeholder="Specify what changes are needed (e.g., 'Please update the business address', 'Missing document: Health Certificate', etc.)..."
                    style={{ fontSize: 13 }}
                  />
                </Form.Item>
              </>
            )}

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={reviewing}
                block
                size="large"
                icon={decision === 'approve' ? <CheckCircleOutlined /> : decision === 'reject' ? <CloseCircleOutlined /> : <EditOutlined />}
                style={{
                  background: decision === 'approve' ? token.colorSuccess :
                              decision === 'reject' ? token.colorError :
                              decision === 'request_changes' ? token.colorWarning :
                              token.colorPrimary,
                  borderColor: decision === 'approve' ? token.colorSuccess :
                              decision === 'reject' ? token.colorError :
                              decision === 'request_changes' ? token.colorWarning :
                              token.colorPrimary,
                  height: 42,
                  fontSize: 15,
                  fontWeight: 600
                }}
              >
                Submit Review
              </Button>
              <Button
                onClick={onClose}
                block
                size="large"
                style={{ marginTop: 12 }}
              >
                Cancel
              </Button>
            </Form.Item>
          </Form>
        )}
      </Space>
    </Card>
  )

  // Render Summary Bar
  const renderSummaryBar = () => {
    const ownerName = ownerIdentity.fullName || 
                     businessReg.ownerFullName || 
                     application?.businessOwner?.name || 
                     'N/A'
    
    return (
      <Card
        style={{
          marginBottom: 24,
          background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: token.boxShadowTertiary
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Application Reference
              </Text>
              <Text
                copyable={{
                  text: application?.applicationReferenceNumber || '',
                  tooltips: ['Copy Reference', 'Copied!']
                }}
                strong
                style={{
                  fontFamily: 'monospace',
                  fontSize: 15,
                  color: token.colorPrimary,
                  display: 'block',
                  wordBreak: 'break-all'
                }}
              >
                {application?.applicationReferenceNumber || 'N/A'}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Business Name
              </Text>
              <Space wrap>
                <ShopOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 13, wordBreak: 'break-word' }}>
                  {businessReg.registeredBusinessName || application?.businessName || 'N/A'}
                </Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Business Owner
              </Text>
              <Space wrap>
                <UserOutlined style={{ color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 13, wordBreak: 'break-word' }}>
                  {ownerName}
                </Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Current Status
              </Text>
              <div style={{ fontSize: 14 }}>
                {getStatusTag(application?.status)}
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Application Type
              </Text>
              <Tag color={application?.applicationType === 'new_registration' ? 'blue' : 'cyan'} style={{ fontSize: 12 }}>
                {application?.applicationType === 'new_registration' ? 'New Registration' : 'Renewal'}
              </Tag>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Submitted Date
              </Text>
              <Text style={{ fontSize: 12 }}>
                {formatDate(application?.submittedAt)}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                AI Validation
              </Text>
              {aiValidation?.completed ? (
                <Badge
                  status={
                    aiValidation.results?.overallStatus === 'pass' ? 'success' :
                    aiValidation.results?.overallStatus === 'warning' ? 'warning' : 'error'
                  }
                  text={
                    aiValidation.results?.overallStatus === 'pass' ? 'Pass' :
                    aiValidation.results?.overallStatus === 'warning' ? 'Warning' : 'Fail'
                  }
                  style={{ fontSize: 12 }}
                />
              ) : (
                <Badge status="default" text="Not Validated" style={{ fontSize: 12 }} />
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    )
  }

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: token.colorPrimary }} />
          <Text strong style={{ fontSize: 18 }}>Application Review</Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1400}
      style={{ top: 20 }}
    >
      <Spin spinning={loading || startingReview}>
        {isFinalDecision && (
          <Alert
            message={`Application has been ${application.status === 'approved' ? 'approved' : 'rejected'}`}
            type={application.status === 'approved' ? 'success' : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Summary Bar */}
        {renderSummaryBar()}

        <Row gutter={[24, 24]} style={{ minHeight: 600 }}>
          {/* Left Column - Information Tabs (70%) */}
          <Col xs={24} lg={17}>
            <Tabs
              defaultActiveKey="owner" 
              type="card"
              style={{ 
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                padding: '20px',
                boxShadow: token.boxShadowTertiary
              }}
              items={[
            {
              key: 'owner',
              label: <span><UserOutlined />Owner Information</span>,
              children: (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card 
                title={
                  <Space>
                    <UserOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Owner Identity (From Business Profile)</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Full Name" span={2}>
                    <Text strong>
                      {ownerIdentity.fullName || 
                       application?.businessOwner?.name || 
                       'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Date of Birth" span={1}>
                    {formatDate(ownerIdentity.dateOfBirth)}
                  </Descriptions.Item>
                  <Descriptions.Item label="ID Type" span={1}>
                    {ownerIdentity.idType || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="ID Number" span={1}>
                    {ownerIdentity.idNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="ID Document" span={1}>
                    <DocumentViewer url={resolveIpfsUrl(ownerIdentity.idFileUrl)} label="ID Document" />
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card 
                title={
                  <Space>
                    <UserOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Business Owner Details (From Registration)</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Owner Full Name" span={2}>
                    <Text strong>
                      {businessReg.ownerFullName || 
                       ownerIdentity.fullName || 
                       application?.businessOwner?.name || 
                       'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Position">
                    {businessReg.ownerPosition || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nationality">
                    {businessReg.ownerNationality || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Residential Address" span={2}>
                    {businessReg.ownerResidentialAddress || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Owner TIN">
                    {businessReg.ownerTin || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Government ID Type">
                    {businessReg.governmentIdType || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Government ID Number">
                    {businessReg.governmentIdNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email Address">
                    {businessReg.emailAddress || application?.businessOwner?.email || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mobile Number">
                    {businessReg.mobileNumber || application?.businessOwner?.phoneNumber || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Space>
              )
            },
            {
              key: 'business',
              label: <span><ShopOutlined />Business Details</span>,
              children: (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card 
                title={
                  <Space>
                    <ShopOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Business Registration Information</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Registered Business Name" span={2}>
                    <Text strong>{businessReg.registeredBusinessName || application?.businessName || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trade Name">
                    {businessReg.businessTradeName || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Type">
                    {formatRegistrationType(businessReg.businessRegistrationType)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Number">
                    {businessReg.businessRegistrationNumber || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Date">
                    {formatDate(businessReg.businessRegistrationDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Registration Agency">
                    {businessReg.registrationAgency || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Type">
                    {formatBusinessType(businessReg.businessType)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Classification">
                    {businessReg.businessClassification || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Industry Category">
                    {businessReg.industryCategory || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Primary Line of Business" span={2}>
                    {businessReg.primaryLineOfBusiness || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card 
                title={
                  <Space>
                    <ShopOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Business Operations</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Number of Employees">
                    {businessReg.numberOfEmployees || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Number of Business Units">
                    {businessReg.numberOfBusinessUnits || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="With Food Handlers">
                    {formatBoolean(businessReg.withFoodHandlers)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Start Date">
                    {formatDate(businessReg.businessStartDate)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card 
                title={
                  <Space>
                    <BankOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Financial Information</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Declared Capital Investment">
                    {formatCurrency(businessReg.declaredCapitalInvestment)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax Identification Number (TIN)">
                    {businessReg.ownerTin || application?.businessDetails?.taxIdentificationNumber || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card 
                title={
                  <Space>
                    <FileTextOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Declaration</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Declarant Name">
                    {businessReg.declarantName || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Declaration Date">
                    {formatDate(businessReg.declarationDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Certification Accepted">
                    {formatBoolean(businessReg.certificationAccepted)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Space>
              )
            },
            {
              key: 'location',
              label: <span><EnvironmentOutlined />Location</span>,
              children: (
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>Business Location</Text>
                </Space>
              }
              style={{
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`
              }}
            >
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Complete Address" span={2}>
                  <Text strong>{formatAddress(location)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Unit/Building Name">
                  {location.unitBuildingName || location.businessAddress || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Street">
                  {location.street || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Barangay">
                  {location.barangay || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="City/Municipality">
                  {location.city || location.cityMunicipality || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Province">
                  {location.province || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Zip Code">
                  {location.zipCode || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Business Location Type">
                  {location.businessLocationType ? (
                    <Tag color={location.businessLocationType === 'owned' ? 'success' : 'default'}>
                      {location.businessLocationType === 'owned' ? 'Owned' : 'Leased'}
                    </Tag>
                  ) : 'N/A'}
                </Descriptions.Item>
                {location.geolocation && (location.geolocation.lat || location.geolocation.lng) && (
                  <>
                    <Descriptions.Item label="Latitude">
                      {location.geolocation.lat || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Longitude">
                      {location.geolocation.lng || 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
                {location.mailingAddress && (
                  <Descriptions.Item label="Mailing Address (if different)" span={2}>
                    {location.mailingAddress}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
              )
            },
            {
              key: 'documents',
              label: <span><FileTextOutlined />Documents</span>,
              children: (
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>Required Documents</Text>
                </Space>
              }
              style={{
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Click on any document to preview. Use the download button to save files.
                </Text>
                {documentList.length > 0 ? (
                  <Image.PreviewGroup>
                    <Row gutter={[16, 16]}>
                      {documentList.map((item) => {
                        const isImage = item.url && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(item.url)
                        const isPdf = item.url && /\.pdf$/i.test(item.url)
                        
                        return (
                          <Col xs={24} sm={12} md={8} lg={6} key={item.key}>
                            <Card
                              hoverable
                              style={{
                                border: item.url ? `2px solid ${token.colorBorder}` : `2px dashed ${token.colorBorderSecondary}`,
                                borderRadius: token.borderRadiusLG,
                                background: item.url ? token.colorBgContainer : token.colorFillAlter
                              }}
                              bodyStyle={{ padding: 16 }}
                            >
                              <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                                {item.url ? (
                                  <>
                                    {isImage ? (
                                      <Image
                                        src={item.url}
                                        alt={item.label}
                                        width="100%"
                                        height={150}
                                        style={{
                                          objectFit: 'cover',
                                          borderRadius: token.borderRadius,
                                          border: `1px solid ${token.colorBorderSecondary}`
                                        }}
                                        preview={{
                                          mask: (
                                            <Space direction="vertical" size="small">
                                              <EyeOutlined style={{ fontSize: 20 }} />
                                              <Text style={{ fontSize: 12, color: '#fff' }}>Preview</Text>
                                            </Space>
                                          )
                                        }}
                                      />
                                    ) : isPdf ? (
                                      <div
                                        style={{
                                          width: '100%',
                                          height: 150,
                                          background: token.colorFillAlter,
                                          borderRadius: token.borderRadius,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          border: `1px solid ${token.colorBorderSecondary}`
                                        }}
                                      >
                                        <FilePdfOutlined style={{ fontSize: 48, color: token.colorError }} />
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          width: '100%',
                                          height: 150,
                                          background: token.colorFillAlter,
                                          borderRadius: token.borderRadius,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          border: `1px solid ${token.colorBorderSecondary}`
                                        }}
                                      >
                                        <FileOutlined style={{ fontSize: 48, color: token.colorTextSecondary }} />
                                      </div>
                                    )}
                                    <div>
                                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />
                                        <Text strong style={{ fontSize: 13, display: 'block' }}>
                                          {item.label}
                                        </Text>
                                        <Space size="small">
                                          {isPdf && (
                                            <Button
                                              type="primary"
                                              size="small"
                                              icon={<EyeOutlined />}
                                              onClick={() => {
                                                const modal = Modal.info({
                                                  title: item.label,
                                                  width: '90%',
                                                  style: { top: 20 },
                                                  content: (
                                                    <iframe
                                                      src={item.url}
                                                      style={{
                                                        width: '100%',
                                                        height: '80vh',
                                                        border: 'none',
                                                        borderRadius: token.borderRadius
                                                      }}
                                                      title={item.label}
                                                    />
                                                  ),
                                                  footer: (
                                                    <Space>
                                                      <Button
                                                        icon={<DownloadOutlined />}
                                                        href={item.url}
                                                        download
                                                      >
                                                        Download PDF
                                                      </Button>
                                                      <Button onClick={() => modal.destroy()}>Close</Button>
                                                    </Space>
                                                  )
                                                })
                                              }}
                                            >
                                              View PDF
                                            </Button>
                                          )}
                                          <Button
                                            type="link"
                                            size="small"
                                            icon={<DownloadOutlined />}
                                            href={item.url}
                                            download
                                          >
                                            Download
                                          </Button>
                                        </Space>
                                      </Space>
                                    </div>
                                  </>
                                ) : (
                                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <CloseCircleOutlined style={{ color: token.colorError, fontSize: 32 }} />
                                    <Text type="danger" strong style={{ fontSize: 13 }}>
                                      {item.label}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      Not Uploaded
                                    </Text>
                                  </Space>
                                )}
                              </Space>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  </Image.PreviewGroup>
                ) : (
                  <Alert message="No documents uploaded" type="info" />
                )}
              </Space>
            </Card>
              )
            },
            {
              key: 'bir',
              label: <span><BankOutlined />BIR Registration</span>,
              children: (
            <Card
              title={
                <Space>
                  <BankOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>BIR Registration</Text>
                </Space>
              }
              style={{
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`
              }}
            >
              <Descriptions bordered column={2} size="middle">
                {birRegistration.registrationNumber && (
                  <Descriptions.Item label="Registration Number">
                    {birRegistration.registrationNumber}
                  </Descriptions.Item>
                )}
                {birRegistration.certificateUrl && (
                  <Descriptions.Item label="BIR Certificate of Registration" span={2}>
                    <DocumentViewer url={resolveIpfsUrl(birRegistration.certificateUrl)} label="BIR Certificate of Registration" />
                  </Descriptions.Item>
                )}
                {birRegistration.booksOfAccountsUrl && (
                  <Descriptions.Item label="Registration of Books of Accounts" span={2}>
                    <DocumentViewer url={resolveIpfsUrl(birRegistration.booksOfAccountsUrl)} label="Registration of Books of Accounts" />
                  </Descriptions.Item>
                )}
                {birRegistration.authorityToPrintUrl && (
                  <Descriptions.Item label="Authority to Print Official Receipts and Invoices" span={2}>
                    <DocumentViewer url={resolveIpfsUrl(birRegistration.authorityToPrintUrl)} label="Authority to Print Official Receipts and Invoices" />
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
              )
            },
            {
              key: 'agencies',
              label: <span><SafetyOutlined />Other Agency Registrations</span>,
              children: (
            <Card
              title={
                <Space>
                  <SafetyOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>Other Agency Registrations</Text>
                </Space>
              }
              style={{
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`
              }}
            >
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Has Employees">
                  {formatBoolean(otherAgencies.hasEmployees)}
                </Descriptions.Item>
              </Descriptions>

              <Divider>SSS Registration</Divider>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Registered">
                  {formatBoolean(otherAgencies.sss?.registered)}
                </Descriptions.Item>
                <Descriptions.Item label="Proof Document">
                  <DocumentViewer url={resolveIpfsUrl(otherAgencies.sss?.proofUrl)} label="SSS Proof Document" />
                </Descriptions.Item>
              </Descriptions>

              <Divider>PhilHealth Registration</Divider>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Registered">
                  {formatBoolean(otherAgencies.philhealth?.registered)}
                </Descriptions.Item>
                <Descriptions.Item label="Proof Document">
                  <DocumentViewer url={resolveIpfsUrl(otherAgencies.philhealth?.proofUrl)} label="PhilHealth Proof Document" />
                </Descriptions.Item>
              </Descriptions>

              <Divider>Pag-IBIG Registration</Divider>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Registered">
                  {formatBoolean(otherAgencies.pagibig?.registered)}
                </Descriptions.Item>
                <Descriptions.Item label="Proof Document">
                  <DocumentViewer url={resolveIpfsUrl(otherAgencies.pagibig?.proofUrl)} label="Pag-IBIG Proof Document" />
                </Descriptions.Item>
              </Descriptions>
            </Card>
              )
            },
            {
              key: 'risk',
              label: <span><SafetyCertificateOutlined />Risk Profile & Compliance</span>,
              children: (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card 
                title={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Risk Profile</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Risk Level">
                    {formatRiskLevel(riskProfile.riskLevel)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Size">
                    {riskProfile.businessSize || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Annual Revenue">
                    {formatCurrency(riskProfile.annualRevenue)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Business Activities Description" span={2}>
                    {riskProfile.businessActivitiesDescription || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card 
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>Requirements Checklist</Text>
                  </Space>
                }
                style={{
                  boxShadow: token.boxShadowSecondary,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
              >
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Requirements Confirmed">
                    {formatBoolean(requirementsChecklist.confirmed)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Confirmed At">
                    {formatDate(requirementsChecklist.confirmedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="PDF Downloaded">
                    {formatBoolean(requirementsChecklist.pdfDownloaded)}
                  </Descriptions.Item>
                  <Descriptions.Item label="PDF Downloaded At">
                    {formatDate(requirementsChecklist.pdfDownloadedAt)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Space>
              )
            },
            {
              key: 'ai',
              label: <span><RobotOutlined />AI Validation</span>,
              children: (
            <Card
              title={
                <Space>
                  <RobotOutlined style={{ color: token.colorPrimary }} />
                  <Text strong>AI Validation Results</Text>
                </Space>
              }
              style={{
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {aiValidation?.completed ? (
                  <>
                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Validated on: {formatDate(aiValidation.completedAt)}
                      </Text>
                    </div>

                    <Divider />

                    <div>
                      <Text strong>Overall Status: </Text>
                      <Badge
                        status={
                          aiValidation.results?.overallStatus === 'pass' ? 'success' :
                          aiValidation.results?.overallStatus === 'warning' ? 'warning' : 'error'
                        }
                        text={
                          aiValidation.results?.overallStatus === 'pass' ? 'Pass' :
                          aiValidation.results?.overallStatus === 'warning' ? 'Warning' : 'Fail'
                        }
                        style={{ marginLeft: 8 }}
                      />
                    </div>

                    {aiValidation.results?.documentCompleteness && (
                      <Card size="small" title="Document Completeness">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text>Score: {aiValidation.results.documentCompleteness.score || 0}%</Text>
                          {aiValidation.results.documentCompleteness.issues?.length > 0 && (
                            <div>
                              <Text strong>Issues:</Text>
                              <ul style={{ marginTop: 8 }}>
                                {aiValidation.results.documentCompleteness.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Space>
                      </Card>
                    )}

                    {aiValidation.results?.consistency && (
                      <Card size="small" title="Consistency Check">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text>Score: {aiValidation.results.consistency.score || 0}%</Text>
                          {aiValidation.results.consistency.issues?.length > 0 && (
                            <div>
                              <Text strong>Issues:</Text>
                              <ul style={{ marginTop: 8 }}>
                                {aiValidation.results.consistency.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Space>
                      </Card>
                    )}

                    {aiValidation.results?.anomalies?.length > 0 && (
                      <Card size="small" title="Anomalies Detected" style={{ borderColor: '#ff4d4f' }}>
                        <ul>
                          {aiValidation.results.anomalies.map((anomaly, idx) => (
                            <li key={idx} style={{ color: '#ff4d4f' }}>{anomaly}</li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {aiValidation.results?.riskFlags?.length > 0 && (
                      <Card size="small" title="Risk Flags" style={{ borderColor: '#faad14' }}>
                        <ul>
                          {aiValidation.results.riskFlags.map((flag, idx) => (
                            <li key={idx} style={{ color: '#faad14' }}>{flag}</li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </>
                ) : (
                  <Alert
                    message="AI Validation Not Completed"
                    description="This application has not been validated by AI yet."
                    type="info"
                    icon={<RobotOutlined />}
                  />
                )}
              </Space>
            </Card>
              )
            },
          ]}
            />
          </Col>

          {/* Right Column - Review & Decision Panel (30%) */}
          <Col xs={24} lg={7}>
            {renderReviewPanel()}
          </Col>
        </Row>
      </Spin>
    </Modal>
  )
}
