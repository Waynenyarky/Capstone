import React from 'react'
import { Card, Alert, Button, Space, Row, Col, Typography, Badge, theme } from 'antd'
import { BulbOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

const AISuggestions = ({ data }) => {
  if (!data) return null
  const { token } = theme.useToken()
  const navigate = useNavigate()

  return (
    <Card 
      title={<Space><BulbOutlined style={{ color: token.colorPrimary }} /> Smart Insights</Space>}
      variant="borderless"
      style={{ 
        marginTop: 24, 
        background: `linear-gradient(to right, ${token.colorPrimaryBg}, ${token.colorBgContainer})`, 
        border: `1px solid ${token.colorPrimaryBorder}`,
        boxShadow: token.boxShadowSecondary,
        borderRadius: token.borderRadiusLG
      }}
      extra={<Badge count={data.length} style={{ backgroundColor: token.colorWarning }} />}
    >
      <Row gutter={[24, 24]}>
        {data.map(item => (
          <Col xs={24} md={8} key={item.id}>
             <Card 
               style={{ height: '100%', borderColor: item.type === 'warning' ? token.colorErrorBorder : token.colorSuccessBorder, cursor: 'pointer' }}
               styles={{ body: { padding: '16px' } }}
               onClick={() => navigate('/owner/businesses')}
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
                   <Button type="link" size="small" style={{ padding: 0 }} icon={<ArrowRightOutlined />} onClick={() => navigate('/owner/businesses')}>
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
