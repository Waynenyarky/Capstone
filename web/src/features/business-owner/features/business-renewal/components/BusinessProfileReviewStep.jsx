import React from 'react'
import { Card, Typography, Descriptions, Alert, Space, Button, Tag } from 'antd'
import { CheckCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { getBusinessTypeLabel } from '@/constants/businessTypes'

const { Title, Text, Paragraph } = Typography

// Helper functions for formatting
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (error) {
    return 'N/A'
  }
}

const formatDateTime = (dateValue) => {
  if (!dateValue) return 'N/A'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString('en-PH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'N/A'
  }
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return 'N/A'
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  } catch (error) {
    return 'N/A'
  }
}

const formatEnum = (value) => {
  if (!value || value === '') return 'N/A'
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const formatBoolean = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return value ? 'Yes' : 'No'
}

const getValueOrNA = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A'
  return value
}

const getStatusTag = (status) => {
  if (!status) return <Text>N/A</Text>
  
  const statusConfig = {
    'draft': { color: 'default', text: 'Draft' },
    'requirements_viewed': { color: 'processing', text: 'Requirements Viewed' },
    'form_completed': { color: 'processing', text: 'Form Completed' },
    'documents_uploaded': { color: 'processing', text: 'Documents Uploaded' },
    'bir_registered': { color: 'processing', text: 'BIR Registered' },
    'agencies_registered': { color: 'processing', text: 'Agencies Registered' },
    'submitted': { color: 'processing', text: 'Submitted' },
    'under_review': { color: 'processing', text: 'Under Review' },
    'approved': { color: 'success', text: 'Approved' },
    'rejected': { color: 'error', text: 'Rejected' },
    'needs_revision': { color: 'warning', text: 'Needs Revision' }
  }
  
  const config = statusConfig[status] || { color: 'default', text: formatEnum(status) }
  return <Tag color={config.color}>{config.text}</Tag>
}

