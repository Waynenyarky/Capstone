import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Typography, Modal, Card, Empty } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import { StopOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import CessationForm from '../components/CessationForm'
import { getCessationRequests, createCessationRequest } from '../services/cessationService'

const { Title, Paragraph } = Typography

export default function CessationPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await getCessationRequests()
      setRequests(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleCreate = async (values) => {
    await createCessationRequest(values)
    setIsModalVisible(false)
    fetchRequests()
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      render: (d) => d?.format ? d.format('YYYY-MM-DD') : d
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'Pending' ? '#faad14' : 'green'}>{status}</Tag>
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchainTimestamp',
      key: 'blockchainTimestamp',
      render: (hash) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#faad14' }} />
          <Typography.Text ellipsis style={{ maxWidth: 100 }} type="secondary">{hash}</Typography.Text>
        </Space>
      )
    },
  ]

  return (
    <BusinessOwnerLayout pageTitle="Cessation Requests">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <Title level={2} style={{ color: '#003a70' }}>Cessation Requests</Title>
              <Paragraph type="secondary">Request for business closure or temporary halt.</Paragraph>
            </div>
            {requests.length > 0 && (
              <Button type="primary" danger icon={<StopOutlined />} onClick={() => setIsModalVisible(true)}>
                New Request
              </Button>
            )}
          </div>

          <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {requests.length === 0 && !loading ? (
              <Empty
                description="No cessation requests found. Operating normally."
              >
                <Button type="primary" danger icon={<StopOutlined />} onClick={() => setIsModalVisible(true)}>
                  Request Cessation
                </Button>
              </Empty>
            ) : (
              <Table columns={columns} dataSource={requests} rowKey="id" loading={loading} />
            )}
          </Card>

          <Modal
            title="Request Business Cessation"
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            width={800}
          >
            <CessationForm onFinish={handleCreate} />
          </Modal>
        </div>
    </BusinessOwnerLayout>
  )
}
