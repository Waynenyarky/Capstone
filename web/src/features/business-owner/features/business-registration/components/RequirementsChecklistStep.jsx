import React, { useState } from 'react'
import { Card, Typography, Button, Checkbox, Alert, Space, List, Divider, App } from 'antd'
import { FileTextOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { downloadRequirementsPDF, confirmRequirementsChecklist } from '../services/businessRegistrationService'

const { Title, Text, Paragraph } = Typography

export default function RequirementsChecklistStep({ businessId, onConfirm, onNext }) {
  const { message } = App.useApp()
  const [confirmed, setConfirmed] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDownloadPDF = async () => {
    // PDF download works even for "new" businesses - it's just a static checklist
    const businessIdToUse = businessId || 'new'

    try {
      setDownloading(true)
      await downloadRequirementsPDF(businessIdToUse)
      message.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF:', error)
      const errorMessage = error?.message || 'Failed to download PDF. Please try again.'
      message.error(errorMessage)
    } finally {
      setDownloading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmed) {
      message.warning('Please confirm that you have reviewed and understand all requirements')
      return
    }

    try {
      setConfirming(true)
      await confirmRequirementsChecklist(businessId)
      if (onConfirm) onConfirm()
      message.success('Requirements confirmed')
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to confirm requirements:', error)
      message.error('Failed to confirm requirements. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Complete Requirements Checklist</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Before proceeding with your business registration application, please review all required documents and registrations.
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
            <Title level={4}>A. Local Government Unit (LGU) Requirements</Title>
            <List
              size="small"
              bordered
              dataSource={[
                'Duly Accomplished Application Form',
                'One (1) 2×2 ID Picture',
                'Valid IDs of the business owner',
                'Occupancy Permit (if applicable)',
                'Fire Safety Inspection Certificate from the Bureau of Fire Protection',
                'Sanitary Permit from the Local Health Office',
                'Community Tax Certificate (CTC)',
                'Barangay Business Clearance',
                'DTI / SEC / CDA Registration',
                'Lease Contract or Land Title (if applicable)',
                'Certificate of Occupancy',
                'Health Certificate (for food-related businesses)',
                'Other applicable national or sectoral requirements'
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </div>

          <Divider />

          <div>
            <Title level={4}>B. Bureau of Internal Revenue (BIR) Requirements</Title>
            <Paragraph strong>Required Documents:</Paragraph>
            <List
              size="small"
              bordered
              dataSource={[
                "Mayor's Permit or proof of ongoing LGU application",
                'DTI / SEC / CDA Registration',
                'Barangay Clearance',
                'Valid government-issued ID of the business owner',
                'Lease Contract or Land Title'
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
            <Paragraph style={{ marginTop: 16 }} strong>BIR Fees:</Paragraph>
            <List
              size="small"
              bordered
              dataSource={[
                'Registration Fee: ₱500',
                'Documentary Stamp Tax: Varies depending on business capital'
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
            <Paragraph style={{ marginTop: 16 }} strong>Additional BIR Compliance:</Paragraph>
            <List
              size="small"
              bordered
              dataSource={[
                'Registration of Books of Accounts',
                'Authority to Print Official Receipts and Invoices'
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </div>

          <Divider />

          <div>
            <Title level={4}>C. Other Government Agencies (If Applicable – With Employees)</Title>
            <Paragraph>If your business has employees, you must register with:</Paragraph>
            <List
              size="small"
              bordered
              dataSource={[
                'Social Security System (SSS)',
                'PhilHealth',
                'Pag-IBIG Fund'
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
            style={{ marginRight: 16 }}
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
            I have reviewed and understand all requirements. I confirm that I will prepare all necessary documents before proceeding.
          </Checkbox>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
            loading={confirming}
            disabled={!confirmed}
          >
            Confirm and Continue
          </Button>
        </div>
      </Card>
    </div>
  )
}
