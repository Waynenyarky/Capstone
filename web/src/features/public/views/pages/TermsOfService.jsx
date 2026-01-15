import React from 'react'
import { Layout, Typography, Divider, Button, Card, Collapse, Row, Col, Alert, Tooltip } from 'antd'
import { ArrowLeftOutlined, SafetyCertificateOutlined, InfoCircleOutlined, WarningOutlined, PrinterOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import HomeHeader from '../components/HomeHeader'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

export default function TermsOfService() {
  const navigate = useNavigate()
  const [activeKeys, setActiveKeys] = React.useState(['1'])
  const [accordionMode, setAccordionMode] = React.useState(true)

  const handlePrint = () => {
    setAccordionMode(false)
    setActiveKeys(['1', '2', '3', '4', '5', '6'])
    setTimeout(() => {
      window.print()
      // Optional: Restore state after print dialog closes (though browser behavior varies)
    }, 100)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <HomeHeader />
      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/sign-up')}
              style={{ paddingLeft: 0, fontSize: 16 }}
            >
              Back to Registration
            </Button>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>

          <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)', padding: '40px 32px', color: '#fff', margin: '-24px -24px 32px -24px' }}>
              <Title level={1} style={{ color: '#fff', margin: 0 }}>Terms of Service</Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 8, display: 'block' }}>
                Master Service Agreement
              </Text>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  Effective Date: January 1, 2026
                </Text>
                <Tooltip title="This is the date when the current version of the Terms of Service came into full legal effect. All usage of the system from this date onwards is governed by these terms.">
                  <QuestionCircleOutlined style={{ color: 'rgba(255,255,255,0.45)', cursor: 'help' }} />
                </Tooltip>
              </div>
            </div>

            <Alert
              message="Important Legal Notice"
              description="By using the BizClear Portal, you enter into a binding legal agreement with the City Government of Dagupan. Please read these terms carefully."
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ fontSize: 24 }} />}
              style={{ marginBottom: 32, borderRadius: 8, border: '1px solid #bae7ff', background: '#e6f7ff' }}
            />

            <Typography>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
                Welcome to the <strong>BizClear Portal</strong> ("System"). These Terms of Service ("Terms") govern your access to and use of the online business permit and licensing system provided by the City Government of Dagupan. By creating an account or using the System, you agree to these Terms.
              </Paragraph>

              <Collapse 
                accordion={accordionMode}
                bordered={false} 
                activeKey={activeKeys}
                onChange={setActiveKeys}
                expandIconPosition="end"
                style={{ background: 'transparent' }}
                items={[
                  {
                    key: '1',
                    label: <Title level={4} style={{ margin: 0 }}>1. User Responsibilities & Conduct</Title>,
                    children: (
                      <>
                        <Paragraph>As a registered user, you explicitly agree to:</Paragraph>
                        <ul style={{ lineHeight: 1.8 }}>
                          <li><strong>Accuracy of Information:</strong> Provide true, current, and complete information in all application forms and declarations.</li>
                          <li><strong>Account Security:</strong> Safeguard your login credentials. You are responsible for all activities that occur under your account.</li>
                          <li><strong>Compliance:</strong> Use the System solely for lawful business registration purposes in accordance with local ordinances and national laws.</li>
                        </ul>
                        <Alert
                          message="Penalty for Falsification"
                          description="Submission of falsified documents (e.g., fake Barangay Clearance, altered DTI Registration) or false statements is a criminal offense punishable under Article 171/172 of the Revised Penal Code of the Philippines and may result in the revocation of your business permit."
                          type="error"
                          showIcon
                          icon={<WarningOutlined />}
                          style={{ marginTop: 16 }}
                        />
                      </>
                    )
                  },
                  {
                    key: '2',
                    label: <Title level={4} style={{ margin: 0 }}>2. Digital Submissions & E-Signatures</Title>,
                    children: (
                      <Paragraph>
                        By submitting applications electronically, you acknowledge that your digital submission constitutes your formal application. You agree that electronic signatures, clicks of "Agree," or submission of forms carry the same legal weight as wet-ink signatures under the Electronic Commerce Act of 2000 (Republic Act No. 8792).
                      </Paragraph>
                    )
                  },
                  {
                    key: '3',
                    label: <Title level={4} style={{ margin: 0 }}>3. Prohibited Activities</Title>,
                    children: (
                      <>
                        <Paragraph>You are strictly prohibited from:</Paragraph>
                        <ul>
                          <li>Attempting to gain unauthorized access to the System, other user accounts, or computer systems.</li>
                          <li>Using any automated means (bots, scrapers) to access the System.</li>
                          <li>Interfering with the proper operation of the System or placing an unreasonable load on our infrastructure.</li>
                          <li>Harassing, threatening, or intimidating LGU officers or other users through the platform.</li>
                        </ul>
                      </>
                    )
                  },
                  {
                    key: '4',
                    label: <Title level={4} style={{ margin: 0 }}>4. Service Availability & Limitations</Title>,
                    children: (
                      <Paragraph>
                        The City Government strives to maintain 99.9% system uptime. However, we do not guarantee uninterrupted access. We are not liable for:
                        <ul>
                          <li>Delays caused by scheduled maintenance or unforeseen technical failures.</li>
                          <li>Data loss due to user error or connectivity issues.</li>
                          <li>Processing delays arising from incomplete document submissions or external agency verifications.</li>
                        </ul>
                      </Paragraph>
                    )
                  },
                  {
                    key: '5',
                    label: <Title level={4} style={{ margin: 0 }}>5. Intellectual Property</Title>,
                    children: (
                      <Paragraph>
                        All content within the BizClear Portal, including but not limited to text, graphics, logos, and software code, is the exclusive property of the City Government of Dagupan and is protected by Philippine copyright laws. Unauthorized reproduction or redistribution is strictly prohibited.
                      </Paragraph>
                    )
                  },
                  {
                    key: '6',
                    label: <Title level={4} style={{ margin: 0 }}>6. Termination of Access</Title>,
                    children: (
                      <Paragraph>
                        The City Government reserves the right to suspend or terminate your account without prior notice if you are found to be in violation of these Terms, or if your business is found to be operating illegally.
                      </Paragraph>
                    )
                  }
                ]}
              />

              <Divider style={{ margin: '40px 0' }} />

              <div style={{ textAlign: 'center' }}>
                <Title level={4}>Questions or Concerns?</Title>
                <Paragraph type="secondary">
                  For legal inquiries regarding these Terms, please contact the City Legal Office.
                </Paragraph>
                <Paragraph style={{ fontSize: 16 }}>
                  <strong>Business Permit and Licensing Office (BPLO)</strong><br />
                  <a href="mailto:bplo@dagupan.gov.ph">bplo@dagupan.gov.ph</a> • (075) 522-1111
                </Paragraph>
              </div>
            </Typography>
          </Card>
        </div>
      </Content>
      <HomeFooter />
    </Layout>
  )
}
