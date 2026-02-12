import React from 'react'
import { Modal, Table, Button, Typography, Space } from 'antd'
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons'

const { Text } = Typography

/**
 * Modal displaying list of drafts with columns:
 * - Created (when + who)
 * - Last edited (when + who)
 * - Actions (view, delete)
 */
export default function DraftsModal({ open, onClose, drafts = [], onView, onDelete }) {
  const columns = [
    {
      title: 'Created',
      key: 'created',
      render: (_, record) => (
        <div>
          <Text>{record.createdAt}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>by {record.createdBy}</Text>
        </div>
      ),
    },
    {
      title: 'Last edited',
      key: 'lastEdited',
      render: (_, record) => (
        <div>
          <Text>{record.lastEditedAt}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>by {record.lastEditedBy}</Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView?.(record)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete?.(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title="Drafts"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <Table
        dataSource={drafts}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Modal>
  )
}
