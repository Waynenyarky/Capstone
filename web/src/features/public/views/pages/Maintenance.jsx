import { Layout, Card, Typography, Space, Tag, Divider } from 'antd'
import HomeHeader from '../components/HomeHeader.jsx'
import HomeFooter from '../components/HomeFooter.jsx'
import { useEffect, useState } from 'react'
import { getMaintenanceStatus } from '../../services/maintenanceService.js'

const { Title, Text } = Typography

export default function Maintenance() {
  const [status, setStatus] = useState({ active: true })

  useEffect(() => {
    getMaintenanceStatus()
      .then((res) => setStatus(res || { active: true }))
      .catch(() => setStatus({ active: true }))
  }, [])

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <HomeHeader />
      <Layout.Content style={{ padding: '48px 16px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Card
            style={{ borderColor: '#d1d5db' }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
              <Space align="start" size="large">
                <img
                  src="https://www.dagupan.gov.ph/wp-content/uploads/2019/11/dagupancity_seal.png"
                  alt="Dagupan City Seal"
                  style={{ width: 64, height: 64, objectFit: 'contain' }}
                />
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ letterSpacing: 0.8 }}>REPUBLIC OF THE PHILIPPINES</Text>
                  <Text type="secondary" style={{ letterSpacing: 0.6 }}>CITY GOVERNMENT OF DAGUPAN</Text>
                  <Text type="secondary" style={{ letterSpacing: 0.4 }}>Dagupan City Service Portal</Text>
                  <Title level={3} style={{ margin: 0 }}>System Maintenance Advisory</Title>
                  <Tag color="blue">Official Notice</Tag>
                </Space>
              </Space>
            </div>
            <div style={{ padding: 24 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Text>
                  The City Government of Dagupan is performing scheduled maintenance to improve the reliability, security, and continuity of online public services.
                </Text>
                <Text type="secondary">
                  {status?.message || 'The site is temporarily unavailable while we perform system updates.'}
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <Space direction="vertical" size={4}>
                  <Text strong>Service Status</Text>
                  <Text type="secondary">Online transactions and application tracking are temporarily unavailable.</Text>
                  {status?.expectedResumeAt && (
                    <Text>Expected restoration of service: {new Date(status.expectedResumeAt).toLocaleString()}</Text>
                  )}
                </Space>
                <Divider style={{ margin: '8px 0' }} />
                <Space direction="vertical" size={4}>
                  <Text strong>Public Assistance</Text>
                  <Text type="secondary">
                    For urgent concerns, please contact your local LGU office or check the portal again later for updates.
                  </Text>
                </Space>
              </Space>
            </div>
          </Card>
        </div>
      </Layout.Content>
      <HomeFooter />
    </Layout>
  )
}
