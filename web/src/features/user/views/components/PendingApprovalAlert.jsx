import { useState, useEffect } from 'react'
import { Alert, Tag, Space, Typography } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { getPendingApprovals } from '@/features/user/services/approvalService.js'

const { Text } = Typography

export default function PendingApprovalAlert() {
  const { currentUser, role } = useAuthSession()
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingApprovals()
    const interval = setInterval(loadPendingApprovals, 60000) // Check every minute
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const loadPendingApprovals = async () => {
    try {
      setLoading(true)
      const data = await getPendingApprovals(currentUser, role)
      setPendingApprovals(data?.approvals || [])
    } catch (err) {
      console.error('Failed to load pending approvals:', err)
      setPendingApprovals([])
    } finally {
      setLoading(false)
    }
  }

  if (loading || pendingApprovals.length === 0) {
    return null
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 24 }}>
      {pendingApprovals.map((approval) => (
        <Alert
          key={approval.approvalId}
          message={
            <Space>
              <ClockCircleOutlined />
              <Text strong>Pending Approval</Text>
              <Tag color="orange">{approval.requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Tag>
            </Space>
          }
          description={
            <div>
              <Text>
                Your request to change {getFieldNames(approval.requestDetails)} is pending approval.
                {' '}Required approvals: {approval.approvals?.length || 0} / {approval.requiredApprovals || 2}
              </Text>
            </div>
          }
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
        />
      ))}
    </Space>
  )
}

function getFieldNames(requestDetails) {
  if (!requestDetails) return 'profile information'
  
  if (requestDetails.fields && Array.isArray(requestDetails.fields)) {
    return requestDetails.fields.join(', ')
  }
  
  if (requestDetails.newEmail) {
    return 'email address'
  }
  
  if (requestDetails.newPassword) {
    return 'password'
  }
  
  return 'profile information'
}