export default function BusinessProfileReviewStep({ businessData, onConfirm, onNext }) {
  if (!businessData) {
    return (
      <Card>
        <Alert
          message="No Business Data"
          description="Business profile data is not available. Please complete business registration first."
          type="warning"
          showIcon
        />
      </Card>
    )
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    if (onNext) onNext()
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <EyeOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Review Business Profile</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Please review and confirm your business information is correct
          </Paragraph>
        </div>

        <Alert
          message="Review Your Information"
          description="Please verify that all business information displayed below is accurate. If any information needs to be updated, please contact the LGU office before proceeding with renewal."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 1. Business Information */}
          <div>
            <Title level={4}>Business Information</Title>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Business Name">
                {getValueOrNA(businessData.businessName || businessData.registeredBusinessName)}
              </Descriptions.Item>
              <Descriptions.Item label="Trade Name">
                {getValueOrNA(businessData.businessTradeName)}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                {businessData.businessType ? getBusinessTypeLabel(businessData.businessType) : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Type">
                {formatEnum(businessData.businessRegistrationType)}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Number">
                {getValueOrNA(businessData.businessRegistrationNumber)}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 2. Business Address */}
          <div>
            <Title level={4}>Business Address</Title>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Complete Address">
                {getValueOrNA(businessData.businessAddress)}
              </Descriptions.Item>
              <Descriptions.Item label="Unit / Building">
                {getValueOrNA(businessData.unitBuildingName)}
              </Descriptions.Item>
              <Descriptions.Item label="Street">
                {getValueOrNA(businessData.street || businessData.location?.street)}
              </Descriptions.Item>
              <Descriptions.Item label="Barangay">
                {getValueOrNA(businessData.barangay || businessData.location?.barangay)}
              </Descriptions.Item>
              <Descriptions.Item label="City / Municipality">
                {getValueOrNA(businessData.cityMunicipality || businessData.location?.city || businessData.location?.cityMunicipality)}
              </Descriptions.Item>
              <Descriptions.Item label="Province">
                {getValueOrNA(businessData.location?.province)}
              </Descriptions.Item>
              <Descriptions.Item label="Zip Code">
                {getValueOrNA(businessData.location?.zipCode)}
              </Descriptions.Item>
              <Descriptions.Item label="Business Location Type">
                {formatEnum(businessData.businessLocationType)}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 3. Registration Details */}
          {(businessData.registrationAgency || businessData.businessRegistrationDate || businessData.businessStartDate || businessData.taxIdentificationNumber) && (
            <div>
              <Title level={4}>Registration Details</Title>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Registration Agency">
                  {formatEnum(businessData.registrationAgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Business Registration Date">
                  {formatDate(businessData.businessRegistrationDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Business Start Date">
                  {formatDate(businessData.businessStartDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Tax Identification Number (TIN)">
                  {getValueOrNA(businessData.taxIdentificationNumber)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* 4. Owner/Proprietor Information */}
          {(businessData.ownerFullName || businessData.ownerPosition || businessData.ownerNationality || businessData.ownerTin || businessData.ownerResidentialAddress || businessData.governmentIdType || businessData.governmentIdNumber) && (
            <div>
              <Title level={4}>Owner / Proprietor Information</Title>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Full Name">
                  {getValueOrNA(businessData.ownerFullName)}
                </Descriptions.Item>
                <Descriptions.Item label="Position / Capacity">
                  {getValueOrNA(businessData.ownerPosition)}
                </Descriptions.Item>
                <Descriptions.Item label="Nationality">
                  {getValueOrNA(businessData.ownerNationality)}
                </Descriptions.Item>
                <Descriptions.Item label="Taxpayer Identification Number (TIN)">
                  {getValueOrNA(businessData.ownerTin)}
                </Descriptions.Item>
                <Descriptions.Item label="Residential Address">
                  {getValueOrNA(businessData.ownerResidentialAddress)}
                </Descriptions.Item>
                <Descriptions.Item label="Government ID Type">
                  {getValueOrNA(businessData.governmentIdType)}
                </Descriptions.Item>
                <Descriptions.Item label="Government ID Number">
                  {getValueOrNA(businessData.governmentIdNumber)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* 5. Contact Information */}
          {(businessData.emailAddress || businessData.mobileNumber || businessData.contactNumber) && (
            <div>
              <Title level={4}>Contact Information</Title>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Email Address">
                  {getValueOrNA(businessData.emailAddress)}
                </Descriptions.Item>
                <Descriptions.Item label="Mobile Number">
                  {getValueOrNA(businessData.mobileNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="Contact Number">
                  {getValueOrNA(businessData.contactNumber)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* 6. Business Details */}
          <div>
            <Title level={4}>Business Details</Title>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Nature of Business">
                {getValueOrNA(businessData.primaryLineOfBusiness || businessData.industryCategory)}
              </Descriptions.Item>
              <Descriptions.Item label="Business Classification">
                {formatEnum(businessData.businessClassification)}
              </Descriptions.Item>
              <Descriptions.Item label="Industry Category">
                {getValueOrNA(businessData.industryCategory)}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 7. Capital Investment */}
          {businessData.declaredCapitalInvestment !== undefined && businessData.declaredCapitalInvestment !== null && (
            <div>
              <Title level={4}>Capital Investment</Title>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Declared Capital Investment">
                  {formatCurrency(businessData.declaredCapitalInvestment)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* 8. Employment Information */}
          <div>
            <Title level={4}>Employment Information</Title>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Number of Employees">
                {businessData.numberOfEmployees || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Number of Branches / Business Units">
                {businessData.numberOfBranches || businessData.numberOfBusinessUnits || 0}
              </Descriptions.Item>
              <Descriptions.Item label="With Food Handlers">
                {formatEnum(businessData.withFoodHandlers)}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 9. Declaration and Certification */}
          {(businessData.declarantName || businessData.declarationDate || businessData.certificationAccepted !== undefined) && (
            <div>
              <Title level={4}>Declaration and Certification</Title>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Declarant Name">
                  {getValueOrNA(businessData.declarantName)}
                </Descriptions.Item>
                <Descriptions.Item label="Declaration Date">
                  {formatDate(businessData.declarationDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Certification Accepted">
                  {formatBoolean(businessData.certificationAccepted)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* 10. Registration Status */}
          {(businessData.applicationStatus || businessData.applicationReferenceNumber || businessData.submittedAt) && (
            <div>
              <Title level={4}>Registration Status</Title>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Application Status">
                  {getStatusTag(businessData.applicationStatus)}
                </Descriptions.Item>
                <Descriptions.Item label="Application Reference Number">
                  {getValueOrNA(businessData.applicationReferenceNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted Date">
                  {formatDateTime(businessData.submittedAt)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* 11. Branch Locations */}
          {businessData.location && (businessData.numberOfBranches > 0 || businessData.numberOfBusinessUnits > 0) && (
            <div>
              <Title level={4}>Branch Locations</Title>
              <Alert
                message="Multiple Locations"
                description={`This business has ${businessData.numberOfBranches || businessData.numberOfBusinessUnits} branch location(s). All locations will be included in the renewal.`}
                type="info"
                showIcon
              />
            </div>
          )}
        </Space>

        <div style={{ marginTop: 32, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
          >
            Confirm Information is Correct
          </Button>
        </div>
      </Card>
    </div>
  )
}
