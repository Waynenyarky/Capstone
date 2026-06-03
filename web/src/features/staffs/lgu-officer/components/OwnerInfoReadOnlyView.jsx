/**
 * Read-only owner info view that matches the business owner Settings > General tab layout:
 * Basic information, Address (separate fields), Other information — same section titles and field labels.
 * Used in the application review detail Owner tab. Does NOT include Identity documents or Position & TIN.
 */
import { useState, useEffect } from 'react'
import { Descriptions, Typography, Card, Tag, Empty } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { ShopOutlined, RightOutlined } from '@ant-design/icons'
import { get } from '@/lib/http'
import dayjs from 'dayjs'

const { Text } = Typography

const EDUCATION_LABELS = {
  elementary: 'Elementary',
  high_school: 'High School',
  vocational: 'Vocational',
  college: 'College',
  postgraduate: 'Postgraduate',
}

const MARITAL_LABELS = {
  single: 'Single',
  married: 'Married',
  widowed: 'Widowed',
  divorced: 'Divorced',
  separated: 'Separated',
}

const SEX_LABELS = { male: 'Male', female: 'Female' }

function formatDate(date) {
  if (!date) return 'N/A'
  const d = date?.toDate?.() || date
  return dayjs(d).format('MMM D, YYYY')
}

function na(value) {
  return value != null && String(value).trim() !== '' ? String(value).trim() : 'N/A'
}

const STATUS_COLORS = {
  draft: 'default',
  submitted: 'processing',
  under_review: 'processing',
  needs_revision: 'warning',
  approved: 'success',
  rejected: 'error',
  resubmit: 'warning',
}

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  needs_revision: 'Needs Revision',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmit: 'Resubmit',
}

