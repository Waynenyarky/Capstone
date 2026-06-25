import { Card, Space, Typography, theme } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { REJECTION_REASON_OPTIONS } from '../../../constants/rejectionReasons'
import RevokeDecisionSection from './RevokeDecisionSection'
import { post } from '@/lib/http'

const { Text } = Typography
const { useToken } = theme

export default function ReviewStatusCard({
  canReview,
  allFieldKeys,
  _decidedCount,
  _allFieldsReviewed,
  rejectedFields,
  fieldReviewDecisions,
  sections,
  isWaitingForApplicant,
  isFinalDecision,
  isDraft,
  application,
  loadApplicationDetails,
  message,
}) {
  const { token } = useToken()
  return (
    <Card title={canReview ? "Review Status" : "Decision"} size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {canReview && allFieldKeys.length > 0 ? (
          <>
            {rejectedFields.length > 0 && (
              <div style={{ marginTop: 8, padding: 8, background: token.colorErrorBg, borderRadius: token.borderRadius }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  <CloseCircleOutlined style={{ color: token.colorError, marginRight: 4 }} />
                  Rejected fields:
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                  {rejectedFields.map((fk) => {
                    const d = fieldReviewDecisions[fk]
                    const reason = d?.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === d?.reasonCode)?.label || d?.reasonCode || 'Rejected'
                    
                    // Get field label from form definition
                    let fieldLabel = fk
                    const parts = String(fk).split('.')
                    if (parts.length >= 2) {
                      const sectionIdx = parseInt(parts[0])
                      const itemKey = parts.slice(1).join('.')
                      const section = sections?.[sectionIdx]
                      const item = section?.items?.find(it => (it.key || it.label) === itemKey || itemKey.startsWith(it.key || it.label))
                      if (item) {
                        fieldLabel = item.label || item.key || fk
                      }
                    }
                    
                    return <li key={fk}><Text style={{ fontSize: 12 }}>{fieldLabel}: {reason}</Text></li>
                  })}
                </ul>
              </div>
            )}
          </>
        ) : isWaitingForApplicant ? (
          <RevokeDecisionSection 
            application={application}
            onRevoke={async () => {
              const idToUse = application.businessId || application.applicationId || application._id
              await post(`/api/lgu-officer/permit-applications/${idToUse}/reset-status`, { newStatus: 'under_review' })
              message.success('Decision revoked - application reset to under review')
              await loadApplicationDetails()
            }}
          />
        ) : (isFinalDecision ? (
          <RevokeDecisionSection 
            application={application}
            onRevoke={async () => {
              const idToUse = application.businessId || application.applicationId || application._id
              await post(`/api/lgu-officer/permit-applications/${idToUse}/reset-status`, { newStatus: 'under_review' })
              message.success('Decision revoked - application reset to under review')
              await loadApplicationDetails()
            }}
          />
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isDraft
              ? 'The application must be submitted before review can begin.'
              : 'Review availability depends on the application status.'}
          </Text>
        ))}
      </Space>
    </Card>
  )
}
