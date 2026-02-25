import React, { useState, useEffect } from 'react'
import { Typography, Tag, Button, Descriptions, Space, theme, Empty, Form, Radio, Input, Alert, Badge, Spin, Tabs, Image, Modal, App, Collapse } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  RobotOutlined,
  UserOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileOutlined
} from '@ant-design/icons'
import { PermitApplicationService } from '@/features/lgu-officer/infrastructure/services'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import { getBusinessTypeLabel } from '@/constants/businessTypes'
import OwnerPersonalInfoSection from './OwnerPersonalInfoSection'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { TextArea } = Input

export default function ApplicationDetailPanel({
  application: initialApplication,
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
    if (initialApplication) {
      setApplication(initialApplication)
      loadApplicationDetails()
      setDecision(null)
      form.resetFields()
      handleStartReview()
    }
  }, [initialApplication?.applicationId])

  const handleStartReview = async () => {
    if (!initialApplication?.applicationId) return
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
        await loadApplicationDetails()
      }
    } catch (error) {
      console.error('Failed to start review:', error)
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

      if (result?.application) {
        setApplication(result.application)
      } else {
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

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return dayjs(date).format('YYYY-MM-DD HH:mm')
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
    const colorMap = { 'low': 'success', 'medium': 'warning', 'high': 'error' }
    const textMap = { 'low': 'Low', 'medium': 'Medium', 'high': 'High' }
    return <Tag color={colorMap[level]}>{textMap[level] || level}</Tag>
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

  const DocumentViewer = ({ url, label }) => {
    if (!url || url.trim() === '') {
      return <Text type="secondary">Not uploaded</Text>
    }

    const resolvedUrl = resolveIpfsUrl(url)
    if (!resolvedUrl) {
      return <Text type="secondary">Not available</Text>
    }

    const isImage = resolvedUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    const isPdf = resolvedUrl.toLowerCase().includes('.pdf')

    if (isImage) {
      return (
        <Image
          src={resolvedUrl}
          alt={label || 'Document'}
          width={100}
          height={100}
          style={{ objectFit: 'cover', borderRadius: token.borderRadius, border: `1px solid ${token.colorBorderSecondary}` }}
          preview={{ mask: <EyeOutlined /> }}
        />
      )
    }

    if (isPdf) {
      return (
        <Space>
          <FilePdfOutlined style={{ color: token.colorError }} />
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(resolvedUrl, '_blank')}
          >
            View PDF
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} href={resolvedUrl} download>
            Download
          </Button>
        </Space>
      )
    }

    return (
      <Space>
        <FileOutlined />
        <Button type="link" size="small" icon={<EyeOutlined />} href={resolvedUrl} target="_blank">
          View
        </Button>
      </Space>
    )
  }

  if (!initialApplication) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select an application to view details</Text>}
        />
      </div>
    )
  }

  const reviewableStatuses = ['submitted', 'resubmit', 'under_review', 'needs_revision', 'pending_review']
  const canReview = reviewableStatuses.includes(application?.status)
  const isFinalDecision = application?.status === 'approved' || application?.status === 'rejected'
  const isDraft = ['draft', 'requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered', 'agencies_registered'].includes(application?.status)

  const ownerIdentity = application?.ownerIdentity || {}
  const businessReg = application?.businessRegistration || {}
  const location = application?.location || {}
  const riskProfile = application?.riskProfile || {}
  const birRegistration = application?.birRegistration || {}
  const otherAgencies = application?.otherAgencyRegistrations || {}
  const documents = application?.documents || {}
  const aiValidation = application?.aiValidation

  const ownerName = ownerIdentity.fullName || 
                   businessReg.ownerFullName || 
                   application?.businessOwner?.name || 
                   'N/A'

  const requirementsChecklist = application?.requirementsChecklist || {}

  const tabItems = [
    {
      key: 'review',
      label: <span><EditOutlined /> Review</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          {/* Application Info Summary */}
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Reference Number">
              <Text copyable strong style={{ fontFamily: 'monospace', color: token.colorPrimary }}>
                {application?.applicationReferenceNumber || 'N/A'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Application Type">
              <Tag color={application?.applicationType === 'new_registration' ? 'blue' : 'cyan'}>
                {application?.applicationType === 'new_registration' ? 'New Registration' : 'Renewal'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted Date">{formatDate(application?.submittedAt)}</Descriptions.Item>
            <Descriptions.Item label="Created Date">{formatDate(application?.createdAt)}</Descriptions.Item>
          </Descriptions>

          {/* AI Validation Summary */}
          {aiValidation?.completed && (
            <div style={{ 
              background: token.colorFillAlter, 
              border: `1px solid ${token.colorBorderSecondary}`, 
              borderRadius: token.borderRadius, 
              padding: 12, 
              marginBottom: 16 
            }}>
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
                />
                {aiValidation.results?.overallStatus !== 'pass' && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Review AI validation tab for details
                  </Text>
                )}
              </Space>
            </div>
          )}

          {/* Permit Actions for Approved Applications */}
          {application?.status === 'approved' && (
            <div style={{
              background: token.colorSuccessBg,
              border: `1px solid ${token.colorSuccessBorder || token.colorSuccess}`,
              borderRadius: token.borderRadius,
              padding: 12,
              marginBottom: 16
            }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong style={{ fontSize: 13 }}>Permit Actions</Text>
                <Button
                  type="primary"
                  block
                  icon={<FileTextOutlined />}
                  onClick={() => message.success('Payment simulated. Permit issued successfully.')}
                >
                  Issue Permit (Simulate Payment)
                </Button>
              </Space>
            </div>
          )}

          {!canReview ? (
            <Alert
              message={`Application status: ${application?.status?.replace(/_/g, ' ')}`}
              description={
                isFinalDecision
                  ? "This application cannot be reviewed as it has already reached a final decision."
                  : isDraft
                    ? "This application has not been submitted yet. The business owner needs to complete and submit the application before it can be reviewed."
                    : "This application is not available for review at this time."
              }
              type={isFinalDecision ? "success" : "warning"}
              showIcon
            />
          ) : (
            <Form form={form} layout="vertical" onFinish={handleConfirmReview}>
              <Form.Item
                label={<Text strong style={{ fontSize: 13 }}>Decision</Text>}
                name="decision"
                rules={[{ required: true, message: 'Please select a decision' }]}
              >
                <Radio.Group onChange={handleDecisionChange} value={decision} style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {[
                      { value: 'approve', icon: <CheckCircleOutlined />, color: token.colorSuccess, bg: token.colorSuccessBg, label: 'Approve' },
                      { value: 'reject', icon: <CloseCircleOutlined />, color: token.colorError, bg: token.colorErrorBg, label: 'Reject' },
                      { value: 'request_changes', icon: <EditOutlined />, color: token.colorWarning, bg: token.colorWarningBg, label: 'Request Changes' },
                    ].map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => { setDecision(opt.value); form.setFieldsValue({ decision: opt.value }) }}
                        style={{
                          border: decision === opt.value ? `2px solid ${opt.color}` : `1px solid ${token.colorBorderSecondary}`,
                          background: decision === opt.value ? opt.bg : token.colorFillAlter,
                          borderRadius: token.borderRadius,
                          padding: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <Radio value={opt.value}>
                          <Space>
                            {React.cloneElement(opt.icon, { style: { color: opt.color } })}
                            <Text strong style={{ fontSize: 13 }}>{opt.label}</Text>
                          </Space>
                        </Radio>
                      </div>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item label={<Text strong style={{ fontSize: 13 }}>Comments</Text>} name="comments" rules={[{ required: true, message: 'Comments are required' }]}>
                <TextArea rows={3} placeholder="Enter your review comments..." style={{ fontSize: 13 }} />
              </Form.Item>

              {decision === 'reject' && (
                <Form.Item label={<Text strong style={{ fontSize: 13 }}>Rejection Reason</Text>} name="rejectionReason" rules={[{ required: true, message: 'Rejection reason is required' }]}>
                  <TextArea rows={2} placeholder="Please specify the reason for rejection..." style={{ fontSize: 13 }} />
                </Form.Item>
              )}

              {decision === 'request_changes' && (
                <>
                  <Alert
                    message="Request Changes"
                    description="The applicant will be notified to make corrections and resubmit the application."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Form.Item label={<Text strong style={{ fontSize: 13 }}>Required Changes</Text>} name="requestChangesMessage" rules={[{ required: true, message: 'Please specify what changes are needed' }]}>
                    <TextArea rows={2} placeholder="Specify what changes are needed..." style={{ fontSize: 13 }} />
                  </Form.Item>
                </>
              )}

              <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={reviewing}
                  block
                  icon={decision === 'approve' ? <CheckCircleOutlined /> : decision === 'reject' ? <CloseCircleOutlined /> : <EditOutlined />}
                  style={{
                    background: decision === 'approve' ? token.colorSuccess : decision === 'reject' ? token.colorError : decision === 'request_changes' ? token.colorWarning : token.colorPrimary,
                    borderColor: decision === 'approve' ? token.colorSuccess : decision === 'reject' ? token.colorError : decision === 'request_changes' ? token.colorWarning : token.colorPrimary,
                  }}
                >
                  Submit Review
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
      )
    },
    {
      key: 'owner',
      label: <span><UserOutlined /> Owner</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Owner Identity</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Full Name">{ownerIdentity.fullName || ownerName}</Descriptions.Item>
            <Descriptions.Item label="Date of Birth">{formatDate(ownerIdentity.dateOfBirth)}</Descriptions.Item>
            <Descriptions.Item label="ID Type">{ownerIdentity.idType || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="ID Number">{ownerIdentity.idNumber || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="ID Document"><DocumentViewer url={ownerIdentity.idFileUrl} label="ID Document" /></Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>Contact Information</Text>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Position">{businessReg.ownerPosition || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Nationality">{businessReg.ownerNationality || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="TIN">{businessReg.ownerTin || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Email">{businessReg.emailAddress || application?.businessOwner?.email || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{businessReg.mobileNumber || application?.businessOwner?.phoneNumber || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Residential Address">{businessReg.ownerResidentialAddress || 'N/A'}</Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'business',
      label: <span><ShopOutlined /> Business</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Registration Information</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Business Name">{businessReg.registeredBusinessName || application?.businessName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Trade Name">{businessReg.businessTradeName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Registration Type">{formatRegistrationType(businessReg.businessRegistrationType)}</Descriptions.Item>
            <Descriptions.Item label="Registration Number">{businessReg.businessRegistrationNumber || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Registration Date">{formatDate(businessReg.businessRegistrationDate)}</Descriptions.Item>
            <Descriptions.Item label="Registration Agency">{businessReg.registrationAgency || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Business Type">{getBusinessTypeLabel(businessReg.businessType) || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Business Classification">{businessReg.businessClassification || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Industry Category">{businessReg.industryCategory || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Primary Line of Business">{businessReg.primaryLineOfBusiness || 'N/A'}</Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>Operations</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Number of Employees">{businessReg.numberOfEmployees || 0}</Descriptions.Item>
            <Descriptions.Item label="Number of Business Units">{businessReg.numberOfBusinessUnits || 0}</Descriptions.Item>
            <Descriptions.Item label="With Food Handlers">{formatBoolean(businessReg.withFoodHandlers)}</Descriptions.Item>
            <Descriptions.Item label="Business Start Date">{formatDate(businessReg.businessStartDate)}</Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>Financial Information</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Declared Capital Investment">{formatCurrency(businessReg.declaredCapitalInvestment)}</Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>Declaration</Text>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Declarant Name">{businessReg.declarantName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Declaration Date">{formatDate(businessReg.declarationDate)}</Descriptions.Item>
            <Descriptions.Item label="Certification Accepted">{formatBoolean(businessReg.certificationAccepted)}</Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'location',
      label: <span><EnvironmentOutlined /> Location</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Complete Address">
              {[location.unitBuildingName, location.street, location.barangay, location.city || location.cityMunicipality, location.province, location.zipCode].filter(Boolean).join(', ') || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Unit/Building Name">{location.unitBuildingName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Street">{location.street || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Barangay">{location.barangay || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="City/Municipality">{location.city || location.cityMunicipality || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Province">{location.province || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Zip Code">{location.zipCode || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Location Type">
              {location.businessLocationType ? (
                <Tag color={location.businessLocationType === 'owned' ? 'success' : 'default'}>
                  {location.businessLocationType === 'owned' ? 'Owned' : 'Leased'}
                </Tag>
              ) : 'N/A'}
            </Descriptions.Item>
            {location.geolocation?.lat && <Descriptions.Item label="Latitude">{location.geolocation.lat}</Descriptions.Item>}
            {location.geolocation?.lng && <Descriptions.Item label="Longitude">{location.geolocation.lng}</Descriptions.Item>}
          </Descriptions>
        </div>
      )
    },
    {
      key: 'documents',
      label: <span><FileTextOutlined /> Documents</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="2x2 ID Picture"><DocumentViewer url={documents.idPicture} label="ID Picture" /></Descriptions.Item>
            <Descriptions.Item label="Community Tax Certificate"><DocumentViewer url={documents.ctc} label="CTC" /></Descriptions.Item>
            <Descriptions.Item label="Barangay Business Clearance"><DocumentViewer url={documents.barangayClearance} label="Barangay Clearance" /></Descriptions.Item>
            <Descriptions.Item label="DTI/SEC/CDA Registration"><DocumentViewer url={documents.dtiSecCda} label="DTI/SEC/CDA" /></Descriptions.Item>
            <Descriptions.Item label="Lease Contract or Land Title"><DocumentViewer url={documents.leaseOrLandTitle} label="Lease/Land Title" /></Descriptions.Item>
            <Descriptions.Item label="Certificate of Occupancy"><DocumentViewer url={documents.occupancyPermit} label="Occupancy Permit" /></Descriptions.Item>
            <Descriptions.Item label="Health Certificate"><DocumentViewer url={documents.healthCertificate} label="Health Certificate" /></Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'bir',
      label: <span><BankOutlined /> BIR</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Registration Number">{birRegistration.registrationNumber || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="BIR Certificate"><DocumentViewer url={birRegistration.certificateUrl} label="BIR Certificate" /></Descriptions.Item>
            <Descriptions.Item label="Books of Accounts"><DocumentViewer url={birRegistration.booksOfAccountsUrl} label="Books of Accounts" /></Descriptions.Item>
            <Descriptions.Item label="Authority to Print"><DocumentViewer url={birRegistration.authorityToPrintUrl} label="Authority to Print" /></Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'agencies',
      label: <span><SafetyOutlined /> Agencies</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Has Employees">{formatBoolean(otherAgencies.hasEmployees)}</Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>SSS Registration</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Registered">{formatBoolean(otherAgencies.sss?.registered)}</Descriptions.Item>
            <Descriptions.Item label="Proof Document"><DocumentViewer url={otherAgencies.sss?.proofUrl} label="SSS Proof" /></Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>PhilHealth Registration</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Registered">{formatBoolean(otherAgencies.philhealth?.registered)}</Descriptions.Item>
            <Descriptions.Item label="Proof Document"><DocumentViewer url={otherAgencies.philhealth?.proofUrl} label="PhilHealth Proof" /></Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>Pag-IBIG Registration</Text>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Registered">{formatBoolean(otherAgencies.pagibig?.registered)}</Descriptions.Item>
            <Descriptions.Item label="Proof Document"><DocumentViewer url={otherAgencies.pagibig?.proofUrl} label="Pag-IBIG Proof" /></Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'risk',
      label: <span><SafetyCertificateOutlined /> Risk</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Risk Profile</Text>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Risk Level">{formatRiskLevel(riskProfile.riskLevel)}</Descriptions.Item>
            <Descriptions.Item label="Business Size">{riskProfile.businessSize || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Annual Revenue">{formatCurrency(riskProfile.annualRevenue)}</Descriptions.Item>
            <Descriptions.Item label="Business Activities">{riskProfile.businessActivitiesDescription || 'N/A'}</Descriptions.Item>
          </Descriptions>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>Requirements Checklist</Text>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Requirements Confirmed">{formatBoolean(requirementsChecklist.confirmed)}</Descriptions.Item>
            <Descriptions.Item label="Confirmed At">{formatDate(requirementsChecklist.confirmedAt)}</Descriptions.Item>
            <Descriptions.Item label="PDF Downloaded">{formatBoolean(requirementsChecklist.pdfDownloaded)}</Descriptions.Item>
            <Descriptions.Item label="PDF Downloaded At">{formatDate(requirementsChecklist.pdfDownloadedAt)}</Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'ai',
      label: <span><RobotOutlined /> AI</span>,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          {aiValidation?.completed ? (
            <>
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Validated On">{formatDate(aiValidation.completedAt)}</Descriptions.Item>
                <Descriptions.Item label="Overall Status">
                  <Badge
                    status={aiValidation.results?.overallStatus === 'pass' ? 'success' : aiValidation.results?.overallStatus === 'warning' ? 'warning' : 'error'}
                    text={aiValidation.results?.overallStatus === 'pass' ? 'Pass' : aiValidation.results?.overallStatus === 'warning' ? 'Warning' : 'Fail'}
                  />
                </Descriptions.Item>
              </Descriptions>

              {aiValidation.results?.documentCompleteness && (
                <>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Document Completeness</Text>
                  <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="Score">{aiValidation.results.documentCompleteness.score || 0}%</Descriptions.Item>
                    {aiValidation.results.documentCompleteness.issues?.length > 0 && (
                      <Descriptions.Item label="Issues">
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {aiValidation.results.documentCompleteness.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                        </ul>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </>
              )}

              {aiValidation.results?.consistency && (
                <>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Consistency Check</Text>
                  <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="Score">{aiValidation.results.consistency.score || 0}%</Descriptions.Item>
                    {aiValidation.results.consistency.issues?.length > 0 && (
                      <Descriptions.Item label="Issues">
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {aiValidation.results.consistency.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                        </ul>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </>
              )}

              {aiValidation.results?.anomalies?.length > 0 && (
                <Alert
                  type="error"
                  message="Anomalies Detected"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {aiValidation.results.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  }
                  style={{ marginBottom: 16 }}
                />
              )}

              {aiValidation.results?.riskFlags?.length > 0 && (
                <Alert
                  type="warning"
                  message="Risk Flags"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {aiValidation.results.riskFlags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  }
                />
              )}
            </>
          ) : (
            <Alert message="AI Validation Not Completed" description="This application has not been validated by AI yet." type="info" showIcon />
          )}
        </div>
      )
    },
  ]

  const fullAddress = [location.unitBuildingName, location.street, location.barangay, location.city || location.cityMunicipality, location.province, location.zipCode].filter(Boolean).join(', ') || 'N/A'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Spin spinning={loading || startingReview}>
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 16,
              }}
            >
              <ShopOutlined />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Title level={5} style={{ margin: 0, lineHeight: 1.3 }} ellipsis={{ rows: 1 }}>
                {businessReg.registeredBusinessName || application?.businessName || 'Unnamed Business'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                {application?.applicationReferenceNumber || 'No Reference'}
              </Text>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {getStatusTag(application?.status)}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
          {isFinalDecision && (
            <Alert
              message={`Application has been ${application.status === 'approved' ? 'approved' : 'rejected'}`}
              type={application.status === 'approved' ? 'success' : 'error'}
              showIcon
              style={{ margin: 16, marginBottom: 0 }}
            />
          )}
          <Collapse
            defaultActiveKey={['owner-info']}
            ghost
            style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
            items={[
              {
                key: 'owner-info',
                label: (
                  <Text strong style={{ fontSize: 13 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    Business Owner Personal Information
                  </Text>
                ),
                children: (
                  <OwnerPersonalInfoSection
                    application={application}
                    ownerIdentity={ownerIdentity}
                    businessReg={businessReg}
                    ownerName={ownerName}
                  />
                ),
              },
            ]}
          />

          {/* Tabs */}
          <Tabs
            defaultActiveKey="review"
            size="small"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            tabBarStyle={{ padding: '0 16px', marginBottom: 0, flexShrink: 0 }}
            items={tabItems}
          />
        </div>
      </Spin>
    </div>
  )
}
