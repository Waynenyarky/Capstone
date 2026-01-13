import React from 'react'
import { Table, Button, Tag, Space, Typography, Card, theme, Alert, Tabs } from 'antd'
import { SafetyCertificateOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import { useDashboardData } from '../../dashboard/hooks/useDashboardData'

const { Title, Paragraph, Text } = Typography

export default function InspectionsPage() {
  const { token } = theme.useToken()
  const { data, loading } = useDashboardData()
  
  const inspections = data?.inspections?.list || []
  const upcoming = data?.inspections?.upcoming

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Inspector',
      dataIndex: 'inspector',
      key: 'inspector',
      render: (val) => val || 'N/A'
    },
    {
      title: 'Finding',
      dataIndex: 'finding',
      key: 'finding',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'default'
        if (status === 'Resolved') color = 'success'
        if (status === 'Open') color = 'error'
        if (status === 'Pending Review') color = 'warning'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small">View Report</Button>
          {record.status === 'Open' && (
            <Button type="primary" size="small" ghost style={{ borderColor: token.colorPrimary, color: token.colorPrimary }}>Submit Compliance</Button>
          )}
        </Space>
      ),
    },
  ]

  // Mock data augmentation since dashboard data is limited
  const fullInspections = [
    ...inspections,
    { id: 3, date: '2023-05-10', finding: 'Fire extinguisher expired', status: 'Resolved', inspector: 'Bureau of Fire Protection' },
    { id: 4, date: '2022-11-20', finding: 'No violations found', status: 'Passed', inspector: 'Sanitary Office' },
  ]

  return (
    <BusinessOwnerLayout pageTitle="Inspections & Violations">
      <div>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ color: token.colorPrimary, marginBottom: 8 }}>Inspections & Violations</Title>
          <Paragraph type="secondary">View inspection history, reports, and manage compliance violations.</Paragraph>
        </div>

        {upcoming && (
          <Alert
            message="Upcoming Inspection"
            description={
              <Space direction="vertical">
                <Text>Scheduled Date: {new Date(upcoming.date).toLocaleDateString()}</Text>
                <Text>Inspector: {upcoming.inspector}</Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
            style={{ marginBottom: 24, border: `1px solid ${token.colorInfoBorder}`, background: token.colorInfoBg }}
            action={
              <Button size="small" type="primary" style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}>
                Confirm Availability
              </Button>
            }
          />
        )}

        <Card 
          style={{ borderRadius: token.borderRadiusLG, boxShadow: token.boxShadowSecondary }}
          styles={{ body: { padding: 0 } }}
        >
          <Tabs 
            defaultActiveKey="1" 
            tabBarStyle={{ padding: '0 24px' }}
            items={[
              {
                key: '1',
                label: 'Inspection History',
                children: <Table columns={columns} dataSource={fullInspections} rowKey="id" loading={loading} />
              },
              {
                key: '2',
                label: 'Violations',
                children: <Table columns={columns} dataSource={fullInspections.filter(i => i.status === 'Open')} rowKey="id" loading={loading} />
              }
            ]}
          />
        </Card>
      </div>
    </BusinessOwnerLayout>
  )
}
