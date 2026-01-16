import React from 'react'
import { Select, Tag, Space } from 'antd'
import { ShopOutlined, PlusOutlined } from '@ant-design/icons'

const { Option } = Select

const BusinessSelector = ({ businesses, selectedBusinessId, onSelect, primaryBusiness }) => {
  return (
    <Select
      value={selectedBusinessId}
      onChange={onSelect}
      style={{ width: '100%' }}
      placeholder="Select business or add new"
      size="large"
    >
      <Option value="new">
        <Space>
          <PlusOutlined />
          <span>Add New Business</span>
        </Space>
      </Option>
      {businesses.map(business => (
        <Option key={business.businessId} value={business.businessId}>
          <Space>
            <ShopOutlined />
            <span>{business.businessName}</span>
            {business.isPrimary && (
              <Tag color="blue" style={{ margin: 0 }}>Primary</Tag>
            )}
          </Space>
        </Option>
      ))}
    </Select>
  )
}

export default BusinessSelector
