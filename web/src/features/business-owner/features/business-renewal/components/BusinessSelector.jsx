import React from 'react'
import { Select, Tag, Space, Card, Typography } from 'antd'
import { ShopOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Option } = Select
const { Text } = Typography

const BusinessSelector = ({ businesses, selectedBusinessId, onSelect }) => {
  // Filter to show only businesses eligible for renewal (approved businesses)
  const eligibleBusinesses = businesses?.filter(b => 
    b.applicationStatus === 'approved' || 
    b.applicationStatus === 'submitted' ||
    b.applicationStatus === 'under_review'
  ) || []

  if (eligibleBusinesses.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Text type="secondary">
            No businesses eligible for renewal. Please ensure your business registration is approved first.
          </Text>
        </div>
      </Card>
    )
  }

  return (
    <Select
      value={selectedBusinessId}
      onChange={onSelect}
      style={{ width: '100%' }}
      placeholder="Select business to renew"
      size="large"
    >
      {eligibleBusinesses.map(business => (
        <Option key={business.businessId} value={business.businessId}>
          <Space>
            <ShopOutlined />
            <span>{business.businessName || business.registeredBusinessName}</span>
            {business.isPrimary && (
              <Tag color="blue" style={{ margin: 0 }}>Primary</Tag>
            )}
            {business.applicationStatus === 'approved' && (
              <Tag color="green" style={{ margin: 0 }}>
                <CheckCircleOutlined /> Approved
              </Tag>
            )}
          </Space>
        </Option>
      ))}
    </Select>
  )
}

export default BusinessSelector
