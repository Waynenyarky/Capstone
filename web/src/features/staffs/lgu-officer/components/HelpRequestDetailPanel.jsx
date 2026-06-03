import { useState, useEffect, useCallback } from 'react'
import { Typography, Button, Tag, Select, Input, Tabs, Empty, Divider, message, theme, Upload, Timeline, Space, Grid } from 'antd'
import {
  ArrowLeftOutlined, UserOutlined, CustomerServiceOutlined,
  SendOutlined, UploadOutlined, FileTextOutlined,
  ClockCircleOutlined, CommentOutlined,
} from '@ant-design/icons'
import { get, put, post } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

const STATUS_CONFIG = {
  open: { color: 'blue', label: 'Open' },
  in_progress: { color: 'processing', label: 'In Progress' },
  needs_response: { color: 'orange', label: 'Needs Response' },
  waiting_for_business_owner: { color: 'purple', label: 'Waiting for Owner' },
  closed: { color: 'success', label: 'Closed' },
  invalid: { color: 'default', label: 'Invalid' },
}

const PRIORITY_CONFIG = {
  high: { color: '#ff4d4f', label: 'High', tagColor: 'error' },
  normal: { color: '#1677ff', label: 'Normal', tagColor: 'processing' },
  low: { color: '#8c8c8c', label: 'Low', tagColor: 'default' },
}

export default function HelpRequestDetailPanel({ request, onBack, onRefresh }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
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

  const handleClaim = async () => {
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
  }

  const handleRelease = async () => {
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isClaimed = detail?.claimedBy
  const isClaimedByMe = detail?.claimedBy && String(detail.claimedBy) === String(currentUser?.id || currentUser?._id)
  const statusConf = STATUS_CONFIG[detail?.status] || STATUS_CONFIG.open
  const priorityConf = PRIORITY_CONFIG[detail?.priority] || PRIORITY_CONFIG.low

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

  const tabItems = [
    {
      key: 'details',
      label: 'Details',
      children: (
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Request Info */}
          <div style={{ padding: 16, background: token.colorBgLayout, borderRadius: token.borderRadius }}>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</Text>
              <div><Text strong>{detail.subject}</Text></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</Text>
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{detail.message}</Paragraph>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact Email</Text>
                <div><Text>{detail.contactEmail}</Text></div>
              </div>
              {detail.businessPermitNumber && (
                <div>
                  <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Permit No.</Text>
                  <div><Text code>{detail.businessPermitNumber}</Text></div>
                </div>
              )}
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Submitted</Text>
                <div><Text>{formatDateTime(detail.createdAt)}</Text></div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isClaimed ? (
              <Button type="primary" onClick={handleClaim} loading={claiming} size="small">
                Claim Request
              </Button>
            ) : isClaimedByMe ? (
              <Button onClick={handleRelease} loading={claiming} size="small">
                Release Request
              </Button>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Claimed by: {detail.claimedByName}
              </Text>
            )}
          </div>

          {/* Status & Priority Controls */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Status</Text>
              <Select
                value={detail.status}
                onChange={handleStatusChange}
                loading={updatingStatus}
                size="small"
                style={{ width: 180 }}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'needs_response', label: 'Needs Response' },
                  { value: 'waiting_for_business_owner', label: 'Waiting for Owner' },
                  { value: 'closed', label: 'Closed' },
                  { value: 'invalid', label: 'Invalid' },
                ]}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Priority</Text>
              <Select
                value={detail.priority}
                onChange={handlePriorityChange}
                loading={updatingPriority}
                size="small"
                style={{ width: 120 }}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'conversation',
      label: `Conversation (${(detail.messages || []).length})`,
      children: (
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Upload
                fileList={replyAttachments}
                onChange={({ fileList }) => setReplyAttachments(fileList)}
                beforeUpload={() => false}
                maxCount={3}
              >
                <Button icon={<UploadOutlined />} size="small">Attach</Button>
              </Upload>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendReply}
                loading={sending}
                disabled={!replyContent.trim()}
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
      ),
    },
    {
      key: 'notes',
      label: `Notes (${(detail.internalNotes || []).length})`,
      children: (
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            />
            <Button
              onClick={handleAddNote}
              loading={addingNote}
              disabled={!noteContent.trim()}
              size="small"
              style={{ alignSelf: 'flex-end' }}
            >
              Add Note
            </Button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} size="small" />
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 14 }} ellipsis>{detail.subject}</Text>
          <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{detail.requestId}</Text>
            <Tag color={statusConf.color} style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 6px' }}>
              {statusConf.label}
            </Tag>
            <Tag color={priorityConf.tagColor} style={{ fontSize: 10, margin: 0, lineHeight: '16px', padding: '0 6px' }}>
              {priorityConf.label}
            </Tag>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        <Tabs
          items={tabItems}
          defaultActiveKey="details"
          size="small"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
