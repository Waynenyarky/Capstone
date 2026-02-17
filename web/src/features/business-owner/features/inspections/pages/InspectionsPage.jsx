import React, { useState, useCallback } from 'react'
import { Table, Button, Tag, Space, Typography, Card, theme, Alert, Tabs, Modal, Descriptions, Input } from 'antd'
import { SafetyCertificateOutlined, FileTextOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BusinessOwnerLayout from '@/features/business-owner/components/BusinessOwnerLayout'
import { useDashboardData } from '../../dashboard/hooks/useDashboardData'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

export default function InspectionsPage() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { data, loading } = useDashboardData()
  const [reportModal, setReportModal] = useState(null)
  const [complianceModal, setComplianceModal] = useState(null)
  const [complianceNotes, setComplianceNotes] = useState('')
  
  const inspections = data?.inspections?.list || []
  const upcoming = data?.inspections?.upcoming

  const handleViewReport = useCallback((record) => {
    setReportModal(record)
  }, [])

  const handleSubmitCompliance = useCallback((record) => {
    setComplianceModal(record)
    setComplianceNotes('')
  }, [])

  const handleConfirmAvailability = useCallback(() => {
    // Navigate to inspections detail or trigger confirmation
    navigate('/owner/inspections')
  }, [navigate])

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
          <Button type="link" size="small" onClick={() => handleViewReport(record)}>View Report</Button>
          {record.status === 'Open' && (
            <Button type="primary" size="small" ghost style={{ borderColor: token.colorPrimary, color: token.colorPrimary }} onClick={() => handleSubmitCompliance(record)}>Submit Compliance</Button>
          )}
        </Space>
      ),
    },
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
              <Button size="small" type="primary" onClick={handleConfirmAvailability}>
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
                children: <Table aria-label="Inspection history" columns={columns} dataSource={inspections} rowKey="id" loading={loading} scroll={{ x: 'max-content' }} />
              },
              {
                key: '2',
                label: 'Violations',
                children: <Table aria-label="Active violations" columns={columns} dataSource={inspections.filter(i => i.status === 'Open')} rowKey="id" loading={loading} scroll={{ x: 'max-content' }} />
              }
            ]}
          />
        </Card>

        {/* View Report Modal */}
        <Modal
          title="Inspection Report"
          open={!!reportModal}
          onCancel={() => setReportModal(null)}
          footer={<Button onClick={() => setReportModal(null)}>Close</Button>}
        >
          {reportModal && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Date">{new Date(reportModal.date).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Inspector">{reportModal.inspector || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Finding">{reportModal.finding}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={reportModal.status === 'Open' ? 'error' : reportModal.status === 'Resolved' ? 'success' : 'default'}>{reportModal.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* Submit Compliance Modal */}
        <Modal
          title="Submit Compliance Evidence"
          open={!!complianceModal}
          onCancel={() => setComplianceModal(null)}
          onOk={() => {
            // TODO: Submit compliance evidence via API
            setComplianceModal(null)
          }}
          okText="Submit"
        >
          {complianceModal && (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Alert message={`Submitting compliance for: ${complianceModal.finding}`} type="info" showIcon />
              <TextArea
                rows={4}
                placeholder="Describe the corrective actions taken..."
                value={complianceNotes}
                onChange={e => setComplianceNotes(e.target.value)}
              />
            </Space>
          )}
        </Modal>
      </div>
    </BusinessOwnerLayout>
  )
}
