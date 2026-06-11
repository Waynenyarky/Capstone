import { useState, useCallback, useEffect } from 'react'
import { Typography, Table, Empty, Button, Tag, Modal, Upload, Space, Input, App } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPostRequirements, submitCompliance, requestExtension } from '../../../services/postRequirementsService'
import { formatDate } from '../../../utils/formatters.js'

const { Text } = Typography

export default function PostRequirementsTab({ businessId }) {
  const { message: msg } = App.useApp()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [complianceModal, setComplianceModal] = useState(null)
  const [complianceFiles, setComplianceFiles] = useState([])
  const [extensionModal, setExtensionModal] = useState(null)
  const [extensionDate, setExtensionDate] = useState(null)
  const [extensionReason, setExtensionReason] = useState('')

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPostRequirements({ businessId })
      .then(data => setRequirements(Array.isArray(data) ? data : data?.data || data?.requirements || []))
      .catch(() => setRequirements([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmitCompliance = async () => {
    if (!complianceModal) return
    if (complianceFiles.length === 0) { msg.warning('Please attach at least one document'); return }
    setActionLoading(complianceModal)
    try {
      const docs = complianceFiles.map(f => f.response?.url || f.response?.cid || f.name || f.uid)
      await submitCompliance(complianceModal, { submittedDocuments: docs })
      msg.success('Compliance submitted')
      setComplianceModal(null)
      setComplianceFiles([])
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to submit compliance')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequestExtension = async () => {
    if (!extensionModal) return
    if (!extensionDate) { msg.warning('Please select a new due date'); return }
    if (!extensionReason.trim()) { msg.warning('Please provide a reason'); return }
    setActionLoading(extensionModal)
    try {
      await requestExtension(extensionModal, { newDueDate: extensionDate.toISOString(), reason: extensionReason.trim() })
      msg.success('Extension requested')
      setExtensionModal(null)
      setExtensionDate(null)
      setExtensionReason('')
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to request extension')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { title: 'Requirement', dataIndex: 'requirementType', key: 'type', render: (v, r) => v || r.description || 'N/A' },
    {
      title: 'Due Date', dataIndex: 'dueDate', key: 'due', width: 130,
      render: v => {
        const isOverdue = v && dayjs(v).isBefore(dayjs())
        return <Text type={isOverdue ? 'danger' : undefined}>{formatDate(v)} {isOverdue && '(Overdue)'}</Text>
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: v => <Tag color={v === 'verified' ? 'success' : v === 'overdue' ? 'error' : v === 'submitted' ? 'processing' : 'default'}>{v || 'N/A'}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_, r) => {
        const id = r._id || r.requirementId
        if (r.status === 'verified') return null
        return (
          <Space size="small">
            {r.status === 'pending' || r.status === 'overdue' || r.status === 'non_compliant' ? (
              <Button size="small" type="primary" loading={actionLoading === id} onClick={() => { setComplianceModal(id); setComplianceFiles([]) }}>Submit</Button>
            ) : null}
            {r.status !== 'verified' && (
              <Button size="small" loading={actionLoading === id} onClick={() => { setExtensionModal(id); setExtensionDate(null); setExtensionReason('') }}>Extend</Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Table
        size="small"
        rowKey={r => r._id || r.requirementId}
        columns={columns}
        dataSource={requirements}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No post-requirements" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
      <Modal title="Submit Compliance Documents" open={!!complianceModal} onCancel={() => setComplianceModal(null)} onOk={handleSubmitCompliance} confirmLoading={!!actionLoading} okText="Submit">
        <Upload.Dragger
          multiple
          fileList={complianceFiles}
          onChange={({ fileList }) => setComplianceFiles(fileList)}
          beforeUpload={() => false}
        >
          <p style={{ padding: '8px 0' }}><UploadOutlined style={{ fontSize: 24 }} /></p>
          <p>Click or drag files to attach compliance documents</p>
        </Upload.Dragger>
      </Modal>
      <Modal title="Request Extension" open={!!extensionModal} onCancel={() => setExtensionModal(null)} onOk={handleRequestExtension} confirmLoading={!!actionLoading} okText="Request">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>New Due Date</Text>
            <Input type="date" value={extensionDate ? dayjs(extensionDate).format('YYYY-MM-DD') : ''} onChange={e => setExtensionDate(e.target.value ? dayjs(e.target.value) : null)} style={{ width: '100%' }} />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Reason for Extension</Text>
            <Input.TextArea rows={3} value={extensionReason} onChange={e => setExtensionReason(e.target.value)} placeholder="Explain why you need more time..." />
          </div>
        </Space>
      </Modal>
    </>
  )
}
