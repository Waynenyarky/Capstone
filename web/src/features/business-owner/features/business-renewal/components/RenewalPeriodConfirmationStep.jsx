import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, Checkbox, Alert, Space, Divider, App } from 'antd'
import { CalendarOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getRenewalPeriod, acknowledgeRenewalPeriod } from '../services/businessRenewalService'

const { Title, Text, Paragraph } = Typography

export default function RenewalPeriodConfirmationStep({ businessId, renewalId, onConfirm, onNext }) {
  const { message } = App.useApp()
  const [confirmed, setConfirmed] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [period, setPeriod] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPeriod = async () => {
      try {
        setLoading(true)
        const periodData = await getRenewalPeriod(businessId)
        setPeriod(periodData)
      } catch (error) {
        console.error('Failed to load renewal period:', error)
        message.error('Failed to load renewal period information')
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      loadPeriod()
    }
  }, [businessId, message])

  const handleConfirm = async () => {
    if (!confirmed) {
      message.warning('Please acknowledge the renewal period and penalties before proceeding')
      return
    }

    if (!renewalId) {
      message.error('Renewal application is not initialized. Please wait a moment and try again.')
      return
    }

    try {
      setAcknowledging(true)
      await acknowledgeRenewalPeriod(businessId, renewalId)
      if (onConfirm) onConfirm()
      message.success('Renewal period acknowledged')
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to acknowledge renewal period:', error)
      message.error(error?.message || 'Failed to acknowledge renewal period. Please try again.')
    } finally {
      setAcknowledging(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text>Loading renewal period information...</Text>
        </div>
      </Card>
    )
  }

  if (!period) {
    return (
      <Card>
        <Alert
          message="Error"
          description="Failed to load renewal period information. Please try again."
          type="error"
          showIcon
        />
      </Card>
    )
  }

  const isPastDeadline = new Date() > new Date(period.end)
  const penaltyInfo = period.penaltyInfo || {}

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CalendarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Confirm Renewal Period</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Please review the official renewal period and acknowledge the deadline and penalties
          </Paragraph>
        </div>

        <Alert
          message={isPastDeadline ? "Renewal Period Has Passed" : "Renewal Period Active"}
          description={isPastDeadline 
            ? `The renewal period ended on ${new Date(period.end).toLocaleDateString()}. Late filing penalties will apply.`
            : `The renewal period is currently active. Make sure to complete your renewal before the deadline.`
          }
          type={isPastDeadline ? 'warning' : 'info'}
          showIcon
          icon={isPastDeadline ? <ExclamationCircleOutlined /> : undefined}
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Official Renewal Period</Title>
            <Card size="small" style={{ background: '#f0f7ff', border: '1px solid #1890ff' }}>
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                  {period.formatted || `${new Date(period.start).toLocaleDateString()} – ${new Date(period.end).toLocaleDateString()}`}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Start: {new Date(period.start).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <br />
                  <Text type="secondary">
                    End: {new Date(period.end).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Title level={4}>Deadline and Penalties</Title>
            <Alert
              message="Important Deadline Information"
              description={
                <div>
                  <Paragraph style={{ marginBottom: 8 }}>
                    <Text strong>Deadline:</Text> All renewal applications must be submitted on or before{' '}
                    <Text strong>{new Date(period.end).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</Text>
                  </Paragraph>
                  <Paragraph style={{ marginBottom: 0 }}>
                    <Text strong>Late Filing Penalties:</Text> Applications submitted after the deadline will be subject to a{' '}
                    <Text strong>{(penaltyInfo.penaltyRate * 100).toFixed(0)}% penalty</Text> on the total assessed fees.
                  </Paragraph>
                  {penaltyInfo.penaltyStartDate && (
                    <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Penalties apply starting: {new Date(penaltyInfo.penaltyStartDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </Paragraph>
                  )}
                </div>
              }
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        </Space>

        <Divider />

        <div style={{ marginTop: 32 }}>
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ fontSize: 16, lineHeight: '24px' }}
          >
            I acknowledge the renewal period deadline ({period.formatted || 'January 1–20, 2026'}) and understand that late filing will result in penalties.
          </Checkbox>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
            loading={acknowledging}
            disabled={!confirmed || !renewalId}
          >
            I Understand and Continue
          </Button>
          {!renewalId && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Initializing renewal application...
              </Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
