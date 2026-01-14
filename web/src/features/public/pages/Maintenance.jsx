import { Layout, Card, Typography, Space } from 'antd'
import HomeHeader from '@/features/public/components/HomeHeader.jsx'
import HomeFooter from '@/features/public/components/HomeFooter.jsx'
import { useEffect, useState } from 'react'
import { getMaintenanceStatus } from '../services/maintenanceService.js'

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
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <Title level={2} style={{ marginBottom: 0 }}>We’re doing maintenance</Title>
              <Text type="secondary">
                {status?.message || 'The site is temporarily unavailable while we perform updates.'}
              </Text>
              {status?.expectedResumeAt && (
                <Text strong>Expected back: {new Date(status.expectedResumeAt).toLocaleString()}</Text>
              )}
            </Space>
          </Card>
        </div>
      </Layout.Content>
      <HomeFooter />
    </Layout>
  )
}
