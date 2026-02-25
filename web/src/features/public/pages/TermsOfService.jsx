import React from 'react'
import { Layout, Typography, Divider, Collapse, Alert, theme } from 'antd'
import { Link } from 'react-router-dom'
import HomeHeader from '../components/HomeHeader'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout
const { Title, Paragraph } = Typography

export default function TermsOfService() {
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader />
      <Content style={{ padding: '24px 16px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <Typography>
          <Link to="/" style={{ color: token.colorPrimary, marginBottom: 24, display: 'inline-block' }}>
            ← Back to home
          </Link>
          <Title level={2} style={{ marginTop: 0 }}>Terms of Service</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Effective January 1, 2026. By using the BizClear Portal you agree to these terms.
          </Paragraph>

          <Paragraph>
            These terms govern your use of the online business permit system provided by the City Government of Alaminos.
          </Paragraph>

          <Collapse
            defaultActiveKey={['1']}
            items={[
              {
                key: '1',
                label: '1. User responsibilities',
                children: (
                  <>
                    <Paragraph>You agree to provide accurate information, keep your account secure, and use the system only for lawful business registration.</Paragraph>
                    <Alert
                      message="Falsification"
                      description="Submitting false documents or statements is a criminal offense under the Revised Penal Code and may result in permit revocation."
                      type="warning"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  </>
                ),
              },
              {
                key: '2',
                label: '2. Digital submissions',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    Electronic submissions and e-signatures have the same legal effect as written signatures under the Electronic Commerce Act of 2000 (Republic Act No. 8792).
                  </Paragraph>
                ),
              },
              {
                key: '3',
                label: '3. Prohibited activities',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    You may not: gain unauthorized access to the system or other accounts; use bots or scrapers; disrupt the system; or harass LGU staff or other users.
                  </Paragraph>
                ),
              },
              {
                key: '4',
                label: '4. Service availability',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    We aim for high uptime but do not guarantee uninterrupted access. We are not liable for maintenance delays, user or connectivity errors, or delays from incomplete submissions or external verification.
                  </Paragraph>
                ),
              },
              {
                key: '5',
                label: '5. Intellectual property',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    Content in the BizClear Portal is property of the City Government of Alaminos. Unauthorized reproduction or redistribution is prohibited.
                  </Paragraph>
                ),
              },
              {
                key: '6',
                label: '6. Termination',
                children: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    The City Government may suspend or terminate your account without prior notice for violation of these terms or illegal business activity.
                  </Paragraph>
                ),
              },
            ]}
          />

          <Divider />

          <Paragraph type="secondary" style={{ marginBottom: 4 }}>Questions</Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>
            Business Permit and Licensing Office (BPLO) — <a href="mailto:bplo@alaminoscity.gov.ph">bplo@alaminoscity.gov.ph</a> · (075) 522-1111
          </Paragraph>
        </Typography>
      </Content>
      <HomeFooter />
    </Layout>
  )
}
