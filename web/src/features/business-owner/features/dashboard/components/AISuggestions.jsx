import React from 'react'
import { Card, Alert, Button, Space, Row, Col, Typography, Badge } from 'antd'
import { BulbOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Text } = Typography

const AISuggestions = ({ data }) => {
  if (!data) return null

  return (
    <Card 
      title={<Space><BulbOutlined style={{ color: '#001529' }} /> Smart Insights</Space>}
      variant="borderless"
      style={{ 
        marginTop: 24, 
        background: 'linear-gradient(to right, #f0f5ff, #ffffff)', 
        border: '1px solid #d6e4ff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
      extra={<Badge count={data.length} style={{ backgroundColor: '#faad14' }} />}
    >
      <Row gutter={[24, 24]}>
        {data.map(item => (
          <Col xs={24} md={8} key={item.id}>
             <Card 
               hoverable 
               style={{ height: '100%', borderColor: item.type === 'warning' ? '#ffccc7' : '#d9f7be' }}
               bodyStyle={{ padding: '16px' }}
             >
               <Space direction="vertical" style={{ width: '100%' }}>
                 <Space align="start">
                    <Alert 
                      type={item.type} 
                      message={null} 
                      showIcon 
                      style={{ background: 'transparent', padding: 0, border: 'none' }} 
                    />
                    <Text strong style={{ fontSize: 15 }}>{item.text}</Text>
                 </Space>
                 
                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                   <Button type="link" size="small" style={{ padding: 0 }} icon={<ArrowRightOutlined />}>
                     Action
                   </Button>
                 </div>
               </Space>
             </Card>
          </Col>
        ))}
      </Row>
    </Card>
  )
}

export default AISuggestions
