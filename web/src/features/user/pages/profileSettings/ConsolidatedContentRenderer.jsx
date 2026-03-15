import React, { useState, useEffect } from 'react'
import { Typography, Grid, Select, Alert, Button } from 'antd'
import { theme } from 'antd'
import { InfoCircleOutlined, LockOutlined, MailOutlined, DeleteOutlined } from '@ant-design/icons'

// Import all the individual section components
import LoggedInMfaManager from '@/features/authentication/components/LoggedInMfaManager.jsx'
import MfaSetup from '@/features/authentication/components/MfaSetup.jsx'
import LoggedInPasswordChangeFlow from '@/features/authentication/flows/LoggedInPasswordChangeFlow.jsx'
import LoggedInEmailChangeFlow from '@/features/authentication/flows/LoggedInEmailChangeFlow.jsx'
import EmailChangeGracePeriod from '@/features/authentication/components/EmailChangeGracePeriod.jsx'
import MfaReenrollmentAlert from '@/features/authentication/components/MfaReenrollmentAlert.jsx'
import ActiveSessions from '@/features/user/components/ActiveSessions.jsx'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'
import { DeleteAccountFlow, DeletionScheduledBanner, useAuthSession } from '@/features/authentication'

// Import General section components
import BasicInfoSection from './GeneralSections/BasicInfoSection.jsx'
import AddressSection from './GeneralSections/AddressSection.jsx'
import PersonalInfoSection from './GeneralSections/PersonalInfoSection.jsx'

// Import other tab content components
import EditUserProfileForm from '@/features/user/components/EditUserProfileForm.jsx'
import PendingApprovalAlert from '@/features/user/components/PendingApprovalAlert.jsx'

const { Title, Paragraph } = Typography

/** Centered content width for section detail (login-style consistency) */
const CENTERED_CONTENT_MAX_WIDTH = 300

