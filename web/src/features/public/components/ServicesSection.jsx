import { Row, Col, Card, Typography, Grid } from 'antd'
import { SafetyCertificateOutlined, ScheduleOutlined, SyncOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function ServicesSection() {
  const screens = useBreakpoint()

  const infoCards = [
    {
      title: 'Permit Application',
      icon: <SafetyCertificateOutlined style={{ fontSize: '28px', color: '#fff' }} />,
      iconBg: '#1890ff',
      content: 'Submit new business permit applications digitally. Upload requirements and track status in real-time.',
      action: 'Apply Now'
    },
    {
      title: 'Inspection Scheduling',
      icon: <ScheduleOutlined style={{ fontSize: '28px', color: '#fff' }} />,
      iconBg: '#52c41a',
      content: 'Schedule and monitor inspections. Receive digital updates and results directly in the system.',
      action: 'Schedule'
    },
    {
      title: 'Permit Renewal',
      icon: <SyncOutlined style={{ fontSize: '28px', color: '#fff' }} />,
      iconBg: '#faad14',
      content: 'Renew existing permits before expiry. Automated reminders and simplified renewal tracking.',
      action: 'Renew'
    },
  ]

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: screens.md ? '-40px auto 0' : '24px auto 0', 
      padding: '0 24px', 
      position: 'relative', 
      zIndex: 1 
    }}>
      <Row gutter={[24, 24]}>
        {infoCards.map((card, index) => (
          <Col xs={24} md={8} key={index}>
            <Card 
              hoverable
              bordered={false}
              style={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '8px' }}
              bodyStyle={{ padding: '32px 24px' }}
            >
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: card.iconBg, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {card.icon}
                </div>
                <ArrowRightOutlined style={{ color: '#d9d9d9', fontSize: '20px' }} />
              </div>
              <Title level={4} style={{ marginBottom: '16px' }}>{card.title}</Title>
              <Paragraph type="secondary" style={{ marginBottom: '0', minHeight: '44px' }}>
                {card.content}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
