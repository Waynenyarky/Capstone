import React from 'react'
import { Card, Typography, Space } from 'antd'
import { Link } from 'react-router-dom'
import { DashboardOutlined, FileTextOutlined } from '@ant-design/icons'
import { StaffLayout } from '../../components'

const { Title, Text } = Typography

export default function LGUOfficerDashboard() {
  return (
    <StaffLayout 
      pageTitle="Dashboard"
      pageIcon={<DashboardOutlined />}
    >
      <div style={{ padding: 24 }}>
        <Card hoverable style={{ maxWidth: 400 }}>
          <Space direction="vertical" size="small">
            <Space>
              <FileTextOutlined style={{ fontSize: 20 }} />
              <Title level={5} style={{ margin: 0 }}>Applications</Title>
            </Space>
            <Text type="secondary">Review and process permit applications</Text>
            <Link to="/staff/applications">
              <Text type="link">Go to Applications</Text>
            </Link>
          </Space>
        </Card>
      </div>
    </StaffLayout>
  )
}
