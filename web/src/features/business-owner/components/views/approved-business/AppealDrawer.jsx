import { useState } from 'react'
import { Typography, Drawer, Select, Input, Button, Upload, App } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { submitAppeal } from '../../../services/appealsService'

const { Text } = Typography
const { TextArea } = Input

export default function AppealDrawer({ open, onClose, business, onSuccess }) {
  const { message } = App.useApp()
  const [appealType, setAppealType] = useState(null)
  const [subject, setSubject] = useState('')
  const [grounds, setGrounds] = useState('')
  const [fileList, setFileList] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!appealType || !subject.trim() || !grounds.trim()) {
      message.warning('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      const evidence = fileList
        .map(f => f.response?.url || f.url || f.name)
        .filter(Boolean)
      await submitAppeal({ businessId, appealType, subject, grounds, evidence })
      message.success('Appeal submitted')
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(err?.message || 'Failed to submit appeal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title="File Appeal"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button type="primary" onClick={handleSubmit} loading={submitting}>
          Submit Appeal
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong>Appeal Type *</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select appeal type"
            value={appealType}
            onChange={setAppealType}
            options={[
              { value: 'rejection', label: 'Rejection Appeal' },
              { value: 'violation', label: 'Violation Appeal' },
            ]}
          />
        </div>
        <div>
          <Text strong>Subject *</Text>
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief subject for your appeal"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Grounds for Appeal *</Text>
          <TextArea
            rows={5}
            value={grounds}
            onChange={e => setGrounds(e.target.value)}
            placeholder="Provide detailed grounds for your appeal..."
            style={{ marginTop: 8 }}
            maxLength={2000}
            showCount
          />
        </div>
        <div>
          <Text strong>Supporting Evidence</Text>
          <Upload
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={() => false}
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            maxCount={5}
            style={{ marginTop: 8 }}
          >
            <Button icon={<UploadOutlined />} style={{ marginTop: 8 }}>Upload files (max 5)</Button>
          </Upload>
        </div>
      </div>
    </Drawer>
  )
}
