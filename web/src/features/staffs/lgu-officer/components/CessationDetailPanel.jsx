import React, { useState, useCallback, useEffect } from 'react'
import {
  Typography, Descriptions, Tag, Card, Input, InputNumber, Button,
  Space, Empty, Alert, Divider, Statistic, Spin, message, theme,
} from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, DollarOutlined,
  CalculatorOutlined, FileTextOutlined,
} from '@ant-design/icons'
import { get, put, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from '@/features/authentication'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { TextArea } = Input

const STATUS_COLORS = {
  requested: 'warning',
  inspector_verified: 'processing',
  pending_tax_payment: 'warning',
  confirmed: 'success',
  rejected: 'error',
}

const STATUS_LABELS = {
  requested: 'Requested',
  inspector_verified: 'Inspector Verified',
  pending_tax_payment: 'Pending Tax Payment',
  confirmed: 'Confirmed (Closed)',
  rejected: 'Rejected',
}

export default function CessationDetailPanel({ cessation, onReviewComplete }) {
  const { token } = theme.useToken()
  const [processing, setProcessing] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const { currentUser } = useAuthSession()
  const { success, error: notifyError } = useNotifier()

  // Tax assessment state
  const [taxEstimate, setTaxEstimate] = useState(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)
  const [lbtAmount, setLbtAmount] = useState(0)
  const [surcharges, setSurcharges] = useState(0)
  const [outstandingFees, setOutstandingFees] = useState(0)
  const [taxNotes, setTaxNotes] = useState('')

  const businessId = cessation?.businessId || cessation?._id
  const status = cessation?.retirementStatus || cessation?.status

  // Fetch tax estimate when inspector_verified
  useEffect(() => {
    if (status === 'inspector_verified' && businessId) {
      fetchTaxEstimate()
    }
  }, [status, businessId])

  const fetchTaxEstimate = async () => {
    setLoadingEstimate(true)
    try {
      const res = await get(`/api/business/retirements/${businessId}/tax-estimate`, { skipAutoLogout: true })
      const data = res?.data || {}
      setTaxEstimate(data)
      setLbtAmount(data.proRatedAmount || 0)
    } catch (err) {
      console.error('Failed to fetch tax estimate:', err)
    }
    setLoadingEstimate(false)
  }

  const handleReview = useCallback(async (decision) => {
    if (!cessation) return
    try {
      setProcessing(true)
      await put(`/api/business/retirements/${businessId}/review`, {
        status: decision,
        reviewNotes,
      })
      success(`Cessation ${decision}`)
      setReviewNotes('')
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to process cessation request')
    } finally {
      setProcessing(false)
    }
  }, [cessation, businessId, success, notifyError, onReviewComplete, reviewNotes])

  const handleAssessTax = useCallback(async () => {
    if (!cessation) return
    try {
      setProcessing(true)
      await post(`/api/business/retirements/${businessId}/assess-tax`, {
        lbtAmount,
        surcharges,
        outstandingFees,
        notes: taxNotes,
      })
      success('Cessation tax assessed. Payment generated for the business owner.')
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to assess cessation tax')
    } finally {
      setProcessing(false)
    }
  }, [cessation, businessId, lbtAmount, surcharges, outstandingFees, taxNotes, success, notifyError, onReviewComplete])

  const handleConfirm = useCallback(async () => {
    if (!cessation) return
    try {
      setProcessing(true)
      await post(`/api/business/${businessId}/retire/confirm`)
      success('Cessation confirmed. Business is now closed.')
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to confirm cessation')
    } finally {
      setProcessing(false)
    }
  }, [cessation, businessId, success, notifyError, onReviewComplete])

  if (!cessation) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a cessation request to review" />
      </div>
    )
  }

  const claimedBy = cessation.reviewedBy
  const myId = currentUser?.id || currentUser?._id
  const claimedById = typeof claimedBy === 'object' ? claimedBy?._id : claimedBy
  const reviewLocked = Boolean(claimedBy && myId && String(claimedById) !== String(myId))
  const totalTax = (lbtAmount || 0) + (surcharges || 0) + (outstandingFees || 0)

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Cessation Request Details</Text>

      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Business">
          <Text strong>{cessation.businessName || cessation.businesses?.[0]?.businessName || 'N/A'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Business ID">
          <Text code>{businessId}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Reason">
          {cessation.retirementReason || cessation.reason || <Text type="secondary">No reason provided</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[status] || 'default'}>{STATUS_LABELS[status] || status || 'unknown'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Sworn Gross Sales">
          {cessation.swornStatementGrossSales
            ? `₱${Number(cessation.swornStatementGrossSales).toLocaleString()}`
            : <Text type="secondary">Not provided</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Requested">
          {cessation.retirementRequestedAt || cessation.createdAt
            ? dayjs(cessation.retirementRequestedAt || cessation.createdAt).format('MMM D, YYYY h:mm A')
            : '—'}
        </Descriptions.Item>
        {cessation.inspectorVerifiedAt && (
          <Descriptions.Item label="Inspector Verified">
            {dayjs(cessation.inspectorVerifiedAt).format('MMM D, YYYY h:mm A')}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Official CBPLO-ROB-F11 Form (Read-only) */}
      <Card
        size="small"
        style={{ marginBottom: 16, border: `1px solid ${token.colorBorderSecondary}` }}
        title={
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>CBPLO-ROB-F11 Rev. 00</Text>
            <Text strong style={{ fontSize: 12 }}>APPLICATION FOR THE RETIREMENT OF BUSINESS</Text>
          </div>
        }
      >
        <div style={{ fontSize: 12, lineHeight: 1.7, color: token.colorTextSecondary }}>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ fontSize: 12 }}>The City Mayor</Text><br />
            Thru: <strong>The City Treasurer</strong><br />
            Madam:
          </div>
          <div style={{ textAlign: 'justify' }}>
            Pursuant to Sec. 145 of R.A. 7160 I hereby apply for the retirement of my business, with business
            name <Text underline strong style={{ fontSize: 12 }}>{cessation.businessName || 'N/A'}</Text> WITH BP NO. <Text underline style={{ fontSize: 12 }}>{cessation.businessPlateNo || '—'}</Text> located at {cessation.businessAddress || cessation.formData?.businessAddress || '—'}, Alaminos City, Pangasinan.
          </div>
          <div style={{ textAlign: 'justify', marginTop: 4 }}>
            Attached herewith is my sworn statement of gross sales/receipts for the current year, business
            permit and other permits issued under my name. I promise that I shall not engage in any business in the
            future without first securing the necessary permit as required by law.
          </div>
        </div>
      </Card>

      {/* Tax Assessment — when inspector_verified */}
      {status === 'inspector_verified' && !reviewLocked && (
        <Card
          size="small"
          title={<><CalculatorOutlined /> Cessation Tax Assessment (RA 7160)</>}
          style={{ marginBottom: 16 }}
        >
          {loadingEstimate ? (
            <Spin tip="Calculating tax estimate..." />
          ) : (
            <>
              {taxEstimate && (
                <Alert
                  type="info"
                  style={{ marginBottom: 12 }}
                  showIcon
                  message="Auto-calculated Tax Estimate"
                  description={
                    <div style={{ fontSize: 12 }}>
                      <div>Gross Sales: <strong>₱{(taxEstimate.grossSales || 0).toLocaleString()}</strong></div>
                      <div>Months Active (Current Year): <strong>{taxEstimate.monthsActive}</strong></div>
                      <div>Annual LBT: <strong>₱{(taxEstimate.estimatedAnnualLbt || 0).toLocaleString()}</strong></div>
                      <div>Pro-rated Amount: <strong>₱{(taxEstimate.proRatedAmount || 0).toLocaleString()}</strong></div>
                      {taxEstimate.rate && <div>Rate: {(taxEstimate.rate * 100).toFixed(2)}%</div>}
                      {!taxEstimate.feeConfigFound && (
                        <Text type="warning" style={{ fontSize: 11 }}>No fee configuration found for this LOB. Please enter amount manually.</Text>
                      )}
                    </div>
                  }
                />
              )}

              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Local Business Tax (LBT) — Pro-rated
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={lbtAmount}
                    onChange={(v) => setLbtAmount(v || 0)}
                    formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => v.replace(/₱\s?|(,*)/g, '')}
                    min={0}
                    step={100}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Surcharges (25% + 2%/mo interest, if applicable)
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={surcharges}
                    onChange={(v) => setSurcharges(v || 0)}
                    formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => v.replace(/₱\s?|(,*)/g, '')}
                    min={0}
                    step={100}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Outstanding Fees (from previous years)
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={outstandingFees}
                    onChange={(v) => setOutstandingFees(v || 0)}
                    formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => v.replace(/₱\s?|(,*)/g, '')}
                    min={0}
                    step={100}
                  />
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Total Cessation Tax:</Text>
                  <Statistic
                    value={totalTax}
                    prefix="₱"
                    precision={2}
                    valueStyle={{ fontSize: 18, color: totalTax > 0 ? token.colorWarning : token.colorSuccess }}
                  />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Assessment Notes</Text>
                  <TextArea
                    rows={2}
                    value={taxNotes}
                    onChange={(e) => setTaxNotes(e.target.value)}
                    placeholder="Optional notes about the assessment..."
                  />
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    loading={processing}
                    onClick={handleAssessTax}
                  >
                    {totalTax > 0 ? 'Generate Tax Payment' : 'Assess Zero Tax'}
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={processing}
                    onClick={() => handleReview('rejected')}
                  >
                    Reject Cessation
                  </Button>
                </Space>
              </Space>
            </>
          )}
        </Card>
      )}

      {/* Waiting for payment — when pending_tax_payment */}
      {status === 'pending_tax_payment' && (
        <Card size="small" title={<><DollarOutlined /> Tax Payment Status</>} style={{ marginBottom: 16 }}>
          {cessation.cessationTaxAssessment ? (
            <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
              <Descriptions.Item label="LBT Amount">
                ₱{(cessation.cessationTaxAssessment.lbtAmount || 0).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Surcharges">
                ₱{(cessation.cessationTaxAssessment.surcharges || 0).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Outstanding Fees">
                ₱{(cessation.cessationTaxAssessment.outstandingFees || 0).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong>₱{(cessation.cessationTaxAssessment.totalAmount || 0).toLocaleString()}</Text>
              </Descriptions.Item>
              {cessation.cessationTaxAssessment.notes && (
                <Descriptions.Item label="Notes">
                  {cessation.cessationTaxAssessment.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Alert type="info" message="Tax assessed. Waiting for business owner to complete payment." showIcon />
          )}

          <Space style={{ marginTop: 12 }}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={processing}
              onClick={handleConfirm}
            >
              Confirm Cessation
            </Button>
          </Space>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
            Confirmation will fail if cessation tax payments are still unpaid.
          </Text>
        </Card>
      )}

      {/* Simple review for 'requested' status */}
      {status === 'requested' && (
        <Card size="small" title="Review Decision" style={{ marginBottom: 16 }}>
          {reviewLocked ? (
            <Alert
              type="warning"
              showIcon
              message="This cessation request is claimed by another officer."
            />
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Review Notes (Optional)</Text>
                <TextArea
                  rows={3}
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </div>
              <Space>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={processing}
                  onClick={() => handleReview('rejected')}
                >
                  Reject
                </Button>
              </Space>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                Cessation requests must be inspector-verified before tax assessment. If already verified, use the Assess Tax section above.
              </Text>
            </>
          )}
        </Card>
      )}

      {status === 'confirmed' && (
        <Alert
          type="success"
          showIcon
          message="Business Closed"
          description="This cessation has been confirmed. The business is now officially closed."
          style={{ marginBottom: 16 }}
        />
      )}

      {!['requested', 'inspector_verified', 'pending_tax_payment', 'confirmed'].includes(status) && cessation.retirementRejectionReason && (
        <Card size="small" title="Rejection Reason">
          <Text>{cessation.retirementRejectionReason}</Text>
        </Card>
      )}
    </div>
  )
}
