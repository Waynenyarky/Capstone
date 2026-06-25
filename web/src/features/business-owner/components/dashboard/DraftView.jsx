import { useState, useRef } from 'react'
import PermitApplicationForm from '../forms/PermitApplicationForm'
import ApplicationHeader from './ApplicationHeader'
import PaymentReceiptModal from '../PaymentReceiptModal'
import { post } from '@/lib/http'

export default function DraftView({
  business,
  formRef,
  formSubmitting,
  setFormSubmitting,
  showAddForm,
  onBack,
  onSubmitted,
  onDraftCreated,
  onDeleteDraft,
  onToggleForm,
  token,
  isMobile = false,
  onAutosaveStatusChange = null
}) {
  const [allSectionsComplete, setAllSectionsComplete] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState({ isAutosaving: false, hasUnsavedChanges: false })
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  // Holds the submission response so we can defer the view transition until
  // the user closes the receipt modal (otherwise DraftView unmounts immediately).
  const pendingSubmitResponseRef = useRef(null)
  const submittedRef = useRef(false)

  const handlePaymentSuccess = async (receiptInfo) => {
    // Submit first to get the actual application reference number
    const response = await formRef.current?.submitApplication?.()
    
    // Create mock payment record in backend
    let backendReceiptNumber = null
    try {
      const businessId = business?.businessId || business?._id
      const paymentResponse = await post('/api/business/payments/mock', {
        businessId,
        amount: receiptInfo.totalAmount,
        fees: receiptInfo.fees,
        transactionName: receiptInfo.transactionName,
      })
      backendReceiptNumber = paymentResponse?.data?.receiptNumber
    } catch (err) {
      console.error('Failed to create mock payment record:', err)
      // Continue anyway - payment record creation is non-blocking
    }
    
    // Update receipt info with the actual reference number from submission response
    const updatedReceiptInfo = {
      ...receiptInfo,
      receiptNumber: backendReceiptNumber,
      applicationReferenceNumber: response?.applicationReferenceNumber || 
                                  response?.businesses?.[0]?.applicationReferenceNumber || 
                                  receiptInfo.applicationReferenceNumber,
    }
    setReceiptData(updatedReceiptInfo)
    setShowReceiptModal(true)
  }

  const handleFormSubmitted = (response) => {
    // Defer the parent's onSubmitted (which switches view/unmounts DraftView)
    // until the receipt modal is closed.
    pendingSubmitResponseRef.current = response
    submittedRef.current = true
  }

  const propagateSubmitted = () => {
    if (!submittedRef.current) return
    submittedRef.current = false
    const response = pendingSubmitResponseRef.current
    pendingSubmitResponseRef.current = null
    if (response?.businesses?.length) onSubmitted(response.businesses)
    else onSubmitted()
  }

  const handleReceiptClose = () => {
    setShowReceiptModal(false)
    propagateSubmitted()
  }

  // Use parent's autosave status handler if provided, otherwise use local state
  const handleAutosaveStatusChange = onAutosaveStatusChange || setAutosaveStatus

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {!isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={true}
          isApproved={false}
          isNeedsRevision={false}
          isResubmitted={false}
          canEditRevision={false}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onDeleteDraft={onDeleteDraft}
          onPaymentSuccess={handlePaymentSuccess}
          onFillTestData={() => formRef.current?.fillTestData?.()}
          onToggleForm={onToggleForm}
          allSectionsComplete={allSectionsComplete}
          token={token}
          isAutosaving={autosaveStatus.isAutosaving}
          hasUnsavedChanges={autosaveStatus.hasUnsavedChanges}
        />
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PermitApplicationForm
          ref={formRef}
          embedded
          onSubmittingChange={setFormSubmitting}
          onAutosaveStatusChange={handleAutosaveStatusChange}
          key={`${business?.businessId || business?._id || 'edit'}-${showAddForm}`}
          onBack={onBack}
          editingApplication={business}
          readOnly={false}
          onSubmitted={handleFormSubmitted}
          onDraftCreated={onDraftCreated}
          onSectionCompleteChange={setAllSectionsComplete}
        />
      </div>
      {isMobile && (
        <ApplicationHeader
          business={business}
          isDraft={true}
          isApproved={false}
          isNeedsRevision={false}
          isResubmitted={false}
          canEditRevision={false}
          showAddForm={showAddForm}
          formSubmitting={formSubmitting}
          isMobile={isMobile}
          onDeleteDraft={onDeleteDraft}
          onPaymentSuccess={handlePaymentSuccess}
          onFillTestData={() => formRef.current?.fillTestData?.()}
          onToggleForm={onToggleForm}
          allSectionsComplete={allSectionsComplete}
          token={token}
          isAutosaving={autosaveStatus.isAutosaving}
          hasUnsavedChanges={autosaveStatus.hasUnsavedChanges}
          isFooter={true}
        />
      )}
      <PaymentReceiptModal
        visible={showReceiptModal}
        onClose={handleReceiptClose}
        receiptId={receiptData?.receiptId}
        receiptNumber={receiptData?.receiptNumber}
        transactionDate={receiptData?.transactionDate}
        transactionName={receiptData?.transactionName}
        fees={receiptData?.fees}
        totalAmount={receiptData?.totalAmount}
        applicationReferenceNumber={receiptData?.applicationReferenceNumber}
      />
    </div>
  )
}
