import { useState } from 'react'
import { Typography, Tag, Space, Button, Divider, Modal, Input, Form } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UndoOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { App } from 'antd'
import dayjs from 'dayjs'
import { userName, userEmail, entityId } from '../utils/maintenance.utils.js'

const { Text } = Typography
const { TextArea } = Input

export default function MaintenanceVotePanel({ approval, allApprovals, admins, currentUser, onApprove, onUndoVote, onRefresh, token }) {
  const { message } = App.useApp()
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionApproved, setActionApproved] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentUserId = entityId(currentUser)
  const isPending = approval?.status === 'pending'
  const hasVoted = approval?.approvals?.some(
    (a) => entityId(a.adminId) === currentUserId
  )
  const myVote = approval?.approvals?.find(
    (a) => entityId(a.adminId) === currentUserId
  )
  const requesterId = entityId(approval?.requestedBy)
  const requesterEmail = userEmail(approval?.requestedBy)?.toLowerCase()
  const currentUserEmail = userEmail(currentUser)?.toLowerCase()
  const isRequester = approval ? requesterId === currentUserId : false
  const canVote = isPending && !hasVoted && !isRequester
  const isExecuted = !!approval?.executedAt

  const getUndoDeadline = () => {
    if (!myVote?.timestamp) return null
    const now = dayjs()
    const voteTime = dayjs(myVote.timestamp)
    const deadlines = []
    deadlines.push(voteTime.add(24, 'hour'))
    if (approval?.createdAt) {
      deadlines.push(dayjs(approval.createdAt).add(48, 'hour'))
    }
    if (approval?.requestDetails?.scheduledStartAt) {
      deadlines.push(dayjs(approval.requestDetails.scheduledStartAt))
    }
    if (approval?.requestDetails?.expectedResumeAt) {
      deadlines.push(dayjs(approval.requestDetails.expectedResumeAt))
    }
    const futureDeadlines = deadlines.filter(d => d.isAfter(now))
    if (futureDeadlines.length === 0) return null
    return futureDeadlines.sort((a, b) => a.diff(b))[0]
  }

  const hasOverlappingMaintenance = () => {
    if (!approval?.requestDetails || !allApprovals) return false
    const details = approval.requestDetails
    const startAt = details.scheduledStartAt ? dayjs(details.scheduledStartAt) : null
    const endAt = details.expectedResumeAt ? dayjs(details.expectedResumeAt) : null
    if (!startAt || !endAt) return false
    return allApprovals.some(a => {
      if (a.approvalId === approval.approvalId) return false
      if (a.status !== 'approved' && a.status !== 'pending') return false
      if (a.requestType !== 'maintenance_mode') return false
      const aStart = a.requestDetails?.scheduledStartAt ? dayjs(a.requestDetails.scheduledStartAt) : null
      const aEnd = a.requestDetails?.expectedResumeAt ? dayjs(a.requestDetails.expectedResumeAt) : null
      if (!aStart || !aEnd) return false
      return startAt.isBefore(aEnd) && endAt.isAfter(aStart)
    })
  }

  const canUndoVote = () => {
    if (isExecuted) return false
    const deadline = getUndoDeadline()
    if (deadline === null) return false
    if (hasOverlappingMaintenance()) return false
    return true
  }

  const isFinalVote = (() => {
    if (!isPending || !approval) return false
    const currentApprovedCount = (approval.approvals || []).filter((a) => a.approved === true).length
    const required = approval.requiredApprovals || 2
    return currentApprovedCount === required - 1
  })()

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
    if (!actionApproved && !comment.trim()) return
    setSubmitting(true)
    try {
      await onApprove(approval.approvalId, actionApproved, comment)
      setActionModalOpen(false)
      onRefresh?.()
    } finally {
      setSubmitting(false)
    }
  }

  const handleUndoVote = async () => {
    if (!approval?.approvalId || !onUndoVote) return
    if (hasOverlappingMaintenance()) {
      message.error('Cannot undo: overlapping maintenance exists')
      return
    }
    const deadline = getUndoDeadline()
    if (!deadline) {
      message.error('Undo no longer available')
      return
    }
    setSubmitting(true)
    try {
      await onUndoVote(approval.approvalId)
      message.success('Vote undone successfully')
      onRefresh?.()
    } catch (err) {
      message.error(err?.message || 'Failed to undo vote')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Text style={{ display: 'block', marginBottom: 8 }}>Admin votes :</Text>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {admins
            .filter((admin) => {
              const adminId = entityId(admin)
              const adminEmail = userEmail(admin).toLowerCase()
              if (adminId && (adminId === requesterId || adminId === currentUserId)) return false
              if (adminEmail && (adminEmail === requesterEmail || adminEmail === currentUserEmail)) return false
              return true
            })
            .map((admin) => {
              const vote = approval?.approvals?.find(
                (a) => entityId(a.adminId) === entityId(admin)
              )
              if (vote) {
                return (
                  <div
                    key={entityId(admin)}
                    style={{
                      padding: 8,
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius,
                      fontSize: 12,
                    }}
                  >
                    <Space size={2}>
                      <Tag color={vote.approved ? 'success' : 'error'}>
                        {vote.approved ? 'Approved' : 'Rejected'}
                      </Tag>
                      <Text>{userName(admin)}</Text>
                    </Space>
                    <Divider style={{ margin: '8px 0' }} />
                    {vote.comment ? (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                          Reason: {vote.comment}
                        </Text>
                      </div>
                    ) : (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                          No comment provided
                        </Text>
                      </div>
                    )}
                    {vote.timestamp && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        Submitted on: {new Date(vote.timestamp).toLocaleString()}
                      </Text>
                    )}
                  </div>
                )
              } else {
                return (
                  <div
                    key={entityId(admin)}
                    style={{
                      padding: 8,
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius,
                      fontSize: 12,
                    }}
                  >
                    <Space size={2}>
                      <Tag color="gold">Pending</Tag>
                      <Text>{userName(admin)}</Text>
                    </Space>
                  </div>
                )
              }
            })}
        </Space>
      </div>

      {hasVoted && !isRequester && (
        <div
          style={{
            marginTop: 16,
            padding: 8,
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadius,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Space size={2}>
              <Tag color={myVote?.approved ? 'success' : 'error'}>
                {myVote?.approved ? 'Approved' : 'Rejected'}
              </Tag>
              <Text>{userName(currentUser)}</Text>
            </Space>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          {myVote?.comment ? (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Reason: {myVote.comment}
              </Text>
            </div>
          ) : (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                No comment provided
              </Text>
            </div>
          )}
          {myVote?.timestamp && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              Submitted on: {new Date(myVote.timestamp).toLocaleString()}
            </Text>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <Button icon={<UndoOutlined />} onClick={handleUndoVote} disabled={isExecuted || !canUndoVote()} loading={submitting}>
            Undo
          </Button>
          {myVote?.timestamp && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
              {isExecuted
                ? 'Undo unavailable: request has been executed'
                : hasOverlappingMaintenance()
                ? 'Undo unavailable: overlapping maintenance exists'
                : canUndoVote()
                ? `Undo unavailable on ${getUndoDeadline()?.format('MMM D, YYYY HH:mm')}`
                : 'Undo no longer available'
              }
            </Text>
          )}
        </div>
      )}

      {canVote && (
        <div
          style={{
            marginTop: 16,
            padding: 8,
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadius,
            fontSize: 12,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Space size={2}>
              <Tag color="gold">Pending</Tag>
              <Text>{userName(currentUser)}</Text>
            </Space>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <Space>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveClick}>
              Approve Request
            </Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={handleDenyClick}>
              Reject Request
            </Button>
          </Space>
        </div>
      )}

      <Modal
        title={actionApproved ? 'Approve request' : 'Reject request'}
        open={actionModalOpen}
        onCancel={() => !submitting && setActionModalOpen(false)}
        onOk={handleActionSubmit}
        confirmLoading={submitting}
        okText={actionApproved ? 'Approve Request' : 'Reject Request'}
        okButtonProps={actionApproved ? {} : { danger: true }}
      >
        {actionApproved && isFinalVote && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: 12,
              background: token.colorWarningBg,
              border: `1px solid ${token.colorWarningBorder}`,
              borderRadius: token.borderRadius,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <ExclamationCircleOutlined style={{ color: token.colorWarning, marginTop: 2 }} />
            <Text style={{ fontSize: 13 }}>
              Your vote is the final approval required. Once submitted, this action will be executed immediately and <strong>cannot be undone</strong>.
            </Text>
          </div>
        )}
        {!actionApproved ? (
          <Form layout="vertical">
            <Form.Item
              label="Reason"
              name="comment"
              rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
            >
              <TextArea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Please provide a reason for rejection..."
              />
            </Form.Item>
          </Form>
        ) : (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text>Optional reason:</Text>
            </div>
            <TextArea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
            />
          </div>
        )}
      </Modal>
    </>
  )
}
