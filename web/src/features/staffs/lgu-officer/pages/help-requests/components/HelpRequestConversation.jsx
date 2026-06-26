import { useEffect } from 'react'
import { Typography, Card, Button, Input, Empty, Tag, theme } from 'antd'
import { SendOutlined, FileTextOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export default function HelpRequestConversation({
  detail,
  replyContent,
  isClaimedByMe,
  onReplyChange,
  onSendReply,
  formatDateTime,
  messagesContainerRef,
  messagesEndRef,
}) {
  const { token } = theme.useToken()

  // Auto-scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [detail?.messages, messagesContainerRef])

  return (
    <Card
      size="small"
      title="Conversation"
      style={{
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        background: token.colorBgContainer,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Message Thread */}
        <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${token.colorBorder}`, padding: '12px 12px', minHeight: 0 }}>
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
                    background:  'transparent',
                    border: `1px solid ${token.colorBorder}`,
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
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: '12px', alignItems: 'stretch' }}>
          <TextArea
            placeholder="Type your response..."
            value={replyContent}
            onChange={(e) => onReplyChange(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            maxLength={2000}
            disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={onSendReply}
            disabled={!replyContent.trim() || !isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
            style={{ height: 'auto' }}
          >
            <SendOutlined />
          </Button>
        </div>
      </div>
    </Card>
  )
}
