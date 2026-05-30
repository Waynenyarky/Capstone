import { useState, useEffect } from 'react'
import { Alert, Button, Space } from 'antd'
import { SafetyCertificateOutlined, CloseOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { useNavigate } from 'react-router-dom'

/**
 * @param {object} [props]
 * @param {() => void} [props.onSetupClick] - If provided, called when "Setup MFA Now" is clicked instead of navigating to /account/security (e.g. to show form inline).
 */
export default function MfaReenrollmentAlert({ onSetupClick }) {
  const { currentUser } = useAuthSession()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  // Check if MFA was previously enabled but is now disabled after email/password change
  // Backend may send mfaReEnrollmentRequired (capital E); support both casings
  const reenrollmentFlag = currentUser?.mfaReenrollmentRequired ?? currentUser?.mfaReEnrollmentRequired
  const needsReenrollment = reenrollmentFlag === true ||
    (currentUser?.mfaEnabled === false && currentUser?.previousMfaEnabled === true)

  useEffect(() => {
    // Reset dismissed state when user changes
    setDismissed(false)
  }, [currentUser?.email])

  if (dismissed || !needsReenrollment) {
    return null
  }

  const handleSetup = () => {
    if (typeof onSetupClick === 'function') {
      onSetupClick()
    } else {
      navigate('/account/security')
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in localStorage with timestamp (expires after 24 hours)
    localStorage.setItem('mfa_reenrollment_dismissed', Date.now().toString())
  }

  // Check if dismissal has expired (24 hours)
  const dismissedTimestamp = localStorage.getItem('mfa_reenrollment_dismissed')
  if (dismissedTimestamp) {
    const dismissedTime = parseInt(dismissedTimestamp, 10)
    const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60)
    if (hoursSinceDismissal < 24) {
      return null
    } else {
      localStorage.removeItem('mfa_reenrollment_dismissed')
    }
  }

  return (
    <Alert
      message="MFA Re-enrollment Required"
      description={
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            Your email or password was recently changed. For security reasons, you need to set up Two-Factor Authentication again.
          </div>
          <Space>
            <Button type="primary" size="small" icon={<SafetyCertificateOutlined />} onClick={handleSetup}>
              Setup MFA Now
            </Button>
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={handleDismiss}>
              Dismiss
            </Button>
          </Space>
        </Space>
      }
      type="warning"
      showIcon
      icon={<SafetyCertificateOutlined />}
      style={{ marginBottom: 24 }}
      closable
      onClose={handleDismiss}
    />
  )
}
