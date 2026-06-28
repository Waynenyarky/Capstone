import { useState, useEffect, useCallback } from 'react'
import { Typography, Empty, theme, Space, Grid, Button, message } from 'antd'
import { UserOutlined, StarOutlined, StarFilled, HistoryOutlined, BookOutlined, InfoCircleOutlined, LockOutlined, IdcardOutlined, FileTextOutlined } from '@ant-design/icons'
import DetailHeader from '@/shared/components/DetailHeader'
import FormNavigation from '@/shared/components/FormNavigation'
import InfoGrid from '@/shared/components/InfoGrid'

const { Text, Title } = Typography
const { useBreakpoint } = Grid

export default function BusinessOwnerDetailPanel({
  businessOwner: initialBusinessOwner,
  onReviewComplete: _onReviewComplete,
}) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.lg
  const [businessOwner, setBusinessOwner] = useState(initialBusinessOwner)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [_historyModalOpen, setHistoryModalOpen] = useState(false)
  const [_manualModalOpen, setManualModalOpen] = useState(false)
  const [_infoModalOpen, setInfoModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    if (initialBusinessOwner) {
      setBusinessOwner(initialBusinessOwner)
    }
  }, [initialBusinessOwner])

  const handleBookmarkToggle = useCallback(() => {
    setIsBookmarked(!isBookmarked)
    // TODO: Implement actual bookmark API call
  }, [isBookmarked])

  const handleHistoryClick = useCallback(() => {
    setHistoryModalOpen(true)
  }, [])

  const handleManualClick = useCallback(() => {
    setManualModalOpen(true)
  }, [])

  const handleInfoClick = useCallback(() => {
    setInfoModalOpen(true)
  }, [])

  const handleCopyToClipboard = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(`${label} copied to clipboard`)
    } catch {
      message.error('Failed to copy')
    }
  }, [])

  if (!initialBusinessOwner) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<UserOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a business owner to view details</Text>}
        />
      </div>
    )
  }

  // Determine account status
  let statusLabel = 'Active'
  if (businessOwner.deletionPending) {
    statusLabel = 'Pending Deletion'
  } else if (!businessOwner.isActive) {
    statusLabel = 'Inactive'
  }

  // Convert marital status to sentence case
  const toSentenceCase = (str) => {
    if (!str) return 'N/A'
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Tab items
  const mainNavItems = [
    {
      key: 'personal',
      label: (
        <Space>
          <IdcardOutlined />
          <span>Personal</span>
        </Space>
      ),
    },
    {
      key: 'account',
      label: (
        <Space>
          <LockOutlined />
          <span>Account</span>
        </Space>
      ),
    },
    {
      key: 'applications',
      label: (
        <Space>
          <FileTextOutlined />
          <span>Applications</span>
        </Space>
      ),
    },
    {
      key: 'businesses',
      label: (
        <Space>
          <FileTextOutlined />
          <span>Businesses</span>
        </Space>
      ),
    },
  ]

  const getActiveContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <InfoGrid
            items={[
              { label: 'Status', value: statusLabel },
              { label: 'Email Verified', value: businessOwner.isEmailVerified ? 'Yes' : 'No' },
              { label: 'MFA Enabled', value: businessOwner.mfaEnabled ? 'Yes' : 'No' },
              { label: 'PIS Completed', value: businessOwner.pisCompleted ? 'Yes' : 'No' },
              { label: 'Registered On', value: businessOwner.createdAt ? new Date(businessOwner.createdAt).toLocaleDateString() : 'N/A' },
              { label: 'Last Login', value: businessOwner.lastLoginAt ? new Date(businessOwner.lastLoginAt).toLocaleString() : 'N/A' },
            ]}
          />
        )
      case 'personal': {
        const addressParts = [
          businessOwner.address?.street,
          businessOwner.address?.barangay,
          businessOwner.address?.city,
          businessOwner.address?.province,
          businessOwner.address?.zipCode,
        ].filter(Boolean)
        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A'
        return (
          <InfoGrid
            items={[
              { label: 'Name', value: [businessOwner.firstName, businessOwner.middleName, businessOwner.lastName, businessOwner.suffix].filter(Boolean).join(' ') || 'N/A' },
              { label: 'Email', value: businessOwner.email ? <Button type="link" size="small" onClick={() => handleCopyToClipboard(businessOwner.email, 'Email')} style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}>{businessOwner.email}</Button> : 'N/A' },
              { label: 'Phone Number', value: businessOwner.phoneNumber ? <Button type="link" size="small" onClick={() => handleCopyToClipboard(businessOwner.phoneNumber, 'Phone number')} style={{ padding: 0, height: 'auto', fontWeight: 600, textDecoration: 'underline' }}>{businessOwner.phoneNumber}</Button> : 'N/A' },
              { label: 'Sex', value: businessOwner.sex ? (businessOwner.sex === 'male' ? 'Male' : businessOwner.sex === 'female' ? 'Female' : businessOwner.sex) : 'N/A' },
              { label: 'Date of Birth', value: businessOwner.dateOfBirth ? new Date(businessOwner.dateOfBirth).toLocaleDateString() : 'N/A' },
              { label: 'Marital Status', value: toSentenceCase(businessOwner.maritalStatus) },
              { type: 'divider' },
              { label: 'Address', value: fullAddress },
              { type: 'divider' },
              { label: 'Place of Birth', value: businessOwner.placeOfBirth || 'N/A' },
              { label: 'Nationality', value: businessOwner.nationality || 'N/A' },
              { label: 'Highest Educational Attainment', value: toSentenceCase(businessOwner.highestEducationalAttainment) },
              { label: "Father's Name", value: businessOwner.fatherName || 'N/A' },
              { label: "Mother's Name", value: businessOwner.motherName || 'N/A' },
              { label: 'Distinctive Mark', value: businessOwner.distinctiveMark || 'N/A' },
            ]}
          />
        )
      }
      case 'applications': {
        const applications = businessOwner.applications || []
        if (applications.length === 0) {
          return (
            <div style={{ padding: 16 }}>
              <Title level={5}>Applications</Title>
              <Text type="secondary">No applications found</Text>
            </div>
          )
        }
        return (
          <div style={{ padding: 16 }}>
            <Title level={5}>Applications</Title>
            {applications.map((app) => (
              <div key={app._id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{app.businessName || 'Unnamed Business'}</Text>
                </div>
                <InfoGrid
                  items={[
                    { label: 'Reference Number', value: app.applicationReferenceNumber || 'N/A' },
                    { label: 'Status', value: toSentenceCase(app.status) },
                    { label: 'Submitted', value: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A' },
                  ]}
                />
              </div>
            ))}
          </div>
        )
      }
      case 'businesses':
        return (
          <div style={{ padding: 16 }}>
            <Title level={5}>Businesses</Title>
            <Text>{businessOwner.businessCount !== undefined ? `${businessOwner.businessCount} registered business${businessOwner.businessCount !== 1 ? 'es' : ''}` : 'N/A'}</Text>
          </div>
        )
      default:
        return null
    }
  }

  const activeContent = getActiveContent()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <DetailHeader
        title="Business Owner Details"
        iconButtons={[
          { icon: isBookmarked ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />, onClick: handleBookmarkToggle, title: isBookmarked ? 'Remove Bookmark' : 'Add Bookmark' },
          { icon: <HistoryOutlined />, onClick: handleHistoryClick, title: 'History' },
          { icon: <BookOutlined />, onClick: handleManualClick, title: 'Manual' },
          { icon: <InfoCircleOutlined />, onClick: handleInfoClick, title: 'Info' },
        ]}
        actionButtons={[]}
        desktopOnly={true}
      />

      {/* Content with Form Navigation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {isMobile ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <FormNavigation
              mainNavItems={mainNavItems}
              formNavItems={[]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isMobile={isMobile}
            />
            <div style={{ flex: 1, overflow: 'auto' }}>
              {activeContent}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', alignItems: 'stretch' }}>
            <FormNavigation
              mainNavItems={mainNavItems}
              formNavItems={[]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isMobile={isMobile}
            />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                background: token.colorBgContainer,
              }}
            >
              {activeContent}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
