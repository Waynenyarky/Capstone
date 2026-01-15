/**
 * Presentation Component: InspectionsTable
 * Pure presentation - no business logic
 */
import React from 'react'
import { Table, Tag, Button, Space, Typography } from 'antd'
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function InspectionsTable({ inspections, loading, onView, onConduct, onUpdateStatus }) {
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          scheduled: 'blue',
          in_progress: 'orange',
          completed: 'green',
          cancelled: 'red'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Conducted Date',
      dataIndex: 'conductedDate',
      key: 'conductedDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => onView?.(record.id)}
            size="small"
          >
            View
          </Button>
          {record.status === 'scheduled' && (
            <Button 
              type="primary"
              icon={<CheckCircleOutlined />} 
              onClick={() => onConduct?.(record.id)}
              size="small"
            >
              Conduct
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button 
              icon={<ClockCircleOutlined />} 
              onClick={() => onUpdateStatus?.({ inspectionId: record.id, status: 'completed' })}
              size="small"
            >
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={inspections}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  )
}
