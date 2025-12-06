import React from 'react'
import { Row, Col, Card, Button, Typography } from 'antd'
import { LogoutForm } from "@/features/authentication"
import EditCustomerProfileForm from "@/features/customer/components/EditCustomerProfileForm.jsx"

// Base customer workspace template — intentionally minimal.
// This component provides a stable, simple layout that can be
// extended later with address management, bookings, and history.
export default function CustomerWorkspaceGate() {
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <LogoutForm />
        </Col>
        <Col span={18}>
          <Card title="Customer Workspace" style={{ marginBottom: 12 }}>
            <Typography.Paragraph>
              This is the base customer workspace. Use the profile form to update your details.
            </Typography.Paragraph>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => window.alert('Addresses feature available in full implementation')}>Manage Addresses</Button>
              <Button onClick={() => window.alert('Bookings feature available in full implementation')}>Book a Service</Button>
              <Button onClick={() => window.alert('Appointments history available in full implementation')}>View Appointments</Button>
            </div>
          </Card>
          <EditCustomerProfileForm />
        </Col>
      </Row>
    </>
  )
}