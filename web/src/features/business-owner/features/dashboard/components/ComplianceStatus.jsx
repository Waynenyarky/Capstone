import React from 'react'
import { Card, Tag, Typography, Button, Space, Row, Col, theme } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography

const ComplianceStatus = ({ data }) => {
  const { token } = theme.useToken();
  const navigate = useNavigate()
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
      title={<Space><SafetyCertificateOutlined style={{ color: token.colorPrimary }} /> Compliance Status</Space>}
      extra={<Tag color={statusColor} style={{ fontSize: 14, padding: '4px 10px' }}>{data.status}</Tag>}
      style={{ height: '100%', borderTop: `4px solid ${statusColor === 'green' ? token.colorSuccess : statusColor === 'orange' ? token.colorWarning : token.colorError}`, borderRadius: token.borderRadiusLG, boxShadow: token.boxShadowSecondary }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={10}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
             <StatusIcon style={{ fontSize: 64, color: statusColor === 'green' ? token.colorSuccess : statusColor === 'orange' ? token.colorWarning : token.colorError, marginBottom: 16 }} />
             <Title level={3} style={{ margin: 0, color: statusColor === 'green' ? token.colorSuccess : statusColor === 'orange' ? token.colorWarning : token.colorError }}>
               {data.reason || 'All systems go'}
             </Title>
             <Text type="secondary">Last validated: {new Date(data.lastValidation).toLocaleDateString()}</Text>
          </div>
        </Col>
        
        <Col xs={24} md={14}>
          <Card type="inner" variant="borderless" style={{ background: token.colorFillAlter, borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">Verification</Text>
                <Space>
                  {data.verified && <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />}
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
                 <Button type="primary" size="large" block danger={data.status !== 'Compliant'} style={data.status === 'Compliant' ? { background: token.colorPrimary, borderColor: token.colorPrimary } : {}} onClick={() => navigate('/owner/businesses?tab=permits')}>
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
