import React, { useState } from 'react'
import { Card, Typography, Button, Checkbox, Alert, Space, List, Divider, App } from 'antd'
import { FileTextOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { downloadRenewalRequirementsPDF } from '../services/businessRenewalService'

const { Title, Text, Paragraph } = Typography

export default function RenewalRequirementsStep({ businessId, renewalId, onConfirm, onNext }) {
  const { message } = App.useApp()
  const [confirmed, setConfirmed] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true)
      await downloadRenewalRequirementsPDF(businessId, renewalId)
      message.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF:', error)
      const errorMessage = error?.message || 'Failed to download PDF. Please try again.'
      message.error(errorMessage)
    } finally {
      setDownloading(false)
    }
  }

  const handleConfirm = () => {
    if (!confirmed) {
      message.warning('Please confirm that you have reviewed and understand all requirements')
      return
    }

    if (onConfirm) onConfirm()
    if (onNext) onNext()
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Renewal Requirements Checklist</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Review all required documents for business permit renewal
          </Paragraph>
        </div>

        <Alert
          message="Important"
          description="Please prepare all required documents before proceeding. You can download this checklist as a PDF for reference."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Required Documents for Renewal</Title>
            <List
              size="small"
              bordered
              dataSource={[
                "Previous year's Mayor's Permit and Official Receipt",
                'Audited Financial Statements and/or Income Tax Return',
                'Barangay Clearance (current year)',
                'Community Tax Certificate (CTC / Cedula)',
                'Fire Safety Inspection Certificate (FSIC)',
                'Sanitary Permit / Health Certificates (if applicable)',
                'Business Insurance (if required)',
                'Sworn Declaration of Gross Receipts (if books are not yet finalized)'
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </div>
        </Space>

        <Divider />

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleDownloadPDF}
            loading={downloading}
          >
            Download PDF Checklist
          </Button>
        </div>

        <Divider />

        <div style={{ marginTop: 32 }}>
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ fontSize: 16, lineHeight: '24px' }}
          >
            I have reviewed and understand all renewal requirements. I confirm that I will prepare all necessary documents before proceeding.
          </Checkbox>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
            disabled={!confirmed}
          >
            Confirm and Continue
          </Button>
        </div>
      </Card>
    </div>
  )
}