export default function OwnerInfoReadOnlyView({
  application,
  ownerIdentity = {},
  businessReg = {},
  ownerName,
  onSelectApplication,
}) {
  const bo = application?.businessOwner || {}
  const fullName = ownerName || ownerIdentity.fullName || businessReg.ownerFullName || bo.name || 'N/A'

  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  const firstName = bo.firstName || parts[0] || 'N/A'
  const lastName = bo.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : 'N/A')
  const middleName = bo.middleName ?? ownerIdentity.middleName ?? ''
  const suffix = bo.suffix ?? ownerIdentity.suffix ?? ''

  const email = businessReg.emailAddress || bo.email || 'N/A'
  const phoneNumber = businessReg.mobileNumber || bo.phoneNumber || 'N/A'
  const dateOfBirth = ownerIdentity.dateOfBirth || bo.dateOfBirth
  const sex = ownerIdentity.sex || bo.sex
  const maritalStatus = ownerIdentity.maritalStatus || bo.maritalStatus
  const placeOfBirth = ownerIdentity.placeOfBirth || bo.placeOfBirth || ''
  const nationality = ownerIdentity.nationality || bo.nationality || businessReg.ownerNationality || ''
  const education = ownerIdentity.highestEducationalAttainment || bo.highestEducationalAttainment || ''
  const fatherName = ownerIdentity.fatherName || bo.fatherName || ''
  const motherName = ownerIdentity.motherName || bo.motherName || ''
  const distinctiveMark = ownerIdentity.distinctiveMark || bo.distinctiveMark || ''

  // Address: same separate fields as registration / PhilippineAddressFields
  const address = application?.businessOwner?.address || ownerIdentity.address || {}
  const fallbackLine = businessReg.ownerResidentialAddress || ''
  const street = address.street || address.streetAddress || ''
  const barangay = address.barangayName || address.barangay || ''
  const city = address.cityName || address.city || ''
  const province = address.provinceName || address.province || ''
  const zipCode = address.postalCode || address.zipCode || ''
  const hasStructuredAddress = [street, barangay, city, province, zipCode].some(v => v != null && String(v).trim() !== '')

  // Fixed label width so all sections have symmetrical left columns
  const descriptionLabelStyle = { width: 200, minWidth: 200 }

  // Fetch other applications by the same owner
  const [otherApplications, setOtherApplications] = useState([])
  const [loadingOthers, setLoadingOthers] = useState(false)

  const currentBusinessId = application?.businessId || application?.applicationId || application?._id
  const ownerId = application?.userId

  useEffect(() => {
    if (!ownerId) return
    let cancelled = false
    setLoadingOthers(true)
    get(`/api/lgu-officer/permit-applications?ownerId=${ownerId}&limit=50`)
      .then((res) => {
        if (cancelled) return
        const apps = res.applications || res.data || []
        // Filter out the current application
        const others = apps.filter((app) => {
          const appId = app.businessId || app.applicationId || app._id || app._businessId
          return String(appId) !== String(currentBusinessId)
        })
        setOtherApplications(others)
      })
      .catch((err) => {
        console.error('Failed to fetch other applications:', err)
        if (!cancelled) setOtherApplications([])
      })
      .finally(() => {
        if (!cancelled) setLoadingOthers(false)
      })
    return () => { cancelled = true }
  }, [ownerId, currentBusinessId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Basic information — same labels as Settings > General */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Basic information</Text>
        <Descriptions column={1} size="small" bordered styles={{ label: descriptionLabelStyle }}>
          <Descriptions.Item label="First Name">{na(firstName)}</Descriptions.Item>
          <Descriptions.Item label="Last Name">{na(lastName)}</Descriptions.Item>
          <Descriptions.Item label="Middle Name (optional)">{na(middleName)}</Descriptions.Item>
          <Descriptions.Item label="Suffix (optional)">{na(suffix)}</Descriptions.Item>
          <Descriptions.Item label="Email">{na(email)}</Descriptions.Item>
          <Descriptions.Item label="Sex">{sex ? (SEX_LABELS[sex] || sex) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth (optional)">{formatDate(dateOfBirth)}</Descriptions.Item>
          <Descriptions.Item label="Phone Number">{na(phoneNumber)}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* Address — separate fields like registration page (or single line if only ownerResidentialAddress) */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Address</Text>
        <Descriptions column={1} size="small" bordered styles={{ label: descriptionLabelStyle }}>
          {hasStructuredAddress ? (
            <>
              <Descriptions.Item label="House/Bldg No. & Street">{na(street)}</Descriptions.Item>
              <Descriptions.Item label="Barangay">{na(barangay)}</Descriptions.Item>
              <Descriptions.Item label="City/Municipality">{na(city)}</Descriptions.Item>
              <Descriptions.Item label="Province">{na(province)}</Descriptions.Item>
              <Descriptions.Item label="Postal Code">{na(zipCode)}</Descriptions.Item>
            </>
          ) : (
            <Descriptions.Item label="Complete Address">{na(fallbackLine)}</Descriptions.Item>
          )}
        </Descriptions>
      </div>

      {/* Other information — same labels as Settings > General */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Other information</Text>
        <Descriptions column={1} size="small" bordered styles={{ label: descriptionLabelStyle }}>
          <Descriptions.Item label="Marital Status">{maritalStatus ? (MARITAL_LABELS[maritalStatus] || maritalStatus) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Place of Birth">{na(placeOfBirth)}</Descriptions.Item>
          <Descriptions.Item label="Nationality">{na(nationality)}</Descriptions.Item>
          <Descriptions.Item label="Education">{education ? (EDUCATION_LABELS[education] || education) : 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Father's Name">{na(fatherName)}</Descriptions.Item>
          <Descriptions.Item label="Mother's Name">{na(motherName)}</Descriptions.Item>
          <Descriptions.Item label="Distinctive Mark (optional)">{na(distinctiveMark)}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* Other Business Applications by this Owner */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Other Business Applications</Text>
        {loadingOthers ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <LottieSpinner size="small" />
          </div>
        ) : otherApplications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No other business applications"
            style={{ margin: '16px 0' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherApplications.map((app) => {
              const appId = app.businessId || app.applicationId || app._id || app._businessId
              const status = app.applicationStatus || app.status || 'draft'
              return (
                <Card
                  key={appId}
                  size="small"
                  hoverable
                  onClick={() => onSelectApplication?.(app)}
                  style={{ cursor: onSelectApplication ? 'pointer' : 'default' }}
                  styles={{ body: { padding: '12px 16px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <ShopOutlined style={{ fontSize: 18, color: '#1890ff', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.businessName || 'Unnamed Business'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {app.applicationReferenceNumber || `ID: ${String(appId).slice(-8)}`}
                          {app.submittedAt && ` • ${dayjs(app.submittedAt).format('MMM D, YYYY')}`}
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Tag color={STATUS_COLORS[status] || 'default'}>
                        {STATUS_LABELS[status] || status}
                      </Tag>
                      {onSelectApplication && <RightOutlined style={{ color: '#999', fontSize: 12 }} />}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
