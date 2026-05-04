import { useState, useEffect } from 'react'
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
  Divider,
  Form,
} from 'antd'
import { ToolOutlined, CheckCircleOutlined, CloseCircleOutlined, UndoOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { App } from 'antd'
import { useAuthSession } from '@/features/authentication'
import { getAdminList } from '../../../services/staffService'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input
const REQUEST_EXPIRY_HOURS = 48

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

function entityId(entity) {
  if (!entity) return ''
  if (typeof entity === 'string') return entity
  if (typeof entity === 'object') return String(entity._id ?? entity.id ?? '')
  return String(entity)
}

export default function MaintenanceRequestDetailPanel({ approval, allApprovals, onApprove, onUndoVote, onCancelApproved, onRefresh }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const { currentUser } = useAuthSession()
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionApproved, setActionApproved] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [admins, setAdmins] = useState([])
  const [localApproval, setLocalApproval] = useState(approval)

  const currentUserId = entityId(currentUser)
  const isPending = localApproval?.status === 'pending'
  const hasVoted = localApproval?.approvals?.some(
    (a) => entityId(a.adminId) === currentUserId
  )
  const myVote = localApproval?.approvals?.find(
    (a) => entityId(a.adminId) === currentUserId
  )
  const requesterId = entityId(localApproval?.requestedBy)
  const requesterEmail = userEmail(localApproval?.requestedBy).toLowerCase()
  const currentUserEmail = userEmail(currentUser).toLowerCase()
  const isRequester = localApproval ? requesterId === currentUserId : false
  const canVote = isPending && !hasVoted && !isRequester
  const scheduledStart = localApproval?.requestDetails?.scheduledStartAt ? dayjs(localApproval.requestDetails.scheduledStartAt) : null
  const isApprovedUpcoming = localApproval?.status === 'approved' && scheduledStart?.isValid() && scheduledStart.isAfter(dayjs())

  const getUndoDeadline = () => {
    if (!myVote?.timestamp) return null

    const now = dayjs()
    const voteTime = dayjs(myVote.timestamp)
    const deadlines = []

    // 24-hour undo window from vote time
    deadlines.push(voteTime.add(24, 'hour'))

    // Request expiry (48 hours from creation)
    if (localApproval?.createdAt) {
      deadlines.push(dayjs(localApproval.createdAt).add(48, 'hour'))
    }

    // Scheduled start time
    if (localApproval?.requestDetails?.scheduledStartAt) {
      deadlines.push(dayjs(localApproval.requestDetails.scheduledStartAt))
    }

    // Expected resume time
    if (localApproval?.requestDetails?.expectedResumeAt) {
      deadlines.push(dayjs(localApproval.requestDetails.expectedResumeAt))
    }

    // Return the earliest deadline that's in the future
    const futureDeadlines = deadlines.filter(d => d.isAfter(now))
    if (futureDeadlines.length === 0) return null

    return futureDeadlines.sort((a, b) => a.diff(b))[0]
  }

  const hasOverlappingMaintenance = () => {
    if (!localApproval?.requestDetails || !allApprovals) return false

    const details = localApproval.requestDetails
    const startAt = details.scheduledStartAt ? dayjs(details.scheduledStartAt) : null
    const endAt = details.expectedResumeAt ? dayjs(details.expectedResumeAt) : null

    if (!startAt || !endAt) return false

    // Check for overlapping maintenance with approved/pending status (excluding current approval)
    return allApprovals.some(a => {
      if (a.approvalId === localApproval.approvalId) return false
      if (a.status !== 'approved' && a.status !== 'pending') return false
      if (a.requestType !== 'maintenance_mode') return false

      const aStart = a.requestDetails?.scheduledStartAt ? dayjs(a.requestDetails.scheduledStartAt) : null
      const aEnd = a.requestDetails?.expectedResumeAt ? dayjs(a.requestDetails.expectedResumeAt) : null

      if (!aStart || !aEnd) return false

      // Check for overlap
      return startAt.isBefore(aEnd) && endAt.isAfter(aStart)
    })
  }

  // Update local approval when prop changes
  useEffect(() => {
    setLocalApproval(approval)
  }, [approval])

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const list = await getAdminList()
        setAdmins(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Failed to fetch admins', err)
      }
    }
    fetchAdmins()
  }, [])

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
    
    // Require comment when rejecting
    if (!actionApproved && !comment.trim()) {
      return
    }
    
    setSubmitting(true)
    try {
      await onApprove(approval.approvalId, actionApproved, comment)
      setActionModalOpen(false)
      // Update local approval to immediately reflect the vote
      setLocalApproval(prev => ({
        ...prev,
        approvals: [
          ...(prev.approvals || []),
          {
            adminId: currentUser,
            approved: actionApproved,
            comment,
            timestamp: new Date().toISOString()
          }
        ]
      }))
      onRefresh?.()
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelApproved = async () => {
    if (!approval?.approvalId || !isApprovedUpcoming || !onCancelApproved) return
    setSubmitting(true)
    try {
      await onCancelApproved(approval.approvalId)
      onRefresh?.()
    } finally {
      setSubmitting(false)
    }
  }

  const handleUndoVote = async () => {
    console.log('handleUndoVote called')
    if (!localApproval?.approvalId || !onUndoVote) {
      console.log('Undo blocked: missing approvalId or onUndoVote')
      return
    }
    
    if (hasOverlappingMaintenance()) {
      console.log('Undo blocked due to overlap')
      message.error('Cannot undo: overlapping maintenance exists')
      return
    }
    
    const deadline = getUndoDeadline()
    if (!deadline) {
      console.log('Undo blocked: deadline passed')
      message.error('Undo no longer available')
      return
    }
    
    console.log('Undo proceeding...')
    setSubmitting(true)
    try {
      await onUndoVote(localApproval.approvalId)
      message.success('Vote undone successfully')
      onRefresh?.()
    } catch (err) {
      console.error('Failed to undo vote:', err)
      message.error(err?.message || 'Failed to undo vote')
    } finally {
      setSubmitting(false)
    }
  }

  const isExecuted = !!localApproval?.executedAt

  const isFinalVote = (() => {
    if (!isPending || !localApproval) return false
    const currentApprovedCount = (localApproval.approvals || []).filter((a) => a.approved === true).length
    const required = localApproval.requiredApprovals || 2
    return currentApprovedCount === required - 1
  })()

  const canUndoVote = () => {
    if (isExecuted) return false
    const deadline = getUndoDeadline()
    if (deadline === null) return false
    if (hasOverlappingMaintenance()) return false
    return true
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
  const requestExpiryDate = approval?.createdAt
    ? dayjs(approval.createdAt).add(REQUEST_EXPIRY_HOURS, 'hour')
    : null
  const requestExpiryText = requestExpiryDate?.isValid() && (approval?.status === 'pending' || approval?.status === 'expired')
    ? approval?.status === 'expired'
      ? `Request expired on ${requestExpiryDate.format('MMM D, YYYY HH:mm')}`
      : `Request expires on ${requestExpiryDate.format('MMM D, YYYY HH:mm')}`
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text strong style={{ fontSize: 16, lineHeight: '1.4' }}>
            {details.reason || 'No reason provided'}
          </Text>
          <Tag color={approval.status === 'pending' ? 'gold' : approval.status === 'approved' ? 'green' : approval.status === 'expired' ? 'default' : approval.status === 'cancelled' ? 'orange' : 'red'} style={{ textTransform: 'capitalize' }}>{approval.status}</Tag>
        </div>
      </div>

      <div style={{ padding: 16, flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Descriptions
          column={1}
          size="small"
          bordered
          style={{ marginBottom: 16 }}
          styles={{ label: { color: token.colorTextSecondary, width: 140 } }}
        >
          <Descriptions.Item label="ID">{approval.approvalId}</Descriptions.Item>
          <Descriptions.Item label="Requested by">
            <div>
              <div>
                {userName(approval.requestedBy)} {userEmail(approval.requestedBy) && `(${userEmail(approval.requestedBy)})`}
                {approval.createdAt && ` on ${dayjs(approval.createdAt).format('MMM D, YYYY HH:mm')}`}
              </div>
              {requestExpiryText && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {requestExpiryText}
                </Text>
              )}
            </div>
          </Descriptions.Item>
          {details.action !== 'disable' && (
            details.scheduledStartAt ? (
              <Descriptions.Item label="Starts">
                {dayjs(details.scheduledStartAt).format('MMM D, YYYY HH:mm')}
              </Descriptions.Item>
            ) : (
              <Descriptions.Item label="Starts">Immediately after approval</Descriptions.Item>
            )
          )}
          {details.expectedResumeAt && (
            <Descriptions.Item label="Resumes">
              {dayjs(details.expectedResumeAt).format('MMM D, YYYY HH:mm')}
            </Descriptions.Item>
          )}
          {details.message != null && details.message !== '' && details.message !== details.reason && (
            <Descriptions.Item label="Message">{details.message}</Descriptions.Item>
          )}
          {approval.executedAt && (
            <Descriptions.Item label="Executed at">
              {dayjs(approval.executedAt).format('MMM D, YYYY HH:mm')}
            </Descriptions.Item>
          )}
        </Descriptions>

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
            <Button icon={<UndoOutlined />} onClick={() => handleUndoVote()} disabled={isExecuted || !canUndoVote()}>
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

        {isApprovedUpcoming && (
          <Space style={{ marginTop: 16 }}>
            <Button danger loading={submitting} onClick={handleCancelApproved}>
              Request cancellation
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
    </div>
  )
}
