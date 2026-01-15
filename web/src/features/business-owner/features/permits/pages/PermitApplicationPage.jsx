import React from 'react'
import { Table, Button, Tag, Space, Typography, Modal, Card, theme } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons'
import PermitApplicationForm from '../components/PermitApplicationForm'
import { usePermitApplications } from '../hooks/usePermitApplications'

const { Title, Paragraph } = Typography

export default function PermitApplicationPage() {
  const { 
    permits, 
    loading, 
    isModalVisible, 
    openModal, 
    closeModal, 
    handleCreate 
  } = usePermitApplications()
  
  const { token } = theme.useToken()

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
        if (status === 'Pending') color = '#faad14'
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
          <FileTextOutlined style={{ color: token.colorPrimary }} />
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
              <Title level={2} style={{ color: token.colorPrimary }}>Permit Applications</Title>
              <Paragraph type="secondary">Manage your business permit applications and renewals.</Paragraph>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal} style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}>
              New Application
            </Button>
          </div>

          <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table columns={columns} dataSource={permits} rowKey="id" loading={loading} />
          </Card>

          <Modal
            title="New Permit Application"
            open={isModalVisible}
            onCancel={closeModal}
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
