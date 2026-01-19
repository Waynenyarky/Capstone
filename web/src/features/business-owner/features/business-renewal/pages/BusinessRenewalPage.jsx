import React from 'react'
import { Card, Typography, Alert, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../../../views/components/BusinessOwnerLayout'

const { Title, Paragraph } = Typography

const BusinessRenewalPage = () => {
  return (
    <BusinessOwnerLayout pageTitle="Business Renewal">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <ReloadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2} style={{ marginBottom: 8 }}>Business Renewal</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Renew your business registration and permits
          </Paragraph>
        </div>

        <Alert
          message="Business Renewal"
          description="This page is under development. Business renewal functionality will be available soon."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ padding: '24px 0' }}>
          <Paragraph>
            The Business Renewal feature will allow you to:
          </Paragraph>
          <ul style={{ paddingLeft: 24 }}>
            <li>Renew your existing business registration</li>
            <li>Update business information during renewal</li>
            <li>Submit renewal applications for permits</li>
            <li>Track renewal status and deadlines</li>
          </ul>
        </div>
      </Card>
    </BusinessOwnerLayout>
  )
}

export default BusinessRenewalPage
