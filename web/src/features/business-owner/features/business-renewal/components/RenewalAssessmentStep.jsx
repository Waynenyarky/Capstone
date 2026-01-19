import React, { useState, useEffect } from 'react'
import { Card, Typography, Descriptions, Alert, Space, Button, Spin, App } from 'antd'
import { CalculatorOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { calculateAssessment } from '../services/businessRenewalService'
import { getBusinessProfile } from '@/features/business-owner/services/businessProfileService'

const { Title, Text, Paragraph } = Typography

export default function RenewalAssessmentStep({ businessId, renewalId, renewalYear, initialAssessment, grossReceipts, onConfirm, onNext, onRenewalIdUpdate }) {
  const { message } = App.useApp()
  const [assessment, setAssessment] = useState(initialAssessment)
  const [loading, setLoading] = useState(!initialAssessment)
  const [calculating, setCalculating] = useState(false)
  const [grossReceiptsData, setGrossReceiptsData] = useState(grossReceipts || null)

  useEffect(() => {
    if (initialAssessment) {
      setAssessment(initialAssessment)
      setLoading(false)
    } else if (businessId && renewalId) {
      loadAssessment(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAssessment, businessId, renewalId])

  // Update gross receipts data when prop changes or load from backend
  useEffect(() => {
    const fetchGrossReceipts = async () => {
      if (!grossReceiptsData && businessId && renewalId) {
        try {
          const profile = await getBusinessProfile()
          const business = profile?.businesses?.find(b => b.businessId === businessId)
          const renewal = business?.renewals?.find(r => r.renewalId === renewalId)
          if (renewal?.grossReceipts) {
            setGrossReceiptsData(renewal.grossReceipts)
          }
        } catch (error) {
          console.error('Failed to load gross receipts:', error)
        }
      }
    }
    if (grossReceipts) {
      setGrossReceiptsData(grossReceipts)
    } else {
      fetchGrossReceipts()
    }
  }, [grossReceipts, businessId, renewalId])

  const loadAssessment = async (isRecalculate = false) => {
    if (!businessId || !renewalId) {
      setLoading(false)
      return
    }

    try {
      // Pre-calculation validation: verify gross receipts exist before calling API
      // Skip strict validation if recalculating (we know it worked before)
      let hasGrossReceipts = false
      let grossReceiptsValue = null
      
      // First check local state
      if (grossReceiptsData) {
        grossReceiptsValue = grossReceiptsData.amount || grossReceiptsData.cy2025
        hasGrossReceipts = grossReceiptsValue && grossReceiptsValue > 0
      }
      
      // If not in local state or recalculating, always fetch from backend to get latest data
      if (!hasGrossReceipts || isRecalculate) {
        try {
          const profile = await getBusinessProfile()
          const business = profile?.businesses?.find(b => b.businessId === businessId)
          const renewal = business?.renewals?.find(r => r.renewalId === renewalId)
          
          if (renewal?.grossReceipts) {
            // Check both amount and cy2025 fields
            grossReceiptsValue = renewal.grossReceipts.amount
            if (grossReceiptsValue === undefined || grossReceiptsValue === null || grossReceiptsValue === 0) {
              grossReceiptsValue = renewal.grossReceipts.cy2025
            }
            
            // Convert to number if string
            if (typeof grossReceiptsValue === 'string') {
              grossReceiptsValue = parseFloat(grossReceiptsValue)
            }
            
            hasGrossReceipts = grossReceiptsValue && !isNaN(grossReceiptsValue) && grossReceiptsValue > 0
            
            if (hasGrossReceipts) {
              setGrossReceiptsData(renewal.grossReceipts)
            } else {
              console.log('DEBUG - Gross receipts validation:', {
                renewalId,
                hasGrossReceiptsObject: !!renewal.grossReceipts,
                amount: renewal.grossReceipts.amount,
                cy2025: renewal.grossReceipts.cy2025,
                grossReceiptsValue,
                grossReceiptsKeys: Object.keys(renewal.grossReceipts || {})
              })
            }
          } else {
            console.log('DEBUG - No gross receipts found in renewal:', {
              renewalId,
              hasRenewal: !!renewal,
              renewalKeys: renewal ? Object.keys(renewal) : []
            })
          }
        } catch (profileError) {
          console.error('Failed to load gross receipts for validation:', profileError)
          // If recalculating and we have an assessment, allow it to proceed
          // The backend will validate anyway
          if (isRecalculate && assessment) {
            hasGrossReceipts = true
          }
        }
      }
      
      // If gross receipts are missing and we're not recalculating, show error
      // If recalculating, let the backend handle validation (it will give a better error)
      if (!hasGrossReceipts && !isRecalculate) {
        const calendarYear = renewalYear ? renewalYear - 1 : new Date().getFullYear() - 1
        message.error(`Please complete the Gross Receipts step first. Gross receipts for CY ${calendarYear} must be declared before calculating assessment.`)
        setLoading(false)
        return
      }
      
      setCalculating(true)
      const calculated = await calculateAssessment(businessId, renewalId)
      setAssessment(calculated)
      
      // Load gross receipts if not already loaded
      if (!grossReceiptsData) {
        try {
          const profile = await getBusinessProfile()
          const business = profile?.businesses?.find(b => b.businessId === businessId)
          const renewal = business?.renewals?.find(r => r.renewalId === renewalId)
          if (renewal?.grossReceipts) {
            setGrossReceiptsData(renewal.grossReceipts)
          }
        } catch (profileError) {
          console.error('Failed to load gross receipts:', profileError)
        }
      }
    } catch (error) {
      console.error('Failed to calculate assessment:', error)
      
      // If renewal doesn't exist, try to find the latest renewal with gross receipts
      if (error?.message?.includes('not found') || error?.message?.includes('Renewal application not found')) {
        try {
          const profile = await getBusinessProfile()
          const business = profile?.businesses?.find(b => b.businessId === businessId)
          if (business?.renewals && business.renewals.length > 0) {
            // Prefer renewals with gross receipts, then by most recent
            const renewalsWithGrossReceipts = business.renewals
              .filter(r => {
                const amount = r.grossReceipts?.amount || r.grossReceipts?.cy2025
                return amount && amount > 0
              })
              .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return dateB - dateA
              })
            
            // If no renewals with gross receipts, use the latest one
            const latestRenewal = renewalsWithGrossReceipts[0] || business.renewals
              .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return dateB - dateA
              })[0]
            
            if (latestRenewal?.renewalId && latestRenewal.renewalId !== renewalId) {
              console.log('Using latest renewal:', latestRenewal.renewalId)
              // Notify parent to update renewalId
              if (onRenewalIdUpdate) {
                onRenewalIdUpdate(latestRenewal.renewalId)
              }
              
              // Check if this renewal has gross receipts
              const amount = latestRenewal.grossReceipts?.amount || latestRenewal.grossReceipts?.cy2025
              if (!amount || amount <= 0) {
                const calendarYear = renewalYear ? renewalYear - 1 : new Date().getFullYear() - 1
                message.error(`The latest renewal does not have gross receipts declared. Please complete the Gross Receipts step for CY ${calendarYear} first.`)
                setLoading(false)
                return
              }
              
              // Try again with the correct renewalId
              const calculated = await calculateAssessment(businessId, latestRenewal.renewalId)
              setAssessment(calculated)
              
              // Load gross receipts from the latest renewal
              if (latestRenewal?.grossReceipts) {
                setGrossReceiptsData(latestRenewal.grossReceipts)
              }
              
              message.warning('Using the latest renewal from your account')
              return
            }
          }
        } catch (profileError) {
          console.error('Failed to load profile:', profileError)
        }
      }
      
      // Check if error is about missing gross receipts
      if (error?.message?.includes('Gross receipts must be declared') || error?.message?.includes('gross receipts')) {
        const calendarYear = renewalYear ? renewalYear - 1 : new Date().getFullYear() - 1
        message.error(`Please complete the Gross Receipts step first. Gross receipts for CY ${calendarYear} must be declared before calculating assessment.`)
      } else {
        message.error(error?.message || 'Failed to calculate assessment. Please try again.')
      }
    } finally {
      setCalculating(false)
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    if (onNext) onNext()
  }

  if (loading || calculating) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Calculating assessment...</Text>
          </div>
        </div>
      </Card>
    )
  }

  if (!assessment || !assessment.total) {
    return (
      <Card>
        <Alert
          message="Assessment Not Available"
          description="Unable to calculate assessment. Please ensure gross receipts are declared and try again."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => loadAssessment(false)} loading={calculating}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CalculatorOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Review System-Generated Assessment</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Please review the calculated fees based on your declared gross receipts and business information
          </Paragraph>
        </div>

        <Alert
          message="Assessment Summary"
          description="The following fees have been automatically calculated based on LGU ordinances and your business information."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Display Gross Receipts Information */}
          {grossReceiptsData && (grossReceiptsData.amount || grossReceiptsData.cy2025) && (
            <div>
              <Card 
                style={{ 
                  background: '#f0f9ff',
                  border: '1px solid #91d5ff'
                }}
              >
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item 
                    label={
                      <Text strong style={{ fontSize: 16 }}>
                        Gross Receipts for CY {grossReceiptsData.calendarYear || (renewalYear ? renewalYear - 1 : 'N/A')} (₱)
                      </Text>
                    }
                  >
                    <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                      {formatCurrency(grossReceiptsData.amount || grossReceiptsData.cy2025 || 0)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
                <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
                  The fees below are calculated based on the gross receipts declared above.
                </Paragraph>
              </Card>
            </div>
          )}

          <div>
            <Title level={4}>Fee Breakdown</Title>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Local Business Tax (LBT)">
                <Text strong>{formatCurrency(assessment.localBusinessTax || 0)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mayor's Permit Fee">
                <Text strong>{formatCurrency(assessment.mayorsPermitFee || 0)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Barangay Clearance Fee">
                <Text strong>{formatCurrency(assessment.barangayClearanceFee || 0)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Community Tax (Cedula)">
                <Text strong>{formatCurrency(assessment.communityTax || 0)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Fire Safety Inspection Fee">
                <Text strong>{formatCurrency(assessment.fireSafetyInspectionFee || 0)}</Text>
              </Descriptions.Item>
              {assessment.sanitaryPermitFee > 0 && (
                <Descriptions.Item label="Sanitary Permit Fee">
                  <Text strong>{formatCurrency(assessment.sanitaryPermitFee || 0)}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Garbage / Environmental Fee">
                <Text strong>{formatCurrency(assessment.garbageFee || 0)}</Text>
              </Descriptions.Item>
              {assessment.environmentalFee > 0 && (
                <Descriptions.Item label="Environmental Fee">
                  <Text strong>{formatCurrency(assessment.environmentalFee || 0)}</Text>
                </Descriptions.Item>
              )}
              {assessment.otherFees > 0 && (
                <Descriptions.Item label="Other Fees">
                  <Text strong>{formatCurrency(assessment.otherFees || 0)}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          <div>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                color: '#fff'
              }}
            >
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Text style={{ color: '#fff', fontSize: 16, display: 'block', marginBottom: 8 }}>
                  Total Assessed Amount
                </Text>
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  {formatCurrency(assessment.total || 0)}
                </Title>
                {assessment.calculatedAt && (
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, display: 'block', marginTop: 8 }}>
                    Calculated on: {new Date(assessment.calculatedAt).toLocaleString()}
                  </Text>
                )}
              </div>
            </Card>
          </div>
        </Space>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={() => loadAssessment(true)}
            loading={calculating}
            style={{ marginRight: 16 }}
          >
            Recalculate Assessment
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
          >
            Review Assessment and Continue
          </Button>
        </div>
      </Card>
    </div>
  )
}
