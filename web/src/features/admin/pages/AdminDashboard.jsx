import React from 'react'
import { Row, Col } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { TamperIncidentsPanel } from '@/features/admin'

export default function AdminDashboard() {
  return (
    <AdminLayout pageTitle="Admin Dashboard" pageIcon={<DashboardOutlined />}>
      <Row justify="center">
        <Col xs={24} lg={20} xl={18}>
          <p style={{ marginBottom: 16 }}>Role-based administration workspace. Use the sidebar to navigate.</p>
          <div style={{ marginTop: 16 }}>
            <TamperIncidentsPanel />
          </div>
        </Col>
      </Row>
    </AdminLayout>
  )
}
