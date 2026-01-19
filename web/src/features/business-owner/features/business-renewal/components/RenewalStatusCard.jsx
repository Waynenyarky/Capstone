import React, { useEffect, useState } from 'react'
import { Card, Typography, Tag, Timeline, Space, Button, Spin, App } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { getRenewalStatus } from '../services/businessRenewalService'
import { getBusinessProfile } from '@/features/business-owner/services/businessProfileService'

const { Title, Text } = Typography

export default function RenewalStatusCard({ businessId, renewalId, status, referenceNumber, submittedAt, onRenewalIdUpdate }) {
  const { message: appMessage } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState(null)

  useEffect(() => {
    if (businessId && renewalId) {
      loadStatus()
    }
  }, [businessId, renewalId])

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    if (!businessId || !renewalId) return

    const currentStatus = statusData?.renewalStatus || status
    
    // Stop auto-refresh if renewal is approved or rejected
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
      return
    }

    // Set up interval to refresh status every 30 seconds
    const intervalId = setInterval(() => {
      if (businessId && renewalId) {
        loadStatus(true) // Pass true to indicate this is an auto-refresh
      }
    }, 30000) // 30 seconds

    // Cleanup interval on unmount or when status changes to approved/rejected
    return () => {
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, renewalId, statusData?.renewalStatus, status])

  const loadStatus = async (isAutoRefresh = false) => {
    if (!businessId || !renewalId) return
    
    try {
      setLoading(true)
      const data = await getRenewalStatus(businessId, renewalId)
      setStatusData(data)
    } catch (error) {
      console.error('Failed to load renewal status:', error)
      
      // If renewal doesn't exist, try to find the latest renewal
      if (error?.message?.includes('not found') || error?.message?.includes('Renewal application not found')) {
        try {
          const profile = await getBusinessProfile()
          const business = profile?.businesses?.find(b => b.businessId === businessId)
          if (business?.renewals && business.renewals.length > 0) {
            // Prioritize renewals with gross receipts or other completion indicators
            // Sort by: has gross receipts > has assessment > has documents > updatedAt > createdAt
            const sortedRenewals = business.renewals.sort((a, b) => {
              const aHasGrossReceipts = (a.grossReceipts?.amount || a.grossReceipts?.cy2025) > 0
              const bHasGrossReceipts = (b.grossReceipts?.amount || b.grossReceipts?.cy2025) > 0
              if (aHasGrossReceipts !== bHasGrossReceipts) {
                return bHasGrossReceipts ? 1 : -1
              }
              
              const aHasAssessment = a.assessment?.total > 0
              const bHasAssessment = b.assessment?.total > 0
              if (aHasAssessment !== bHasAssessment) {
                return bHasAssessment ? 1 : -1
              }
              
              const aHasDocuments = Object.values(a.renewalDocuments || {}).some(url => url && url.trim() !== '')
              const bHasDocuments = Object.values(b.renewalDocuments || {}).some(url => url && url.trim() !== '')
              if (aHasDocuments !== bHasDocuments) {
                return bHasDocuments ? 1 : -1
              }
              
              // Finally sort by updatedAt or createdAt (newest first)
              const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime()
              const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime()
              return bDate - aDate
            })
            
            const latestRenewal = sortedRenewals[0]
            
            if (latestRenewal?.renewalId) {
              // Always try the latest renewal, even if it's the same ID (in case it was just updated)
              try {
                const data = await getRenewalStatus(businessId, latestRenewal.renewalId)
                setStatusData(data)
                
                // Only notify parent if renewalId actually changed
                if (latestRenewal.renewalId !== renewalId && onRenewalIdUpdate) {
                  console.log('Using latest renewal:', latestRenewal.renewalId)
                  onRenewalIdUpdate(latestRenewal.renewalId)
                  if (!isAutoRefresh) {
                    appMessage.warning('Using the latest renewal from your account')
                  }
                }
                return
              } catch (retryError) {
                console.error('Failed to load latest renewal status:', retryError)
                // Fall through to show error
              }
            }
          }
        } catch (profileError) {
          console.error('Failed to load profile:', profileError)
        }
      }
      
      // Only show error message if not an auto-refresh
      if (!isAutoRefresh) {
        appMessage.error(error?.message || 'Failed to load renewal status. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentStatus = statusData?.renewalStatus || status
  const currentReferenceNumber = statusData?.referenceNumber || referenceNumber
  const currentSubmittedAt = statusData?.submittedAt || submittedAt

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', text: 'Draft' },
      'submitted': { color: 'processing', text: 'Submitted for LGU Verification' },
      'under_review': { color: 'processing', text: 'Under Review' },
      'approved': { color: 'success', text: 'Approved' },
      'rejected': { color: 'error', text: 'Rejected' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getTimelineItems = () => {
    const items = [
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Renewal Period Acknowledged' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Business Profile Reviewed' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Requirements Reviewed' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Gross Receipts Declared' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Documents Uploaded' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Assessment Calculated' },
      { color: 'green', dot: <CheckCircleOutlined />, children: 'Payment Completed' }
    ]

    if (['submitted', 'under_review', 'approved', 'rejected'].includes(currentStatus)) {
      items.push({
        color: 'blue',
        dot: <FileTextOutlined />,
        children: 'Renewal Submitted to LGU Officer'
      })
    }

    if (['under_review', 'approved', 'rejected'].includes(currentStatus)) {
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
        children: 'Renewal Approved'
      })
    } else if (currentStatus === 'rejected') {
      items.push({
        color: 'red',
        dot: <CheckCircleOutlined />,
        children: 'Renewal Rejected'
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
        <Title level={3} style={{ marginBottom: 8 }}>Renewal Status</Title>
      </div>

      {currentReferenceNumber && (
        <Card size="small" style={{ marginBottom: 24, background: '#f0f9ff' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Renewal Reference Number:</Text>
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
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ color: '#1890ff' }}>
                Renewal Submitted for LGU Verification
              </Text>
            </Space>
          </div>
        )}

        <div>
          <Text strong>Renewal Progress:</Text>
          <Timeline items={getTimelineItems()} style={{ marginTop: 16 }} />
        </div>
      </Space>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={loadStatus} loading={loading}>
          Refresh Status
        </Button>
      </div>
    </Card>
  )
}
