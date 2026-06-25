import { Typography, Alert } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import PaymentStatusAlert from './PaymentStatusAlert'
import ApplicationInfoCard from './ApplicationInfoCard'
import AppealCard from './AppealCard'
import IssuesToFix from './IssuesToFix'
import { formatDate } from './utils/formatters'

const { Text } = Typography

export default function ReviewTabContent({
  application,
  paymentGenStatus,
  handleRetryPaymentGeneration,
  retryingPayments,
  formDefLoading,
  formDefinition,
  ownerName,
  token,
  _canReview,
  allFieldKeys,
  decidedCount,
  _allFieldsReviewed,
  rejectedFields,
  fieldReviewDecisions,
  sections,
  isWaitingForApplicant,
  isFinalDecision,
  _isDraft,
  loadApplicationDetails,
  _message,
  ownerIdentity,
  businessReg,
}) {
  return (
    <div style={{ padding: 16, overflow: 'auto' }}>
      {application?.status === 'approved' && (
        <PaymentStatusAlert
          paymentGenStatus={paymentGenStatus}
          onRetry={handleRetryPaymentGeneration}
          retryingPayments={retryingPayments}
          formatDate={formatDate}
        />
      )}
      {formDefLoading && (
        <div style={{ marginBottom: 16 }}>
          <LottieSpinner size="small" tip="Loading form sections..." />
        </div>
      )}
      {!formDefLoading && !formDefinition && (
        <Alert
          message="Form definition not loaded"
          description="No active form definition is available for this application type. Section tabs will appear when an active form is published by the admin."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Application Details Card */}
      <ApplicationInfoCard
        application={application}
        ownerName={ownerName}
        token={token}
        ownerIdentity={ownerIdentity}
        businessReg={businessReg}
        decidedCount={decidedCount}
        allFieldKeys={allFieldKeys}
        fieldReviewDecisions={fieldReviewDecisions}
        sections={sections}
      />

      {/* Appeal Card - shows for rejected applications with appeals */}
      <AppealCard
        application={application}
        onAppealResolved={loadApplicationDetails}
      />

      {/* Issues to Fix Card - shows rejected fields when review is locked */}
      {(isWaitingForApplicant || isFinalDecision) && rejectedFields.length > 0 && (
        <IssuesToFix
          rejectedFields={rejectedFields}
          fieldReviewDecisions={fieldReviewDecisions}
          sections={sections}
        />
      )}
    </div>
  )
}
