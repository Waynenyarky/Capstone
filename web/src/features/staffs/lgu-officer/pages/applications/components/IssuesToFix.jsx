import { Card, Typography } from 'antd'
import { theme } from 'antd'
import { REJECTION_REASON_OPTIONS } from '../../../constants/rejectionReasons'

const { Text } = Typography

export default function IssuesToFix({ rejectedFields, fieldReviewDecisions, sections }) {
  const { token } = theme.useToken()

  return (
    <Card title="Issues Identified" size="small" style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {rejectedFields.map((fk) => {
          const d = fieldReviewDecisions[fk]
          const reason = d?.reasonOther || REJECTION_REASON_OPTIONS.find((r) => r.value === d?.reasonCode)?.label || d?.reasonCode || 'Needs correction'
          
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
          
          return (
            <div key={fk}>
              <Text type="secondary" style={{ fontSize: 12 }}>{fieldLabel}</Text>
              <div><Text strong style={{ color: token.colorError }}>{reason}</Text></div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
