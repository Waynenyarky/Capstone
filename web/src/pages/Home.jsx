import { Layout, Button, Typography, Card, Row, Col, Space, Divider, Alert, List, Badge, theme } from 'antd'
import { Link } from 'react-router-dom'
import { 
  BankOutlined, 
  SafetyCertificateOutlined, 
  ScheduleOutlined, 
  SyncOutlined, 
  InfoCircleOutlined, 
  LoginOutlined, 
  UserAddOutlined,
  ArrowRightOutlined,
  BellOutlined,
  GlobalOutlined
} from '@ant-design/icons'

const { Header, Content, Footer } = Layout
const { Title, Text, Paragraph } = Typography
const { useToken } = theme

export default function Home() {
  const { token } = useToken()
  
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

  const notices = [
    { type: 'info', message: 'System Maintenance', description: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM.' },
    { type: 'warning', message: 'Renewal Deadline', description: 'Business permit renewals for 2026 are due by January 31.' },
  ]

  const resourceLinks = [
    { label: 'Dagupan Official Website', url: 'https://www.dagupan.gov.ph/' },
    { label: 'Citizen’s Charter', url: 'https://www.dagupan.gov.ph/residents/citizens-charter/' },
    { label: 'New Permit Guide', url: 'https://www.dagupan.gov.ph/residents/applying-for-a-new-business-permit/' },
    { label: 'Renewal Guide', url: 'https://www.dagupan.gov.ph/residents/applying-for-renewal-of-business-permit/' },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      {/* 1. Modern Header */}
      <Header style={{ 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 50px', 
        height: '72px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'linear-gradient(135deg, #003a70 0%, #0050b3 100%)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BankOutlined style={{ fontSize: '24px', color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, lineHeight: 1.2, color: '#003a70' }}>BizClear</Title>
            <Text type="secondary" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>DAGUPAN CITY PORTAL</Text>
          </div>
        </div>
        <Space>
          <Link to="/login">
            <Button type="text" icon={<LoginOutlined />}>Log In</Button>
          </Link>
          <Link to="/sign-up">
            <Button type="primary" style={{ background: '#003a70' }}>Register Business</Button>
          </Link>
        </Space>
      </Header>

      <Content>
        {/* 2. Hero Section with Gradient */}
        <div style={{ 
          background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)', 
          padding: '80px 50px',
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Badge.Ribbon text="Official Portal" color="#faad14">
              <div style={{ padding: '20px' }}>
                <Title level={1} style={{ color: '#fff', marginBottom: '24px', fontSize: '48px', fontWeight: 700 }}>
                  Streamlined Business Compliance
                </Title>
              </div>
            </Badge.Ribbon>
            <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', marginBottom: '40px', lineHeight: 1.8 }}>
              Welcome to the <b>BizClear Portal</b> of Dagupan City. 
              Securely manage your business permits, schedule inspections, and stay compliant with local regulations—all in one place.
            </Paragraph>
            <Space size="middle">
              <Link to="/sign-up">
                <Button type="primary" size="large" icon={<UserAddOutlined />} style={{ height: '56px', padding: '0 40px', fontSize: '18px', borderRadius: '4px' }}>
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button ghost size="large" style={{ height: '56px', padding: '0 40px', fontSize: '18px', borderRadius: '4px' }}>
                  Access Account
                </Button>
              </Link>
            </Space>
          </div>
        </div>

        {/* 3. Services Grid */}
        <div style={{ maxWidth: '1200px', margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}>
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

        {/* 4. Secondary Content Area */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
          <Row gutter={[48, 48]}>
            {/* Notices Panel */}
            <Col xs={24} lg={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <BellOutlined style={{ fontSize: '20px', color: '#003a70' }} />
                <Title level={3} style={{ margin: 0 }}>System Advisories</Title>
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {notices.map((notice, idx) => (
                  <Alert
                    key={idx}
                    message={<Text strong>{notice.message}</Text>}
                    description={notice.description}
                    type={notice.type}
                    showIcon
                    style={{ borderRadius: '6px', border: 'none', background: notice.type === 'info' ? '#e6f7ff' : '#fffbe6' }}
                  />
                ))}
                <Alert 
                  message="Coming Soon: Online Payments" 
                  description="We are integrating digital payment gateways for seamless transaction processing."
                  type="success"
                  showIcon
                  style={{ borderRadius: '6px', border: 'none', background: '#f6ffed' }}
                />
              </Space>
            </Col>

            {/* Quick Links */}
            <Col xs={24} lg={10}>
              <div style={{ background: '#fafafa', padding: '32px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <GlobalOutlined style={{ fontSize: '20px', color: '#003a70' }} />
                  <Title level={4} style={{ margin: 0 }}>Official Resources</Title>
                </div>
                <List
                  itemLayout="horizontal"
                  dataSource={resourceLinks}
                  renderItem={item => (
                    <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#595959', fontSize: '15px', width: '100%' }}
                        className="hover-link"
                      >
                        <InfoCircleOutlined style={{ fontSize: '14px', color: '#bfbfbf' }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <ArrowRightOutlined style={{ fontSize: '12px', opacity: 0.5 }} />
                      </a>
                    </List.Item>
                  )}
                />
                <Divider style={{ margin: '24px 0' }} />
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Need assistance? Contact the <a href="https://www.dagupan.gov.ph" target="_blank" rel="noreferrer">City Business Permit & Licensing Office</a>.
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.45)', padding: '40px 0' }}>
        <Space direction="vertical" size="small">
          <Text strong style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>BizClear Portal</Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)' }}>The Official Business Permit System of Dagupan City</Text>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0', width: '200px', minWidth: '200px' }} />
          <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>© 2026 City Government of Dagupan. All Rights Reserved.</Text>
        </Space>
      </Footer>
    </Layout>
  )
}
