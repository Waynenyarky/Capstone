import { Typography, Card, Button, Input, Empty, theme } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography
const { TextArea } = Input

export default function HelpRequestInternalNotes({
  detail,
  noteContent,
  addingNote,
  isClaimedByMe,
  onNoteChange,
  onAddNote,
  formatDateTime,
}) {
  const { token } = theme.useToken()

  return (
    <Card
      size="small"
      title="Internal Notes"
      style={{
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        background: token.colorBgContainer,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Notes List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${token.colorBorder}`, padding: '12px', minHeight: 0 }}>
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
                  border: `1px solid ${token.colorBorder}`,
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
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: '12px', alignItems: 'stretch' }}>
          <TextArea
            placeholder="Internal note (visible to officers only)..."
            value={noteContent}
            onChange={(e) => onNoteChange(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            maxLength={1000}
            disabled={!isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
            style={{ flex: 1 }}
          />
          <Button
            onClick={onAddNote}
            loading={addingNote}
            disabled={!noteContent.trim() || !isClaimedByMe || detail.status === 'closed' || detail.status === 'invalid'}
            style={{ height: 'auto' }}
          >
            <PlusOutlined />
          </Button>
        </div>
      </div>
    </Card>
  )
}
