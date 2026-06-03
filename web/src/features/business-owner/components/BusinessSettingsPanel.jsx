import { Typography, Card, Space } from 'antd'
import { SettingOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function BusinessSettingsPanel({ selectedBusiness }) {
  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f0f0',
            color: '#1890ff',
          }}
        >
          <SettingOutlined style={{ fontSize: 20 }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Business Settings
          </Title>
          <Text type="secondary">
            {selectedBusiness?.businessName || selectedBusiness?.tradeName || 'Selected Business'}
          </Text>
        </div>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Business Information" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>Business Name:</Text>
              <br />
              <Text>{selectedBusiness?.businessName || selectedBusiness?.tradeName || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Business ID:</Text>
              <br />
              <Text>{selectedBusiness?.businessId || selectedBusiness?._id || 'N/A'}</Text>
            </div>
            <div>
              <Text strong>Status:</Text>
              <br />
              <Text>{selectedBusiness?.applicationStatus || selectedBusiness?.permitStatus || 'N/A'}</Text>
            </div>
          </Space>
        </Card>

        <Card title="Account Settings" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text>• Profile information</Text>
            </div>
            <div>
              <Text>• Notification preferences</Text>
            </div>
            <div>
              <Text>• Security settings</Text>
            </div>
            <div>
              <Text>• Theme preferences</Text>
            </div>
          </Space>
        </Card>

        <Card title="Business Operations" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text>• Permit management</Text>
            </div>
            <div>
              <Text>• Application tracking</Text>
            </div>
            <div>
              <Text>• Document storage</Text>
            </div>
            <div>
              <Text>• Payment settings</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  )
}
