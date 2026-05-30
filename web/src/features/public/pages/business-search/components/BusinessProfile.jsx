import { Typography, Button, Tag } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function BusinessProfile({ business, onReport, onBack, token, screens }) {
  return (
    <div>
      <Button
        type="text"
        onClick={onBack}
        style={{ marginBottom: 16, padding: 0 }}
      >
        &larr; Back to Results
      </Button>

      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadius,
          padding: screens.md ? '32px' : '24px',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>
              {business?.name}
            </Title>
            <Tag color="success" style={{ fontSize: 13, fontWeight: 500, padding: '4px 12px' }}>
              {business?.verificationBadge}
            </Tag>
          </div>
          <div style={{
            padding: '8px 16px',
            borderRadius: token.borderRadius,
            background: token.colorBgLayout,
            border: `1px solid ${token.colorBorder}`,
          }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Verification ID
            </Text>
            <Text strong style={{ fontSize: 14 }}>
              {business?.id}
            </Text>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: screens.md ? 'repeat(2, 1fr)' : '1fr',
          gap: 16,
          marginBottom: 24,
        }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Status
            </Text>
            <Text strong style={{ fontSize: 16, color: token.colorSuccess }}>
              {business?.status}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Permit Validity
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {business?.permitValidity}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Business Type
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {business?.businessType}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Barangay
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {business?.barangay}
            </Text>
          </div>
        </div>

        <Button
          danger
          icon={<ExclamationCircleOutlined />}
          onClick={onReport}
          block
          size="large"
        >
          Report Business
        </Button>
      </div>
    </div>
  )
}
