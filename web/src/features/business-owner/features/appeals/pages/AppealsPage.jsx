import React from 'react'
import { Table, Button, Tag, Space, Typography, Card, theme } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { ExclamationCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import AppealModal from '../components/AppealModal'
import { useAppeals } from '../hooks/useAppeals'

const { Title, Paragraph } = Typography

export default function AppealsPage() {
  const { 
    appeals, 
    loading, 
    isModalVisible, 
    openModal, 
    closeModal, 
    handleCreate 
  } = useAppeals()
  
  const { token } = theme.useToken()

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
        if (status === 'Pending') color = '#faad14'
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
              <Title level={2} style={{ color: token.colorPrimary }}>Appeals & Disputes</Title>
              <Paragraph type="secondary">Contest rejected permits, fines, or inspection results.</Paragraph>
            </div>
            <Button type="primary" icon={<ExclamationCircleOutlined />} onClick={openModal} style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}>
              File New Appeal
            </Button>
          </div>

          <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table columns={columns} dataSource={appeals} rowKey="id" loading={loading} />
          </Card>

          <AppealModal 
            open={isModalVisible} 
            onCancel={closeModal} 
            onSubmit={handleCreate} 
          />
        </div>
    </BusinessOwnerLayout>
  )
}
