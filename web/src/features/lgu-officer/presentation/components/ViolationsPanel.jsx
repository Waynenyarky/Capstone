/**
 * Presentation Component: ViolationsPanel
 * Pure presentation - no business logic
 */
import React from 'react'
import { Card, Table, Tag, Button, Space, Typography } from 'antd'
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function ViolationsPanel({ violations, loading, onView, onUpdateStatus }) {
  const columns = [
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => {
        const colorMap = {
          minor: 'blue',
          major: 'orange',
          critical: 'red'
        }
        return <Tag color={colorMap[severity] || 'default'}>{severity}</Tag>
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          active: 'red',
          resolved: 'green',
          pending: 'orange'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            onClick={() => onView?.(record.id)}
          >
            View
          </Button>
          {record.status === 'active' && (
            <Button 
              type="primary"
              size="small"
              onClick={() => onUpdateStatus?.({ violationId: record.id, status: 'resolved' })}
            >
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <WarningOutlined />
          <Title level={5} style={{ margin: 0 }}>Violations</Title>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={violations}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}
