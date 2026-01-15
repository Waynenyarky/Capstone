/**
 * Presentation Component: ReportsPanel
 * Pure presentation - no business logic
 */
import React from 'react'
import { Card, Button, Table, Space, Typography } from 'antd'
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function ReportsPanel({ reports, loading, onGenerate, onDownload }) {
  const columns = [
    {
      title: 'Report Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Generated At',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => onDownload?.(record.id)}
            size="small"
          >
            Download
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <Title level={5} style={{ margin: 0 }}>Reports</Title>
        </Space>
      }
      extra={
        <Button type="primary" onClick={onGenerate}>
          Generate Report
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={reports}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}
