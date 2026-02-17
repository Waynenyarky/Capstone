import { Row, Col, Typography, Space, Alert, List, Divider, Grid } from 'antd'
import { BellOutlined, GlobalOutlined, InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function InfoSection() {
  const screens = useBreakpoint()

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: screens.md ? '80px 24px' : '40px 20px' }}>
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
  )
}
