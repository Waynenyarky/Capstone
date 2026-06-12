import { useState, useEffect, useCallback } from 'react'
import { Typography, Button, Tag, Select, Input, Empty, Divider, message, theme, Upload, Timeline, Card, Grid, Form, Modal } from 'antd'
import {
  UserOutlined, CustomerServiceOutlined,
  SendOutlined, UploadOutlined, FileTextOutlined, CheckOutlined, CloseOutlined, HistoryOutlined,
} from '@ant-design/icons'
import { get, put, post } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'
import HelpRequestAuditHistoryModal from './HelpRequestAuditHistoryModal'

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

const PRIORITY_CONFIG = {
  high: { color: 'red', label: 'High Priority' },
  normal: { color: 'blue', label: 'Normal Priority' },
  low: { color: 'default', label: 'Low Priority' },
}

export default function HelpRequestDetailPanel({ request, onRefresh }) {
  const { token } = theme.useToken()
  const { currentUser } = useAuthSession()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachments, setReplyAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

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
    setUpdatingStatus(true)
    try {
      await put(`/api/help-requests/${request.requestId}/status`, { status })
      message.success(`Status updated to ${STATUS_CONFIG[status]?.label || status}`)
      fetchDetail()
      onRefresh?.()
    } catch (err) {
      message.error(err?.error?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (priority) => {
    setUpdatingPriority(true)
    try {
      await put(`/api/help-requests/${request.requestId}/priority`, { priority })
      message.success(`Priority updated to ${priority}`)
      fetchDetail()
      onRefresh?.()
    } catch (err) {
      message.error(err?.error?.message || 'Failed to update priority')
    } finally {
      setUpdatingPriority(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) return message.warning('Please enter a message')
    setSending(true)
    try {
      await post(`/api/help-requests/${request.requestId}/messages`, {
        content: replyContent.trim(),
        attachments: [],
      })
      message.success('Reply sent & email notification delivered')
      setReplyContent('')
      setReplyAttachments([])
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
        {/* Row 1: Title */}
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16, lineHeight: '1.4' }}>
            {detail.subject}
          </Text>
        </div>
        {/* Row 2: Buttons */}
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
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryModalOpen(true)} style={{ flex: screens.md ? 'auto' : 'none'}}>
              History
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', width: screens.md ? 'auto' : '100%' }}>
            <Form.Item label="Status" style={{ marginBottom: 0, flex: screens.md ? 'none' : 1 }}>
              <Select
                value={detail.status}
                onChange={handleStatusChange}
                loading={updatingStatus}
                style={{ width: screens.md ? 160 : '100%' }}
                disabled={!isClaimedByMe && detail.status !== 'closed' && detail.status !== 'invalid'}
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
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            </div>
          </div>
        </Card>

        <Divider />

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Text strong style={{ fontSize: 14 }}>Conversation ({(detail.messages || []).length})</Text>
          {/* Message Thread */}
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                      background: isOfficer ? token.colorPrimaryBg : token.colorBgLayout,
                      border: `1px solid ${isOfficer ? token.colorPrimaryBorderHover : token.colorBorderSecondary}`,
                      alignSelf: isOfficer ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 12 }}>
                      <Text strong style={{ fontSize: 12 }}>
                        {isOfficer ? (
                          <><CustomerServiceOutlined style={{ marginRight: 4 }} />Officer</>
                        ) : (
                          <><UserOutlined style={{ marginRight: 4 }} />Business Owner</>
                        )}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{formatDateTime(msg.createdAt)}</Text>
                    </div>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
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
          </div>

          {/* Reply Form */}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text strong style={{ fontSize: 13 }}>Reply</Text>
            <TextArea
              placeholder="Type your response..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Upload
                fileList={replyAttachments}
                onChange={({ fileList }) => setReplyAttachments(fileList)}
                beforeUpload={() => false}
                maxCount={3}
                disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
              >
                <Button icon={<UploadOutlined />} size="small" disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}>Attach</Button>
              </Upload>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendReply}
                loading={sending}
                disabled={!replyContent.trim() || !isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
                size="small"
              >
                Send Reply
              </Button>
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              The business owner will be notified by email.
            </Text>
          </div>
        </div>

        <Divider />

        {/* Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Text strong style={{ fontSize: 14 }}>Internal Notes ({(detail.internalNotes || []).length})</Text>
          {/* Notes List */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {(detail.internalNotes || []).length === 0 ? (
              <Empty description="No internal notes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={(detail.internalNotes || []).map((note, idx) => ({
                  color: 'gray',
                  children: (
                    <div key={idx}>
                      <Text style={{ fontSize: 13 }}>{note.content}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {note.addedByName || 'Officer'} &middot; {formatDateTime(note.createdAt)}
                        </Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </div>

          {/* Add Note Form */}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text strong style={{ fontSize: 13 }}>Add Internal Note</Text>
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
              size="small"
              style={{ alignSelf: 'flex-end' }}
            >
              Add Note
            </Button>
          </div>
        </div>
      </div>

      <HelpRequestAuditHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        requestId={detail.requestId}
      />
    </div>
  )
}
