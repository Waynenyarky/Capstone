import React from 'react'
import { Card, Descriptions, Tag, Button, Space } from 'antd'
import { ShopOutlined } from '@ant-design/icons'

const BusinessProfile = ({ data }) => {
  if (!data) return null

  return (
    <Card 
      title={<Space><ShopOutlined style={{ color: '#001529' }} /> Business Profile</Space>}
      extra={<Button type="link" size="small">Edit</Button>}
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
        <Space style={{ width: '100%' }}>
           <Button type="primary" ghost block style={{ color: '#001529', borderColor: '#001529' }}>Request Update</Button>
           <Button block>View Full Profile</Button>
        </Space>
      </div>
    </Card>
  )
}

export default BusinessProfile
