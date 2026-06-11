import { Typography, Button, Descriptions, Alert, Space } from 'antd'
import { StopOutlined, EditOutlined } from '@ant-design/icons'
import { formatDate } from '../../../utils/formatters.js'
import { RETIREMENT_ALERT_CONFIG } from '../../../constants/retirementConstants.js'

const { Text } = Typography

export default function OverviewTab({ business, onRetire, onRequestEdit }) {
  const retirementStatus = business?.retirementStatus || (business?.businessStatus === 'closed' ? 'confirmed' : '')
  const retirementPending = retirementStatus === 'requested'
  const retirementActive = ['requested', 'inspector_verified', 'pending_tax_payment'].includes(retirementStatus)

  const retirementAlertConfig = RETIREMENT_ALERT_CONFIG
  const alertConfig = retirementAlertConfig[retirementStatus]
  const retirementAlert = alertConfig ? {
    type: alertConfig.type,
    title: alertConfig.title,
    description: typeof alertConfig.description === 'function' ? alertConfig.description(business) : alertConfig.description,
  } : null

  return (
    <div style={{ padding: '16px 0' }}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Business Name">{business?.businessName || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Reference">{business?.applicationReferenceNumber || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Business Type">{business?.primaryLineOfBusiness || business?.lineOfBusiness || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Registration Date">{formatDate(business?.submittedAt || business?.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Approval Date">{formatDate(business?.reviewedAt || business?.approvedAt)}</Descriptions.Item>
        <Descriptions.Item label="Address">
          {business?.businessAddress?.full ||
            [business?.businessAddress?.streetAddress, business?.businessAddress?.barangayName, business?.businessAddress?.cityName].filter(Boolean).join(', ') ||
            'N/A'}
        </Descriptions.Item>
      </Descriptions>

      {retirementAlert && (
        <Alert
          type={retirementAlert.type}
          showIcon
          message={retirementAlert.title}
          description={retirementAlert.description}
          style={{ marginTop: 16 }}
        />
      )}

      <Space style={{ marginTop: 20 }} wrap>
        {!retirementPending && (
          <Button icon={<StopOutlined />} danger onClick={onRetire}>
            Retire Business
          </Button>
        )}
        {!retirementActive && (
          <Button icon={<EditOutlined />} onClick={onRequestEdit}>
            Request Edit
          </Button>
        )}
      </Space>
    </div>
  )
}
