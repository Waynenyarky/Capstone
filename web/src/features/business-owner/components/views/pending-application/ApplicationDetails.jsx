import { Typography } from 'antd'
import { formatDate } from '../../../utils/formatters.js'

const { Text } = Typography

export default function ApplicationDetails({ business }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Submitted</Text>
        <div><Text strong>{formatDate(business.submittedAt)}</Text></div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Last Reviewed</Text>
        <div><Text strong>{business.reviewedAt ? formatDate(business.reviewedAt) : 'Not yet reviewed'}</Text></div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Business Type</Text>
        <div><Text strong>{business.registrationType === 'temporary' ? 'Temporary' : 'Regular'}</Text></div>
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>Reference Number</Text>
        <div><Text strong>{business.applicationReferenceNumber || 'Pending'}</Text></div>
      </div>
      {business.reviewedBy && (
        <div style={{ gridColumn: '1 / -1', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Reviewing Officer</Text>
          <div><Text strong>{business.reviewedBy.name || 'LGU Officer'}</Text></div>
        </div>
      )}
    </div>
  )
}
