import { useState, useEffect } from 'react'
import { Typography, Alert, Button } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { REJECTION_REASON_OPTIONS } from '../../../constants/rejectionReasons'

const { Text } = Typography

/** Revoke Decision Section for Decision card - shows countdown and revoke button */
export default function RevokeDecisionSection({ application, onRevoke }) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [revoking, setRevoking] = useState(false)

  const status = application?.status

  useEffect(() => {
    // Calculate time left based on when the decision was made
    const calculateTimeLeft = () => {
      const decisionAt = application?.approvedAt || 
                         application?.rejectedAt ||
                         application?.lastStatusChange || 
                         application?.updatedAt || 
                         application?.reviewedAt
      
      if (!decisionAt) {
        return 24 * 60 * 60 // Default to full 24 hours
      }
      
      const decisionTime = new Date(decisionAt).getTime()
      const currentTime = new Date().getTime()
      const elapsedSeconds = Math.floor((currentTime - decisionTime) / 1000)
      const totalTime = 24 * 60 * 60 // 24 hours in seconds
      const remaining = totalTime - elapsedSeconds
      
      return Math.max(0, remaining)
    }
    
    setTimeLeft(calculateTimeLeft())
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [application?.approvedAt, application?.rejectedAt, application?.updatedAt, application?.lastStatusChange, application?.reviewedAt])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      await onRevoke()
    } catch (err) {
      console.error('Revoke decision error:', err)
    } finally {
      setRevoking(false)
    }
  }

  const getStatusLabel = () => {
    if (status === 'approved') return 'Approved'
    if (status === 'rejected') return 'Rejected'
    if (status === 'needs_revision') return 'Changes Requested'
    return status
  }

  // Map rejection reason code to human-readable label
  const getReasonLabel = (reasonCode) => {
    if (!reasonCode) return null
    const option = REJECTION_REASON_OPTIONS.find(r => r.value === reasonCode)
    return option?.label || reasonCode
  }

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
        <div><Text strong>{status === 'needs_revision' 
          ? 'This application requires changes from the applicant.'
          : `This application has been ${getStatusLabel().toLowerCase()}.`}</Text></div>
      </div>
      {application?.rejectionReason && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Rejection reason</Text>
          <div><Text strong>{getReasonLabel(application.rejectionReason)}</Text></div>
        </div>
      )}
      {application?.reviewComments && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Comments</Text>
          <div><Text strong>{application.reviewComments}</Text></div>
        </div>
      )}
      {application?.reviewedAt && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Submitted on</Text>
          <div><Text strong>{new Date(application.reviewedAt).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text></div>
        </div>
      )}
      {status === 'rejected' && application?.hasActiveAppeal && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
          message={
            <div>
              <Text strong>Appeal Pending</Text>
              <div><Text type="secondary" style={{ fontSize: 12 }}>The business owner has filed an appeal for this rejection. Review it in the Appeals page.</Text></div>
            </div>
          }
        />
      )}
      {status === 'rejected' && application?.appealExhausted && !application?.hasActiveAppeal && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Appeal status</Text>
          <div><Text strong>Appeal exhausted - Final decision</Text></div>
        </div>
      )}
      {timeLeft > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text>You can revoke this decision within <Text strong>{formatTime(timeLeft)}</Text></Text>
              <Button 
                danger 
                size="small" 
                onClick={handleRevoke}
                loading={revoking}
                icon={<HistoryOutlined />}
              >
                Revoke Decision
              </Button>
            </div>
          }
        />
      )}
      {timeLeft === 0 && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
          The 24-hour window to revoke this decision has expired.
        </Text>
      )}
    </>
  )
}