export default function ConsolidatedContentRenderer({ 
  selectedKey, 
  themeSettings,
  isBusinessOwner,
  isStaffOrAdmin 
}) {
  const { token } = theme.useToken()
  const [selectedSecurityKey, setSelectedSecurityKey] = useState('mfa')
  const [emailShowingFlow, setEmailShowingFlow] = useState(false)
  const [passwordShowingFlow, setPasswordShowingFlow] = useState(false)
  const [deleteAccountShowingFlow, setDeleteAccountShowingFlow] = useState(false)
  const [mfaShowingSetup, setMfaShowingSetup] = useState(false)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  // Security-specific state and effects
  const { currentUser } = useAuthSession()
  const { credentials: passkeys } = usePasskeyManager()
  const { effectiveEnabled } = useLoggedInMfaManager()
  
  // Calculate hasPasskeys from the actual passkey credentials
  const hasPasskeys = Array.isArray(passkeys) && passkeys.length > 0
  
  // Double-check business owner status for consistency
  const userRole = typeof currentUser?.role === 'string' ? currentUser?.role : currentUser?.role?.slug || 'user'
  const isActuallyBusinessOwner = userRole === 'business_owner'

  // Auto-select MFA section if deleteAccount is selected but not available
  useEffect(() => {
    if (selectedKey === 'deleteAccount' && !isActuallyBusinessOwner) {
      setSelectedSecurityKey('mfa')
    }
  }, [selectedKey, isActuallyBusinessOwner])

  // Reset email flow state when switching away from email tab
  useEffect(() => {
    if (selectedKey !== 'email') {
      setEmailShowingFlow(false)
    }
  }, [selectedKey])

  // Reset password flow state when switching away from password tab
  useEffect(() => {
    if (selectedKey !== 'password') {
      setPasswordShowingFlow(false)
    }
  }, [selectedKey])

  // Reset delete account flow state when switching away from delete account tab
  useEffect(() => {
    if (selectedKey !== 'deleteAccount') {
      setDeleteAccountShowingFlow(false)
    }
  }, [selectedKey])

  // Reset MFA setup state when switching away from MFA tab
  useEffect(() => {
    if (selectedKey !== 'mfa') {
      setMfaShowingSetup(false)
    }
  }, [selectedKey])

  // Common wrapper style for centered content
  const centeredWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '0 16px 24px',
  }

  /** Intro card style for Email (matches MFA/Passkey alert style) */
  const introCardStyle = {
    padding: 24,
    background: token.colorFillAlter,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 20,
  }

  // Render individual sections
  const renderContent = () => {
    switch (selectedKey) {
      // General sections
      case 'basicInfo':
        return <BasicInfoSection />
        
      case 'address':
        return <AddressSection />
        
      case 'personalInfo':
        return <PersonalInfoSection />

      // Security sections
      case 'mfa':
        if (mfaShowingSetup) {
          return (
            <div style={{ ...centeredWrapperStyle }}>
              <MfaSetup 
                embedded={true} 
                onComplete={() => setMfaShowingSetup(false)} 
              />
            </div>
          )
        }
        
        return (
          <div style={{ ...centeredWrapperStyle }}>
            <div style={{ width: 300, margin: '0 auto' }}>
              <MfaReenrollmentAlert />
              <LoggedInMfaManager 
                onOpenSetupForm={() => setMfaShowingSetup(true)} 
                hasPasskeys={hasPasskeys} 
              />
            </div>
          </div>
        )

      case 'password':
        if (passwordShowingFlow) {
          return (
            <div style={{ ...centeredWrapperStyle }}>
              <div style={{ width: 300, margin: '0 auto' }}>
                <LoggedInPasswordChangeFlow onBackToStart={() => setPasswordShowingFlow(false)} />
              </div>
            </div>
          )
        }
        return (
          <div style={{ ...centeredWrapperStyle }}>
            <div style={{ width: 300, margin: '0 auto' }}>
              <div style={introCardStyle}>
                <LockOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
                <div>
                  <Title level={5} style={{ margin: 0, marginBottom: 4 }}>Password</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    Change your password to keep your account secure. We'll send a verification code to your email first.
                  </Paragraph>
                </div>
                <Button type="primary" onClick={() => setPasswordShowingFlow(true)} icon={<LockOutlined />}>
                  Change password
                </Button>
              </div>
            </div>
          </div>
        )

      case 'email':
        if (emailShowingFlow) {
          return (
            <div style={{ ...centeredWrapperStyle }}>
              <div style={{ width: 300, margin: '0 auto' }}>
                <EmailChangeGracePeriod />
                <LoggedInEmailChangeFlow onBackToStart={() => setEmailShowingFlow(false)} />
              </div>
            </div>
          )
        }
        return (
          <div style={{ ...centeredWrapperStyle }}>
            <div style={{ width: 300, margin: '0 auto' }}>
              <EmailChangeGracePeriod />
              <div style={introCardStyle}>
                <MailOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
                <div>
                  <Title level={5} style={{ margin: 0, marginBottom: 4 }}>Email Address</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    Update the email address used for sign-in and account notifications. We'll verify your current email first.
                  </Paragraph>
                </div>
                <Button type="primary" onClick={() => setEmailShowingFlow(true)} icon={<MailOutlined />}>
                  Update email address
                </Button>
              </div>
            </div>
          </div>
        )

      case 'sessions':
        return (
          <div style={{ ...centeredWrapperStyle }}>
            <div style={{ width: 300, margin: '0 auto' }}>
              <ActiveSessions />
            </div>
          </div>
        )

      case 'deleteAccount':
        if (!isActuallyBusinessOwner) {
          return (
            <div style={{ ...centeredWrapperStyle }}>
              <div style={{ width: 300, margin: '0 auto' }}>
                <Alert
                  message="Delete Account Not Available"
                  description="Account deletion is only available for business owners."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </div>
            </div>
          )
        }
        
        if (deleteAccountShowingFlow) {
          return (
            <div style={{ ...centeredWrapperStyle }}>
              <div style={{ width: 300, margin: '0 auto' }}>
                {currentUser?.deletionPending && <DeletionScheduledBanner />}
                <DeleteAccountFlow embedded onBackToStart={() => setDeleteAccountShowingFlow(false)} />
              </div>
            </div>
          )
        }
        
        return (
          <div style={{ ...centeredWrapperStyle }}>
            <div style={{ width: 300, margin: '0 auto' }}>
              {currentUser?.deletionPending && <DeletionScheduledBanner />}
              <div style={introCardStyle}>
                <DeleteOutlined style={{ fontSize: 32, color: token.colorError }} />
                <div>
                  <Title level={5} style={{ margin: 0, marginBottom: 4 }}>Delete Account</Title>
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    Remove your account access after identity verification. Some records may be retained where required for BPLO, legal, audit, or government record-keeping purposes.
                  </Paragraph>
                </div>
                <Button 
                  type="primary" 
                  danger 
                  onClick={() => setDeleteAccountShowingFlow(true)} 
                  icon={<DeleteOutlined />}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div style={{ ...centeredWrapperStyle }}>
            <div style={{ width: 300, margin: '0 auto' }}>
              <Alert
                message="Section Not Found"
                description="The requested section could not be found."
                type="warning"
                showIcon
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {renderContent()}
    </div>
  )
}
