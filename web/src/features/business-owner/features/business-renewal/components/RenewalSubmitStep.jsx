import React, { useState } from 'react'
import { Card, Typography, Button, Alert, Space, App } from 'antd'
import { CheckCircleOutlined, SendOutlined } from '@ant-design/icons'
import { submitRenewal } from '../services/businessRenewalService'

const { Title, Text, Paragraph } = Typography

export default function RenewalSubmitStep({ businessId, renewalId, renewalYear, grossReceipts, onComplete }) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState(null)
  
  // Calculate calendar year based on renewal year (BPLO standard: renewalYear - 1)
  const calendarYear = grossReceipts?.calendarYear || (renewalYear ? renewalYear - 1 : null)

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const result = await submitRenewal(businessId, renewalId)
      setReferenceNumber(result.referenceNumber)
      setSubmitted(true)
      message.success('Renewal application submitted successfully!')
      if (onComplete) onComplete(result)
    } catch (error) {
      console.error('Failed to submit renewal:', error)
      message.error(error?.message || 'Failed to submit renewal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
          <Title level={3} style={{ color: '#52c41a', marginBottom: 16 }}>
            Renewal Submitted Successfully
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
            Your renewal application has been submitted to the LGU Officer for verification and approval.
          </Paragraph>

          {referenceNumber && (
            <Card size="small" style={{ marginBottom: 24, background: '#f0f9ff', maxWidth: 500, margin: '0 auto' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Renewal Reference Number:</Text>
                <Text copyable style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                  {referenceNumber}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Please save this reference number for tracking your renewal status.
                </Text>
              </Space>
            </Card>
          )}

          <Alert
            message="Renewal Submitted for LGU Verification"
            description="Your renewal application is now under review by the LGU Officer. You will be notified once the review is complete."
            type="success"
            showIcon
            style={{ maxWidth: 600, margin: '0 auto' }}
          />
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SendOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Submit Renewal Application</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Review your information and submit your renewal application to the LGU Officer
          </Paragraph>
        </div>

        <Alert
          message="Final Step"
          description="Once you submit, your renewal application will be forwarded to the LGU Officer for verification and approval. Please ensure all information is correct before submitting."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 32 }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>Submission Checklist:</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>Renewal period acknowledged</li>
              <li>Business profile reviewed and confirmed</li>
              <li>Renewal requirements reviewed</li>
              <li>Gross receipts declared for CY {calendarYear || 'N/A'}</li>
              <li>All required documents uploaded</li>
              <li>Assessment reviewed</li>
              <li>Payment completed</li>
            </ul>
          </div>
        </Space>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
          >
            Submit Renewal Application
          </Button>
        </div>
      </Card>
    </div>
  )
}
