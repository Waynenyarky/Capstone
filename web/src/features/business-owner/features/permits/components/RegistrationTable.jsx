import React from 'react'
import { Table, Button, Tag, Space, Typography } from 'antd'
import { EyeOutlined, EditOutlined } from '@ant-design/icons'
import { getRegistrationStatusTag, formatDate } from '../constants/statusConfig.jsx'

const { Text } = Typography

const STATUS_FILTERS = [
  { text: 'Pending for Approval (incl. resubmitted)', value: 'pending' },
  { text: 'Approved', value: 'approved' },
  { text: 'Rejected', value: 'rejected' },
  { text: 'Needs Revision', value: 'needs_revision' },
  { text: 'Resubmit', value: 'resubmit' },
  { text: 'Draft', value: 'draft' },
  { text: 'In Progress', value: 'in_progress' }
]

export default function RegistrationTable({
  dataSource,
  loading,
  token,
  onViewRequirements,
  onEdit,
  onViewComments,
  canEdit
}) {
  const columns = [
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (ref) => (
        <Text copyable={ref !== 'N/A'} strong={ref !== 'N/A'} style={{ color: ref !== 'N/A' ? token.colorPrimary : undefined }}>{ref}</Text>
      )
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          {record.isPrimary && <Tag color="blue">Primary</Tag>}
        </Space>
      )
    },
    {
      title: 'Business ID',
      dataIndex: 'businessId',
      key: 'businessId',
      render: (id) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{id}</Text>
    },
    {
      title: 'Registration Date',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: formatDate
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => getRegistrationStatusTag(status, record, onViewComments),
      filters: STATUS_FILTERS,
      onFilter: (value, record) => {
        if (value === 'pending') return ['submitted', 'under_review', 'resubmit'].includes(record.status)
        if (value === 'in_progress') return ['requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered', 'agencies_registered'].includes(record.status)
        return record.status === value
      },
      sorter: (a, b) => {
        const order = { draft: 0, requirements_viewed: 1, form_completed: 2, documents_uploaded: 3, bir_registered: 4, agencies_registered: 5, submitted: 6, resubmit: 6, under_review: 6, needs_revision: 7, approved: 8, rejected: 9 }
        return (order[a.status] ?? 99) - (order[b.status] ?? 99)
      }
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => onViewRequirements(record, 'registration')}>View requirements</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record, 'registration')} disabled={!canEdit(record, 'registration')}>Edit</Button>
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="businessId"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} business registrations` }}
      locale={{ emptyText: 'No registration applications found' }}
    />
  )
}
