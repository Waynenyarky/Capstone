import { useState, useEffect } from 'react'
import { Space, Button, Typography, Tag, App } from 'antd'
import { ShopOutlined, BugOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getBusinessDisplayName } from '../../utils/statusUtils'
import { getFeeGroupForForm } from '../../services/feeService'
import MockPaymentModal from '../MockPaymentModal'

const { Title, Text } = Typography

export default function ApplicationHeader({
  business,
  isDraft,
  isApproved,
  isNeedsRevision,
  isResubmitted,
  showAddForm,
  formSubmitting,
  isMobile = false,
  onDeleteDraft,
  onSubmitApplication,
  onPaymentSuccess,
  onFillTestData,
  onToggleForm,
  onOpenForm,
  showReadOnlyForm = false,
  allSectionsComplete = false,
  token,
  isAutosaving = false,
  hasUnsavedChanges = false,
  isFooter = false
}) {
  const { message } = App.useApp()
  const displayName = getBusinessDisplayName(business)
  const [feeData, setFeeData] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const response = await getFeeGroupForForm('permit')
        setFeeData(response)
      } catch (err) {
        console.error('Failed to fetch fee data:', err)
        setFeeData(null)
      }
    }
    fetchFees()
  }, [])

  const handleSubmitAndPay = () => {
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (receiptId) => {
    setShowPaymentModal(false)
    const receiptInfo = {
      receiptId,
      transactionDate: new Date().toLocaleString(),
      transactionName: 'Business Permit Application',
      fees: feeData?.fees || [],
      totalAmount: feeData?.total || 0,
      applicationReferenceNumber: business?.applicationReferenceNumber || 'N/A',
    }
    // If parent handles payment success (DraftView), delegate to it
    if (onPaymentSuccess) {
      onPaymentSuccess(receiptInfo)
    } else {
      // Fallback: just submit (revision resubmit flow)
      onSubmitApplication?.()
    }
  }

  const handlePaymentFail = () => {
    setShowPaymentModal(false)
    message.error('Payment cancelled. Application was not submitted.')
  }

  return (
    <div
      style={{
        flexShrink: 0,
        padding: isMobile ? '12px 16px' : '16px 24px',
        borderTop: isFooter ? `1px solid ${token.colorBorderSecondary}` : undefined,
        borderBottom: !isFooter ? `1px solid ${token.colorBorderSecondary}` : undefined,
        background: token.colorBgContainer,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-end' : 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {!isMobile && (
          <Space size={12}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: token.borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: token.colorTextSecondary,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <ShopOutlined style={{ fontSize: 20 }} />
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={4} style={{ margin: 0 }}>
                {displayName}
              </Title>
              {isDraft && (
                <Tag
                  color={isAutosaving ? 'processing' : hasUnsavedChanges ? 'warning' : 'success'}
                  style={{ fontWeight: 'normal' }}
                >
                  {isAutosaving ? 'Saving...' : hasUnsavedChanges ? 'Unsaved' : 'Saved'}
                </Tag>
              )}
            </div>
          </Space>
        )}
        <Space size="small">
          {!isDraft && !isApproved ? (
            <>
              <Button onClick={() => showReadOnlyForm ? onToggleForm() : onOpenForm?.(business) || onToggleForm()}>
                {showReadOnlyForm || showAddForm
                  ? (isNeedsRevision ? 'View Revision Summary' : isResubmitted ? 'View Resubmission Status' : 'View Progress')
                  : (isNeedsRevision ? 'Review & Fix Application' : isResubmitted ? 'View Submitted Revisions' : 'View Submitted Application')}
              </Button>
              {isNeedsRevision && showAddForm && (
                <Button
                  type="primary"
                  onClick={handleSubmitAndPay}
                  loading={formSubmitting}
                >
                  Resubmit Application
                </Button>
              )}
            </>
          ) : isDraft ? (
            <>
              {import.meta.env.DEV && (
                <Button
                  type="dashed"
                  icon={<BugOutlined />}
                  iconPosition="end"
                  onClick={onFillTestData}
                >
                  Fill with test data
                </Button>
              )}
              <Button
                danger
                icon={<DeleteOutlined />}
                iconPosition="end"
                onClick={onDeleteDraft}
              >
                Delete
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                iconPosition="end"
                onClick={handleSubmitAndPay}
                loading={formSubmitting}
                disabled={!allSectionsComplete}
              >
                Submit
              </Button>
            </>
          ) : null}
        </Space>
      </div>
      
      <MockPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        onFail={handlePaymentFail}
        amount={feeData?.total || 0}
        transactionName="Business Permit Application"
        fees={feeData?.fees || []}
      />
    </div>
  )
}
