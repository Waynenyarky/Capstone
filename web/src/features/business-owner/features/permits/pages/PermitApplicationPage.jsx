import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Typography, Modal, Card } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons'
import PermitApplicationForm from '../components/PermitApplicationForm'
import { getPermits, createPermit } from '../services/permitService'

const { Title, Paragraph } = Typography

export default function PermitApplicationPage() {
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchPermits = async () => {
    setLoading(true)
    try {
      const data = await getPermits()
      setPermits(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermits()
  }, [])

  const handleCreate = async (values) => {
    await createPermit(values)
    setIsModalVisible(false)
    fetchPermits()
  }

  const columns = [
    {
      title: 'App Number',
      dataIndex: 'applicationNumber',
      key: 'applicationNumber',
    },
    {
      title: 'Permit Type',
      dataIndex: 'permitType',
      key: 'permitType',
    },
    {
      title: 'Date',
      dataIndex: 'applicationDate',
      key: 'applicationDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default'
        if (status === 'Approved') color = 'success'
        if (status === 'Pending') color = 'processing'
        if (status === 'Rejected') color = 'error'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchainTimestamp',
      key: 'blockchainTimestamp',
      render: (hash) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Typography.Text ellipsis style={{ maxWidth: 100 }} type="secondary">{hash}</Typography.Text>
        </Space>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <a>View</a>
        </Space>
      ),
    },
  ]

  return (
    <BusinessOwnerLayout pageTitle="Permit Applications">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <Title level={2}>Permit Applications</Title>
              <Paragraph type="secondary">Manage your business permit applications and renewals.</Paragraph>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              New Application
            </Button>
          </div>

          <Card>
            <Table columns={columns} dataSource={permits} rowKey="id" loading={loading} />
          </Card>

          <Modal
            title="New Permit Application"
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            width={800}
          >
            <PermitApplicationForm 
              onFinish={handleCreate} 
              initialValues={{ applicationDate: new Date().toISOString().split('T')[0] }}
            />
          </Modal>
        </div>
    </BusinessOwnerLayout>
  )
}
