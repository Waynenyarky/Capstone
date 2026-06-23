import { useEffect } from 'react'
import { Form, Input, Select, DatePicker, Button, Typography, Tag, theme } from 'antd'
import { SaveOutlined, SendOutlined, DeleteOutlined, RollbackOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text } = Typography

export default function AnnouncementEditor({ selected, saving, onSave, onDelete, onUnpublish, audience, form: externalForm, onFillTestData }) {
  const [form] = Form.useForm()
  const { token } = theme.useToken()
  const actualForm = externalForm || form

  useEffect(() => {
    if (selected) {
      actualForm.setFieldsValue({
        title: selected.title || '',
        body: selected.body || '',
        priority: selected.priority || 'normal',
        isActive: selected.isActive !== false,
        publishAt: selected.publishAt ? dayjs(selected.publishAt) : null,
        expiresAt: selected.expiresAt ? dayjs(selected.expiresAt) : null,
      })
    }
  }, [selected, actualForm])

  const statusColors = { draft: 'orange', published: 'green' }

  const handleSave = async (publish = false) => {
    try {
      const values = await actualForm.validateFields()
      await onSave(selected._id, values, publish)
    } catch {
      // Validation error
    }
  }

  if (!selected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Text type="secondary">Select an announcement to edit</Text>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <Tag color={statusColors[selected.status] || 'default'}>
            {(selected.status || 'draft').toUpperCase()}
          </Tag>
          <Tag color="blue">
            {audience === 'staff' ? 'STAFF' : 'PUBLIC'}
          </Tag>
          <Tag color="blue">
            Created {selected.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY') : '-'}
          </Tag>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
          {selected.status === 'draft' && (
            <>
              {onFillTestData && (
                <Button icon={<FileTextOutlined />} onClick={onFillTestData}>
                  Fill with test data
                </Button>
              )}
              <Button icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving}>
                Save Draft
              </Button>
              <Button type="primary" icon={<SendOutlined />} onClick={() => handleSave(true)} loading={saving}>
                Publish
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(selected._id)}>
                Delete
              </Button>
            </>
          )}
          {selected.status === 'published' && (
            <Button icon={<RollbackOutlined />} onClick={() => onUnpublish && onUnpublish(selected._id)} loading={saving}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, padding: 16 }}>
        <Form form={actualForm} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="Announcement title" disabled={selected.status === 'published'} />
          </Form.Item>
          <Form.Item
            name="body"
            label="Content"
            rules={[{ required: true, message: 'Content is required' }]}
          >
            <TextArea
              rows={8}
              placeholder="Announcement content. Include detailed information, deadlines, and instructions."
              disabled={selected.status === 'published'}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <Form.Item name="priority" label="Priority">
              <Select
                disabled={selected.status === 'published'}
                options={[
                  { value: 'urgent', label: '🔴 Urgent' },
                  { value: 'high', label: '🟠 High' },
                  { value: 'normal', label: '🟡 Normal' },
                  { value: 'low', label: '🟢 Low' },
                ]}
                placeholder="Select priority level"
              />
            </Form.Item>
            <Form.Item name="publishAt" label="Publish At">
              <DatePicker
                showTime
                style={{ width: '100%' }}
                disabled={selected.status === 'published'}
                placeholder="Optional: schedule for future"
              />
            </Form.Item>
            <Form.Item name="expiresAt" label="Expires At" style={{ gridColumn: 'span 2' }}>
              <DatePicker
                style={{ width: '100%' }}
                disabled={selected.status === 'published'}
                placeholder="Optional: auto-hide after this date"
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  )
}
