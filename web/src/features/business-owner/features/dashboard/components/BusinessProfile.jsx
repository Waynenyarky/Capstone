import React from 'react'
import { Card, Descriptions, Tag, Button, Space } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const BusinessProfile = ({ data }) => {
  const navigate = useNavigate()
  
  if (!data) return null

  const handleEdit = () => {
    // Navigate to business registration page with primary business
    navigate('/owner/business-registration?businessId=primary')
  }

  const handleManageAll = () => {
    // Navigate to business registration page
    navigate('/owner/business-registration')
  }

  return (
    <Card 
      title={<Space><ShopOutlined style={{ color: '#001529' }} /> Business Profile</Space>}
      extra={<Button type="link" size="small" onClick={handleEdit}>Edit</Button>}
      style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Name">{data.name}</Descriptions.Item>
        <Descriptions.Item label="Reg No.">{data.regNumber}</Descriptions.Item>
        <Descriptions.Item label="Type">{data.type}</Descriptions.Item>
        <Descriptions.Item label="Risk Category"><Tag color="blue">{data.riskCategory}</Tag></Descriptions.Item>
        <Descriptions.Item label="Address">{data.address}</Descriptions.Item>
        <Descriptions.Item label="Status">
           <Tag color={data.status === 'Active' ? 'green' : 'red'}>{data.status}</Tag>
        </Descriptions.Item>
      </Descriptions>
      
      <div style={{ marginTop: 16 }}>
        <Space style={{ width: '100%' }} direction="vertical">
           <Button type="primary" ghost block style={{ color: '#001529', borderColor: '#001529' }} onClick={handleEdit}>
             Edit Business
           </Button>
           <Button block onClick={handleManageAll}>Manage All Businesses</Button>
        </Space>
      </div>
    </Card>
  )
}

export default BusinessProfile
