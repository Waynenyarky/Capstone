import React from 'react'
import { Card, Tag, Typography, Button, Space, Row, Col } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

const ComplianceStatus = ({ data }) => {
  if (!data) return null

  let statusColor = 'green'
  let StatusIcon = CheckCircleOutlined
  
  if (data.status === 'Action Required') {
    statusColor = 'orange'
    StatusIcon = ExclamationCircleOutlined
  } else if (data.status === 'Non-Compliant') {
    statusColor = 'red'
    StatusIcon = CloseCircleOutlined
  }

  return (
    <Card 
      title={<Space><SafetyCertificateOutlined style={{ color: '#003a70' }} /> Compliance Status</Space>}
      extra={<Tag color={statusColor} style={{ fontSize: 14, padding: '4px 10px' }}>{data.status}</Tag>}
      style={{ height: '100%', borderTop: `4px solid ${statusColor === 'green' ? '#52c41a' : statusColor === 'orange' ? '#faad14' : '#ff4d4f'}`, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={10}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
             <StatusIcon style={{ fontSize: 64, color: statusColor === 'green' ? '#52c41a' : statusColor === 'orange' ? '#faad14' : '#ff4d4f', marginBottom: 16 }} />
             <Title level={3} style={{ margin: 0, color: statusColor === 'green' ? '#389e0d' : statusColor === 'orange' ? '#d46b08' : '#cf1322' }}>
               {data.reason || 'All systems go'}
             </Title>
             <Text type="secondary">Last validated: {new Date(data.lastValidation).toLocaleDateString()}</Text>
          </div>
        </Col>
        
        <Col xs={24} md={14}>
          <Card type="inner" variant="borderless" style={{ background: '#fafafa', borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">Verification</Text>
                <Space>
                  {data.verified && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
                  <Text strong style={{ fontSize: 16 }}>{data.verified ? 'Blockchain-verified record' : 'Pending Verification'}</Text>
                </Space>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">Operating Risk Level</Text>
                <Tag color={data.riskLevel === 'Low' ? 'green' : data.riskLevel === 'Medium' ? 'orange' : 'red'} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {data.riskLevel} Risk
                </Tag>
              </div>

              <div style={{ paddingTop: 8 }}>
                 <Button type="primary" size="large" block danger={data.status !== 'Compliant'} style={data.status === 'Compliant' ? { background: '#003a70', borderColor: '#003a70' } : {}}>
                   {data.status === 'Compliant' ? 'View Certificate' : 'Resolve Issue'}
                 </Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  )
}

export default ComplianceStatus
