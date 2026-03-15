import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Space, Typography, App, Spin, Empty, Descriptions } from 'antd'
import { DownloadOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { 
  getBusinessPermits, 
  downloadPermitPDF, 
  isPermitValid, 
  getPermitStatusColor,
  issuePermit 
} from '../../services/permitIssuanceService'

const { Title, Text } = Typography

export default function PermitDownloadCard({ businessId, businessName, onPermitDownloaded }) {
  const { message } = App.useApp()
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    if (businessId) {
      fetchPermits()
    }
  }, [businessId])

  const fetchPermits = async () => {
    setLoading(true)
    try {
      const data = await getBusinessPermits(businessId)
      setPermits(data)
      // Auto-issue permit if none exists (payment already completed)
      if (data.length === 0) {
        await autoIssuePermit()
      }
    } catch (error) {
      console.error('Failed to fetch permits:', error)
      message.error('Failed to load permits')
    } finally {
      setLoading(false)
    }
  }

  const autoIssuePermit = async () => {
    try {
      await issuePermit(businessId, 'initial')
      const data = await getBusinessPermits(businessId)
      setPermits(data)
    } catch (error) {
      console.error('Auto permit issuance failed:', error)
    }
  }

  const handleDownload = async (permit) => {
    setDownloading(permit._id || permit.permitId)
    try {
      const blob = await downloadPermitPDF(permit._id || permit.permitId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${permit.permitNumber || 'permit'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      message.success('Permit downloaded successfully')
      // Notify parent that permit was downloaded
      if (onPermitDownloaded) onPermitDownloaded()
    } catch (error) {
      console.error('Download failed:', error)
      message.error('Failed to download permit')
    } finally {
      setDownloading(null)
    }
  }

  const handleIssuePermit = async () => {
    setIssuing(true)
    try {
      await issuePermit(businessId, 'initial')
      message.success('Permit issued successfully')
      fetchPermits()
    } catch (error) {
      console.error('Permit issuance failed:', error)
      message.error('Failed to issue permit')
    } finally {
      setIssuing(false)
    }
  }

  if (loading || issuing) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin tip={issuing ? "Generating permit..." : "Loading permits..."} />
      </div>
    )
  }

  const activePermit = permits.find(p => p.status === 'active' && isPermitValid(p))
  const hasNoPermits = permits.length === 0

  if (hasNoPermits) {
    return (
      <Empty
        description="Permit is being generated..."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  // Show only the active permit, or the most recent one
  const permit = activePermit || permits[0]

  return (
    <div>
      <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          What to do with your permit
        </Text>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
          <li style={{ marginBottom: 4 }}>
            <Text>Print and <strong>post conspicuously</strong> in your place of business where it is visible to the public at all times.</Text>
          </li>
          <li style={{ marginBottom: 4 }}>
            <Text>If you have no fixed place of business, keep the permit <strong>on your person</strong> and present upon request.</Text>
          </li>
          <li style={{ marginBottom: 4 }}>
            <Text>Be ready to <strong>produce the permit upon demand</strong> by the City Mayor, City Treasurer, or their authorized representatives.</Text>
          </li>
          <li>
            <Text>Renew your permit <strong>before expiry</strong> (within the first 20 days of January each year).</Text>
          </li>
        </ul>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SafetyCertificateOutlined style={{ fontSize: 18 }} />
        <Text strong>{permit.permitNumber}</Text>
        {isPermitValid(permit) ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Valid until {dayjs(permit.expiryDate).format('MMM D, YYYY')}</Tag>
        ) : (
          <Tag color="error" icon={<ClockCircleOutlined />}>Expired</Tag>
        )}
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(permit)}
          loading={downloading === (permit._id || permit.permitId)}
        >
          Download Permit PDF
        </Button>
      </div>
    </div>
  )
}
