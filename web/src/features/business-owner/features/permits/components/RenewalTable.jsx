import React from 'react'
import { Table, Button, Tag, Space, Typography } from 'antd'
import { EyeOutlined, EditOutlined } from '@ant-design/icons'
import { getRenewalStatusTag, getPaymentStatusTag, formatDate } from '../constants/statusConfig.jsx'

const { Text } = Typography

export default function RenewalTable({
  dataSource,
  loading,
  token,
  onView,
  onEdit,
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
      title: 'Renewal Year',
      dataIndex: 'renewalYear',
      key: 'renewalYear',
      render: (year) => <Text>{year}</Text>,
      sorter: (a, b) => (a.renewalYear || 0) - (b.renewalYear || 0)
    },
    {
      title: 'Renewal Status',
      dataIndex: 'renewalStatus',
      key: 'renewalStatus',
      render: getRenewalStatusTag,
      filters: [
        { text: 'Pending for Approval', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Draft', value: 'draft' }
      ],
      onFilter: (value, record) => {
        if (value === 'pending') return record.renewalStatus === 'submitted' || record.renewalStatus === 'under_review'
        return record.renewalStatus === value
      },
      sorter: (a, b) => {
        const order = { draft: 0, submitted: 1, under_review: 1, approved: 2, rejected: 3 }
        return (order[a.renewalStatus] ?? 99) - (order[b.renewalStatus] ?? 99)
      }
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: getPaymentStatusTag,
      filters: [
        { text: 'Paid', value: 'paid' },
        { text: 'Payment Pending', value: 'pending' },
        { text: 'Payment Failed', value: 'failed' }
      ],
      onFilter: (value, record) => record.paymentStatus === value
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: formatDate,
      sorter: (a, b) => (a.submittedAt ? new Date(a.submittedAt).getTime() : 0) - (b.submittedAt ? new Date(b.submittedAt).getTime() : 0)
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => onView(record, 'renewal')}>View</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record, 'renewal')} disabled={!canEdit(record, 'renewal')}>Edit</Button>
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={(record) => record.renewalId || `${record.businessId}-${record.renewalYear}`}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} renewal applications` }}
      locale={{ emptyText: 'No renewal applications found' }}
    />
  )
}
