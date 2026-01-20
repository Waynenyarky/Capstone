import React, { useEffect, useState } from 'react'
import { Card, Typography, Tag, Timeline, Space, Button, Spin } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getApplicationStatus } from '../services/businessRegistrationService'

const { Title, Text } = Typography

export default function ApplicationStatusCard({ businessId, status, referenceNumber, submittedAt }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState(null)

  useEffect(() => {
    if (businessId && !statusData) {
      loadStatus()
    }
  }, [businessId])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const data = await getApplicationStatus(businessId)
      setStatusData(data)
    } catch (error) {
      console.error('Failed to load application status:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentStatus = statusData?.applicationStatus || status
  const currentReferenceNumber = statusData?.applicationReferenceNumber || referenceNumber
  const currentSubmittedAt = statusData?.submittedAt || submittedAt

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

  const getTimelineItems = () => {
    const items = [
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Requirements Checklist Viewed' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Application Form Completed' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'LGU Documents Uploaded' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'BIR Registration Completed' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Agency Registrations Completed' }
    ]

    if (['submitted', 'under_review', 'approved', 'rejected', 'needs_revision'].includes(currentStatus)) {
      items.push({
        color: 'blue',
        dot: <FileTextOutlined />,
        children: 'Application Submitted to LGU Officer'
      })
    }

    if (['under_review', 'approved', 'rejected', 'needs_revision'].includes(currentStatus)) {
      items.push({
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: 'Under LGU Officer Review'
      })
    }

    if (currentStatus === 'approved') {
      items.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: 'Application Approved'
      })
    } else if (currentStatus === 'rejected') {
      items.push({
        color: 'red',
        dot: <CheckCircleOutlined />,
        children: 'Application Rejected'
      })
    } else if (currentStatus === 'needs_revision') {
      items.push({
        color: 'orange',
        dot: <CheckCircleOutlined />,
        children: 'Application Needs Revision'
      })
    }

    return items
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3} style={{ marginBottom: 8 }}>Application Status</Title>
      </div>

      {currentReferenceNumber && (
        <Card size="small" style={{ marginBottom: 24, background: '#f0f9ff' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Reference Number:</Text>
            <Text copyable style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
              {currentReferenceNumber}
            </Text>
            {currentSubmittedAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Submitted on: {new Date(currentSubmittedAt).toLocaleString()}
              </Text>
            )}
          </Space>
        </Card>
      )}

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong>Current Status:</Text>
          <div style={{ marginTop: 8 }}>
            {getStatusTag(currentStatus)}
          </div>
        </div>

        {currentStatus === 'submitted' && (
          <div style={{ 
            padding: 16, 
            background: '#e6f7ff', 
            borderRadius: 4, 
            border: '1px solid #91d5ff' 
          }}>
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ color: '#1890ff' }}>
                Application Status: Submitted to LGU Officer for Permit Verification
              </Text>
            </Space>
          </div>
        )}

        <div>
          <Text strong>Application Progress:</Text>
          <Timeline items={getTimelineItems()} style={{ marginTop: 16 }} />
        </div>
      </Space>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Space size="middle">
          <Button type="primary" onClick={loadStatus} loading={loading}>
            Refresh Status
          </Button>
          <Button 
            type="default" 
            icon={<SearchOutlined />}
            onClick={() => navigate('/owner/permits')}
          >
            Track your Registration
          </Button>
        </Space>
      </div>
    </Card>
  )
}
