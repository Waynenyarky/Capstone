import React, { useState } from 'react'
import {
  Typography,
  Tag,
  Button,
  Descriptions,
  Space,
  theme,
  Empty,
  Modal,
  Input,
} from 'antd'
import { ToolOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'

const { Text } = Typography
const { TextArea } = Input

const STATUS_COLORS = {
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  expired: 'default',
}

function userName(user) {
  if (!user) return '—'
  if (typeof user === 'object') {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return name || user.email || user._id || '—'
  }
  return '—'
}

function userEmail(user) {
  if (!user || typeof user !== 'object') return ''
  return user.email || ''
}

export default function MaintenanceRequestDetailPanel({ approval, onApprove, onRefresh }) {
  const { token } = theme.useToken()
  const { currentUser } = useAuthSession()
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionApproved, setActionApproved] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentUserId = currentUser?.id ?? currentUser?._id
  const isPending = approval?.status === 'pending'
  const hasVoted = approval?.approvals?.some(
    (a) => String(a.adminId?._id ?? a.adminId) === String(currentUserId)
  )
  const myVote = approval?.approvals?.find(
    (a) => String(a.adminId?._id ?? a.adminId) === String(currentUserId)
  )
  const canVote = isPending && !hasVoted

  const handleApproveClick = () => {
    setActionApproved(true)
    setComment('')
    setActionModalOpen(true)
  }

  const handleDenyClick = () => {
    setActionApproved(false)
    setComment('')
    setActionModalOpen(true)
  }

  const handleActionSubmit = async () => {
    if (!approval?.approvalId || !onApprove) return
    setSubmitting(true)
    try {
      await onApprove(approval.approvalId, actionApproved, comment)
      setActionModalOpen(false)
      onRefresh?.()
    } finally {
      setSubmitting(false)
    }
  }

  if (!approval) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: token.colorBgLayout,
        }}
      >
        <Empty
          image={<ToolOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a request to view details</Text>}
        />
      </div>
    )
  }

  const details = approval.requestDetails || {}
  const actionLabel = details.action === 'enable' ? 'Enable maintenance' : 'Disable maintenance'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorder}` }}>
        <Space align="center" wrap style={{ marginBottom: 8 }}>
          <Tag color={STATUS_COLORS[approval.status]}>{approval.status}</Tag>
          <Text strong>{actionLabel}</Text>
          <Text type="secondary">ID: {approval.approvalId}</Text>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Required approvals: {approval.approvals?.filter((a) => a.approved).length ?? 0} / {approval.requiredApprovals ?? 2}
        </Text>
      </div>

      <div style={{ padding: 16, flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Descriptions
          column={1}
          size="small"
          style={{ marginBottom: 16 }}
          labelStyle={{ color: token.colorTextSecondary, width: 140 }}
        >
          <Descriptions.Item label="Requested by">
            {userName(approval.requestedBy)} {userEmail(approval.requestedBy) && `(${userEmail(approval.requestedBy)})`}
          </Descriptions.Item>
          {approval.createdAt && (
            <Descriptions.Item label="Created">
              {new Date(approval.createdAt).toLocaleString()}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Action">{actionLabel}</Descriptions.Item>
          {details.message != null && details.message !== '' && (
            <Descriptions.Item label="Message">{details.message}</Descriptions.Item>
          )}
          {details.expectedResumeAt && (
            <Descriptions.Item label="Expected resume">
              {new Date(details.expectedResumeAt).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>

        {approval.approvals?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Admin votes</Text>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {approval.approvals.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    background: token.colorFillQuaternary,
                    borderRadius: token.borderRadius,
                    fontSize: 12,
                  }}
                >
                  <Space>
                    <Tag color={a.approved ? 'success' : 'error'}>
                      {a.approved ? 'Approved' : 'Rejected'}
                    </Tag>
                    {userName(a.adminId)}
                    {a.timestamp && (
                      <Text type="secondary">{new Date(a.timestamp).toLocaleString()}</Text>
                    )}
                  </Space>
                  {a.comment && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">{a.comment}</Text>
                    </div>
                  )}
                </div>
              ))}
            </Space>
          </div>
        )}

        {isPending && hasVoted && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              You have already voted ({myVote?.approved ? 'Approved' : 'Rejected'}).
            </Text>
          </div>
        )}

        {canVote && (
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveClick}>
              Approve Request
            </Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={handleDenyClick}>
              Reject Request
            </Button>
          </Space>
        )}
      </div>

      <Modal
        title={actionApproved ? 'Approve request' : 'Reject request'}
        open={actionModalOpen}
        onCancel={() => !submitting && setActionModalOpen(false)}
        onOk={handleActionSubmit}
        confirmLoading={submitting}
        okText={actionApproved ? 'Approve Request' : 'Reject Request'}
        okButtonProps={actionApproved ? {} : { danger: true }}
      >
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Optional comment:</Text>
        </div>
        <TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
        />
      </Modal>
    </div>
  )
}
