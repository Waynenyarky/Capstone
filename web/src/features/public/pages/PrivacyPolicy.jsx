import React from 'react'
import { Layout, Typography, Divider, Collapse, Alert, Tag, theme } from 'antd'
import { Link } from 'react-router-dom'
import HomeHeader from '../components/HomeHeader'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout
const { Title, Paragraph } = Typography

export default function PrivacyPolicy() {
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader />
      <Content style={{ padding: '24px 16px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <Typography>
          <Link to="/" style={{ color: token.colorPrimary, marginBottom: 24, display: 'inline-block' }}>
            ← Back to home
          </Link>
          <Title level={2} style={{ marginTop: 0 }}>Privacy Policy</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Effective January 1, 2026. The City Government of Alaminos processes your data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).
          </Paragraph>

          <Paragraph>
            This policy describes how the <strong>BizClear Portal</strong> collects, uses, and protects your information.
          </Paragraph>

          <Collapse
            defaultActiveKey={['1']}
            items={[
              {
                key: '1',
                label: '1. Information we collect',
                children: (
                  <>
                    <Paragraph>We collect data needed to process your business permits:</Paragraph>
                    <div style={{ marginBottom: 12 }}>
                      <Tag>Personal details</Tag>
                      <Tag>Contact info</Tag>
                      <Tag>Business financials</Tag>
                      <Tag>Government ID numbers</Tag>
                    </div>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      <li><strong>Personal:</strong> Name, email, phone, TIN.</li>
                      <li><strong>Business:</strong> Trade name, address, capitalization, gross sales, employee count.</li>
                      <li><strong>Documents:</strong> DTI/SEC registration, Barangay Clearance, lease contracts, Fire Safety Certificates.</li>
                    </ul>
                  </>
                ),
              },
              {
                key: '2',
                label: '2. Purpose of data collection',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    Your data is used for: processing and evaluating permit applications; calculating taxes and fees; verifying documents with BFP, CHO, CEO; and sending status and deadline notifications.
                  </Paragraph>
                ),
              },
              {
                key: '3',
                label: '3. Data sharing & disclosure',
                children: (
                  <>
                    <Paragraph>We do not sell your data. We may share it with:</Paragraph>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      <li>Internal LGU departments (Treasurer, Planning, Zoning) for clearance.</li>
                      <li>National agencies (BFP, DTI/SEC) for verification.</li>
                      <li>Courts or law enforcement when required by law.</li>
                    </ul>
                  </>
                ),
              },
              {
                key: '4',
                label: '4. Security measures',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    We use SSL/TLS for data in transit, encrypt sensitive data at rest, restrict access by role (RBAC), and maintain audit logs of access and changes.
                  </Paragraph>
                ),
              },
              {
                key: '5',
                label: '5. Your rights',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    You may request access, correction, or erasure of your data (subject to record-keeping laws). You may file a complaint with the National Privacy Commission.
                  </Paragraph>
                ),
              },
            ]}
          />

          <Divider />

          <Paragraph type="secondary" style={{ marginBottom: 4 }}>Data Protection Officer</Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>
            City Government of Alaminos — <a href="mailto:privacy@alaminoscity.gov.ph">privacy@alaminoscity.gov.ph</a> · (075) 522-1111
          </Paragraph>
        </Typography>
      </Content>
      <HomeFooter />
    </Layout>
  )
}
