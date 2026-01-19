import React from 'react'
import { Table, Button, Tag, Space, Typography, Card, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { usePermitApplications } from '../hooks/usePermitApplications'

const { Title, Paragraph, Text } = Typography

export default function PermitApplicationPage() {
  const navigate = useNavigate()
  const { 
    permits, 
    loading, 
    refresh 
  } = usePermitApplications()
  
  const { token } = theme.useToken()

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'requirements_viewed': { color: 'processing', text: 'Requirements Viewed' },
      'form_completed': { color: 'processing', text: 'Form Completed' },
      'documents_uploaded': { color: 'processing', text: 'Documents Uploaded' },
      'bir_registered': { color: 'processing', text: 'BIR Registered' },
      'agencies_registered': { color: 'processing', text: 'Agencies Registered' },
      'submitted': { color: 'success', text: 'Submitted to LGU Officer' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' },
      'needs_revision': { color: 'warning', text: 'Needs Revision' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const columns = [
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (ref) => (
        <Text copyable={ref !== 'N/A'} strong={ref !== 'N/A'} style={{ color: ref !== 'N/A' ? token.colorPrimary : undefined }}>
          {ref}
        </Text>
      ),
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
      ),
    },
    {
      title: 'Business ID',
      dataIndex: 'businessId',
      key: 'businessId',
      render: (id) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{id}</Text>,
    },
    {
      title: 'Registration Date',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: formatDate,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/owner/business-registration?businessId=${record.businessId}`)}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/owner/business-registration?businessId=${record.businessId}`)}
          >
            Edit
          </Button>
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
              <Paragraph type="secondary">Manage your business registrations and track their status.</Paragraph>
            </div>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => navigate('/owner/business-registration')}
                style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}
              >
                New Application
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => navigate('/owner/business-renewal')}
              >
                Business Renewal
              </Button>
            </Space>
          </div>

          <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table 
              columns={columns} 
              dataSource={permits} 
              rowKey="businessId" 
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} business registrations`
              }}
            />
          </Card>
        </div>
    </BusinessOwnerLayout>
  )
}
