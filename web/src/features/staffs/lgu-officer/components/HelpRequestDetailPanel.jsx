import { useState, useEffect, useCallback, useRef } from 'react'
import { Typography, Button, Tag, Select, Input, Empty, Divider, message, theme, Card, Grid, Form, Modal, Drawer } from 'antd'
import {
  SendOutlined, FileTextOutlined, CheckOutlined, CloseOutlined, HistoryOutlined, PlusOutlined, BookOutlined,
} from '@ant-design/icons'
import { get, put, post } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'
import HelpRequestAuditHistoryModal from './HelpRequestAuditHistoryModal'
import DynamicPageContent from '@/shared/components/DynamicPageContent'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

const STATUS_CONFIG = {
  open: { color: 'blue', label: 'Open' },
  in_progress: { color: 'gold', label: 'In Progress' },
  needs_response: { color: 'volcano', label: 'Needs Response' },
  waiting_for_business_owner: { color: 'cyan', label: 'Waiting for Owner' },
  closed: { color: 'green', label: 'Closed' },
  invalid: { color: 'default', label: 'Invalid' },
}

export default function HelpRequestDetailPanel({ request, onRefresh }) {
  const { token } = theme.useToken()
  const { currentUser } = useAuthSession()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [manualVisible, setManualVisible] = useState(false)
  const [replyConfirmOpen, setReplyConfirmOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const fetchDetail = useCallback(async () => {
    if (!request?.requestId) return
    setLoading(true)
    try {
      const res = await get(`/api/help-requests/${request.requestId}`, { skipAutoLogout: true })
      setDetail(res?.data || null)
    } catch (err) {
      message.error('Failed to load request details')
    } finally {
      setLoading(false)
    }
  }, [request?.requestId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Auto-scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [detail?.messages])

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Calculate status lock status
  const getStatusLockInfo = () => {
    if (!detail) return null
    // Only show status lock for terminal statuses (closed, invalid)
    const isTerminalStatus = ['closed', 'invalid'].includes(detail.status)
    if (!isTerminalStatus) return null

    // Use statusChangedAt if available, otherwise fallback to createdAt for legacy data
    const statusChangedAt = detail.statusChangedAt || detail.createdAt
    if (!statusChangedAt) return null

    const now = new Date()
    const changedAt = new Date(statusChangedAt)
    const hoursSinceChange = (now - changedAt) / (1000 * 60 * 60)

    if (hoursSinceChange >= 24) {
      return {
        locked: true,
        message: `Status permanent since ${formatDateTime(statusChangedAt)}`,
      }
    }

    const lockDate = new Date(changedAt.getTime() + 24 * 60 * 60 * 1000)
    return {
      locked: false,
      message: `Status can be changed until ${formatDateTime(lockDate)}`,
    }
  }

  const statusLockInfo = getStatusLockInfo()

  const isClaimed = detail?.claimedBy
  const isClaimedByMe = detail?.claimedBy && String(detail.claimedBy) === String(currentUser?.id || currentUser?._id)
  const screens = useBreakpoint()

  const handleClaim = async () => {
    if (isClaimed && !isClaimedByMe) {
      Modal.confirm({
        title: 'Override Claim',
        content: `This help request is already claimed by ${detail.claimedByName}. Are you sure you want to override their claim?`,
        okText: 'Override',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        onOk: async () => {
          setClaiming(true)
          try {
            await put(`/api/help-requests/${request.requestId}/claim`)
            message.success('Request claimed')
            fetchDetail()
            onRefresh?.()
          } catch (err) {
            message.error(err?.error?.message || 'Failed to claim')
          } finally {
            setClaiming(false)
          }
        },
      })
    } else {
      Modal.confirm({
        title: 'Claim Request',
        content: `Are you sure you want to claim this help request? (${detail.requestId})`,
        okText: 'Claim',
        cancelText: 'Cancel',
        onOk: async () => {
          setClaiming(true)
          try {
            await put(`/api/help-requests/${request.requestId}/claim`)
            message.success('Request claimed')
            fetchDetail()
            onRefresh?.()
          } catch (err) {
            message.error(err?.error?.message || 'Failed to claim')
          } finally {
            setClaiming(false)
          }
        },
      })
    }
  }

  const handleRelease = async () => {
    Modal.confirm({
      title: 'Release Request',
      content: `Are you sure you want to release this help request? (${detail.requestId})`,
      okText: 'Release',
      cancelText: 'Cancel',
      onOk: async () => {
        setClaiming(true)
        try {
          await put(`/api/help-requests/${request.requestId}/release`)
          message.success('Request released')
          fetchDetail()
          onRefresh?.()
        } catch (err) {
          message.error(err?.error?.message || 'Failed to release')
        } finally {
          setClaiming(false)
        }
      },
    })
  }

  const handleStatusChange = async (status) => {
    const newStatusLabel = STATUS_CONFIG[status]?.label || status

    const getStatusMessage = (newStatus) => {
      switch (newStatus) {
        case 'closed':
          return `This will close the request and send a notification to the business owner. The status can be reopened within 24 hours.`
        case 'invalid':
          return `This will mark the request as invalid and send a notification to the business owner. The status can be changed within 24 hours.`
        case 'in_progress':
          return `This will indicate that the request is being actively worked on.`
        case 'needs_response':
          return `This will indicate that a response is needed from the business owner.`
        case 'waiting_for_business_owner':
          return `This will indicate that the request is waiting for action from the business owner.`
        case 'open':
          return `This will reopen the request and make it available for processing.`
        default:
          return `Are you sure you want to change the status to ${newStatusLabel}?`
      }
    }

    Modal.confirm({
      title: 'Change Status',
      content: getStatusMessage(status),
      okText: 'Change',
      cancelText: 'Cancel',
      onOk: async () => {
        setUpdatingStatus(true)
        try {
          await put(`/api/help-requests/${request.requestId}/status`, { status })
          message.success(`Status updated to ${newStatusLabel}`)
          fetchDetail()
          onRefresh?.()
        } catch (err) {
          message.error(err?.error?.message || 'Failed to update status')
        } finally {
          setUpdatingStatus(false)
        }
      },
    })
  }

  const handlePriorityChange = async (priority) => {
    const priorityLabels = { low: 'Low', normal: 'Normal', high: 'High' }
    const newPriorityLabel = priorityLabels[priority] || priority

    const getPriorityMessage = (newPriority) => {
      switch (newPriority) {
        case 'high':
          return `This will mark the request as high priority, giving it faster response time and visibility.`
        case 'normal':
          return `This will set the request to normal priority with standard response time.`
        case 'low':
          return `This will mark the request as low priority, which may delay response time.`
        default:
          return `Are you sure you want to change the priority to ${newPriorityLabel}?`
      }
    }

    Modal.confirm({
      title: 'Change Priority',
      content: getPriorityMessage(priority),
      okText: 'Change',
      cancelText: 'Cancel',
      onOk: async () => {
        setUpdatingPriority(true)
        try {
          await put(`/api/help-requests/${request.requestId}/priority`, { priority })
          message.success(`Priority updated to ${newPriorityLabel}`)
          fetchDetail()
          onRefresh?.()
        } catch (err) {
          message.error(err?.error?.message || 'Failed to update priority')
        } finally {
          setUpdatingPriority(false)
        }
      },
    })
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) return message.warning('Please enter a message')
    setReplyConfirmOpen(true)
  }

  const confirmSendReply = async () => {
    setReplyConfirmOpen(false)
    setSending(true)
    try {
      await post(`/api/help-requests/${request.requestId}/messages`, {
        content: replyContent.trim(),
        attachments: [],
      })
      message.success('Reply sent & email notification delivered')
      setReplyContent('')
      fetchDetail()
      onRefresh?.()
    } catch (err) {
      message.error(err?.error?.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return message.warning('Please enter a note')
    setAddingNote(true)
    try {
      await post(`/api/help-requests/${request.requestId}/internal-notes`, {
        content: noteContent.trim(),
      })
      message.success('Internal note added')
      setNoteContent('')
      fetchDetail()
    } catch (err) {
      message.error(err?.error?.message || 'Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  if (loading && !detail) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text type="secondary">Loading...</Text>
      </div>
    )
  }

  if (!detail) {
    return <Empty description="Request not found" />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        {/* Row 1: Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', width: screens.md ? 'auto' : '100%' }}>
            {!isClaimed ? (
              <Button type="primary" onClick={handleClaim} loading={claiming} style={{ flex: screens.xs ? 1 : 'auto' }}>
                Claim Request <CheckOutlined />
              </Button>
            ) : isClaimedByMe ? (
              <Button onClick={handleRelease} loading={claiming} disabled={detail.status === 'closed' || detail.status === 'invalid'} style={{ flex: screens.xs ? 1 : 'auto' }}>
                Release Request <CloseOutlined />
              </Button>
            ) : (
              <Button onClick={handleClaim} loading={claiming} style={{ flex: screens.xs ? 1 : 'auto' }}>
                Claimed by: {detail.claimedByName}
              </Button>
            )}
            <Button onClick={() => setHistoryModalOpen(true)} style={{ flex: screens.md ? 'auto' : 'none'}}>
              History <HistoryOutlined />
            </Button>
            <Button onClick={() => setManualVisible(true)} style={{ flex: screens.md ? 'auto' : 'none'}}>
              Manual <BookOutlined />
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', width: screens.md ? 'auto' : '100%' }}>
            <Form.Item label="Status" style={{ marginBottom: 0, flex: screens.md ? 'none' : 1 }}>
              <Select
                value={detail.status}
                onChange={handleStatusChange}
                loading={updatingStatus}
                style={{ width: screens.md ? 160 : '100%' }}
                disabled={statusLockInfo?.locked || (!isClaimedByMe && detail.status !== 'closed' && detail.status !== 'invalid')}
                options={
                  (detail.status === 'closed' || detail.status === 'invalid')
                    ? [
                        { value: 'open', label: 'Open' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'needs_response', label: 'Needs Response' },
                        { value: 'waiting_for_business_owner', label: 'Waiting for Owner' },
                        { value: 'closed', label: 'Closed' },
                        { value: 'invalid', label: 'Invalid' },
                      ]
                    : isClaimedByMe
                    ? [
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'needs_response', label: 'Needs Response' },
                        { value: 'waiting_for_business_owner', label: 'Waiting for Owner' },
                        { value: 'closed', label: 'Closed' },
                        { value: 'invalid', label: 'Invalid' },
                      ]
                    : [{ value: 'open', label: 'Open' }]
                }
              />
            </Form.Item>
            <Form.Item label="Priority" style={{ marginBottom: 0, flex: screens.md ? 'none' : 1 }}>
              <Select
                value={detail.priority}
                onChange={handlePriorityChange}
                loading={updatingPriority}
                style={{ width: screens.md ? 100 : '100%' }}
                disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </Form.Item>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Request Info */}
        <Card
          size="small"
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
          bodyStyle={{ padding: 0, display: 'flex', flexDirection: screens.md ? 'row' : 'column' }}
        >
          {/* Left Panel - Icon and Title */}
          <div style={{ flex: screens.md ? '0 0 50%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: screens.md ? '20px 16px' : '96px 24px 16px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Subject</Text>
              <Typography.Title level={5} style={{ margin: 0 }}>{detail.subject}</Typography.Title>
            </div>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Message</Text>
              <Text style={{ marginTop: 4, display: 'block' }}>
                {detail.message}
              </Text>
            </div>
          </div>

          {/* Right Panel - Details Grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: screens.md ? '24px' : '16px 24px 24px', borderLeft: screens.md ? `1px solid ${token.colorBorderSecondary}` : 'none', borderTop: screens.md ? 'none' : `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
                <div><Text strong>{detail.requestId}</Text></div>
              </div>
              <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Contact Email</Text>
                <div><Text strong>{detail.contactEmail}</Text></div>
              </div>
              {detail.businessPermitNumber && (
                <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Business Permit Number</Text>
                  <div><Text strong>{detail.businessPermitNumber}</Text></div>
                </div>
              )}
              <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Submitted On</Text>
                <div><Text strong>{formatDateTime(detail.createdAt)}</Text></div>
              </div>
              <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Last Updated</Text>
                <div><Text strong>{formatDateTime(detail.updatedAt)}</Text></div>
              </div>
              <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Claimed By</Text>
                <div><Text strong>{detail.claimedByName || 'Not claimed'}</Text></div>
              </div>
              {statusLockInfo && (
                <div style={{ minWidth: '100px', flex: '1 1 150px' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status Lock</Text>
                  <div><Text strong>{statusLockInfo.message}</Text></div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Conversation */}
        <Card
          size="small"
          title="Conversation"
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Message Thread */}
            <div ref={messagesContainerRef} style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${token.colorBorderSecondary}`, padding: "12px 12px" }}>
              {(detail.messages || []).length === 0 ? (
                <Empty description="No messages yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                (detail.messages || []).map((msg, idx) => {
                  const isOfficer = msg.sender === 'officer'
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: token.borderRadius,
                        background: isOfficer ? 'transparent' : token.colorBgLayout,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        alignSelf: isOfficer ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 12 }}>
                        <Text strong style={{ fontSize: 12 }}>
                          {isOfficer ? msg.senderName || 'Officer' : 'Requester'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{formatDateTime(msg.createdAt)}</Text>
                      </div>
                      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Paragraph>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {msg.attachments.map((cid, i) => (
                            <Tag key={i} icon={<FileTextOutlined />} style={{ fontSize: 11 }}>
                              Attachment {i + 1}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px' }}>
              <TextArea
                placeholder="Type your response..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                maxLength={2000}
                disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Button
                  type="primary"
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || !isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
                >
                  Send Reply <SendOutlined />
                </Button>
              </div>

            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card
          size="small"
          title="Internal Notes"
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Notes List */}
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${token.colorBorderSecondary}`, padding: '12px' }}>
              {(detail.internalNotes || []).length === 0 ? (
                <Empty description="No internal notes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                (detail.internalNotes || []).map((note, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: token.borderRadius,
                      background: 'transparent',
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 12 }}>
                      <Text strong style={{ fontSize: 12 }}>
                        {note.addedByName || 'Officer'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{formatDateTime(note.createdAt)}</Text>
                    </div>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </Paragraph>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px' }}>
              <TextArea
                placeholder="Internal note (visible to officers only)..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={2}
                maxLength={1000}
                disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
              />
              <Button
                onClick={handleAddNote}
                loading={addingNote}
                disabled={!noteContent.trim() || !isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
                style={{ alignSelf: 'flex-end' }}
              >
                Add Note <PlusOutlined />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <HelpRequestAuditHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        requestId={detail.requestId}
      />

      {screens.md ? (
        <Modal
          title="BizClear Manual"
          open={manualVisible}
          onCancel={() => setManualVisible(false)}
          footer={null}
          width={800}
          style={{ top: 20 }}
        >
          <DynamicPageContent slotId="bizclear-manual" embedded compact />
        </Modal>
      ) : (
        <Drawer
          title="BizClear Manual"
          open={manualVisible}
          onClose={() => setManualVisible(false)}
          placement="right"
          width="100%"
        >
          <DynamicPageContent slotId="bizclear-manual" embedded compact />
        </Drawer>
      )}

      <Modal
        title="Send Reply"
        open={replyConfirmOpen}
        onOk={confirmSendReply}
        onCancel={() => setReplyConfirmOpen(false)}
        okText="Send"
        cancelText="Cancel"
        okButtonProps={{ loading: sending }}
      >
        <p>Please ensure your reply is correct before sending. This message will be sent to the requester.</p>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Message Preview:</Text>
          <div style={{
            marginTop: 8,
            padding: 12,
            background: token.colorBgLayout,
            borderRadius: token.borderRadius,
            whiteSpace: 'pre-wrap',
            maxHeight: 200,
            overflowY: 'auto'
          }}>
            {replyContent}
          </div>
        </div>
      </Modal>
    </div>
  )
}
