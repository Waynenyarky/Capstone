import React from 'react'
import { Card, Descriptions, Tag, Button, Space, theme } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const BusinessProfile = ({ data }) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()
  
  if (!data) return null

  const handleEdit = () => {
    navigate('/owner/businesses')
  }

  const handleManageAll = () => {
    navigate('/owner/businesses')
  }

  return (
    <Card 
      title={<Space><ShopOutlined style={{ color: token.colorPrimary }} /> Business Profile</Space>}
      extra={<Button type="link" size="small" onClick={handleEdit}>Edit</Button>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
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
        <Button block onClick={handleManageAll}>Manage All Businesses</Button>
      </div>
    </Card>
  )
}

export default BusinessProfile
