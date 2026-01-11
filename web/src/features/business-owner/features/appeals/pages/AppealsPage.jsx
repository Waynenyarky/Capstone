import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Typography, Card } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import { ExclamationCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { getAppeals, createAppeal } from '../services/appealService'
import AppealModal from '../components/AppealModal'

const { Title, Paragraph } = Typography

export default function AppealsPage() {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchAppeals = async () => {
    setLoading(true)
    try {
      const data = await getAppeals()
      setAppeals(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppeals()
  }, [])

  const handleCreate = async (values) => {
    await createAppeal(values)
    fetchAppeals()
  }

  const columns = [
    { title: 'Reference #', dataIndex: 'referenceNumber', key: 'referenceNumber' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        let color = 'default'
        if (status === 'Pending') color = 'orange'
        if (status === 'Reviewed') color = 'blue'
        if (status === 'Approved') color = 'green'
        if (status === 'Rejected') color = 'red'
        return <Tag color={color}>{status}</Tag>
      }
    },
    { title: 'Assigned Officer', dataIndex: 'assignedOfficer', key: 'assignedOfficer' },
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
    <BusinessOwnerLayout pageTitle="Appeals & Disputes">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <Title level={2}>Appeals & Disputes</Title>
              <Paragraph type="secondary">Contest rejected permits, fines, or inspection results.</Paragraph>
            </div>
            <Button type="primary" icon={<ExclamationCircleOutlined />} onClick={() => setIsModalVisible(true)}>
              File New Appeal
            </Button>
          </div>

          <Card>
            <Table columns={columns} dataSource={appeals} rowKey="id" loading={loading} />
          </Card>

          <AppealModal 
            open={isModalVisible} 
            onCancel={() => setIsModalVisible(false)} 
            onSubmit={handleCreate} 
          />
        </div>
    </BusinessOwnerLayout>
  )
}
