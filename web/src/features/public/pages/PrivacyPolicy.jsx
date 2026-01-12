import React from 'react'
import { Layout, Typography, Divider, Button, Card, Collapse, Alert, Tag, Tooltip } from 'antd'
import { ArrowLeftOutlined, LockOutlined, SafetyCertificateOutlined, EyeOutlined, PrinterOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import HomeHeader from '../components/HomeHeader'
import HomeFooter from '../components/HomeFooter'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  const [activeKeys, setActiveKeys] = React.useState(['1'])
  const [accordionMode, setAccordionMode] = React.useState(true)

  const handlePrint = () => {
    setAccordionMode(false)
    setActiveKeys(['1', '2', '3', '4', '5'])
    setTimeout(() => {
      window.print()
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <LockOutlined style={{ fontSize: 32, color: '#40a9ff' }} />
                <Title level={1} style={{ color: '#fff', margin: 0 }}>Privacy Policy</Title>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, display: 'block', marginLeft: 48 }}>
                Data Protection Statement
              </Text>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, marginLeft: 48 }}>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  Effective Date: January 1, 2026
                </Text>
                <Tooltip title="This is the date when the current version of the Privacy Policy came into full legal effect. All data processing activities from this date onwards are governed by this policy.">
                  <QuestionCircleOutlined style={{ color: 'rgba(255,255,255,0.45)', cursor: 'help' }} />
                </Tooltip>
              </div>
            </div>

            <Alert
              message="Data Privacy Commitment"
              description="The City Government of Dagupan values your privacy. We process your personal data in strict compliance with the Data Privacy Act of 2012 (Republic Act No. 10173)."
              type="success"
              showIcon
              icon={<SafetyCertificateOutlined style={{ fontSize: 24 }} />}
              style={{ marginBottom: 32, borderRadius: 8, border: '1px solid #b7eb8f', background: '#f6ffed' }}
            />

            <Typography>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
                This Privacy Policy outlines how the <strong>BizClear Portal</strong> collects, uses, maintains, and discloses information collected from users. We are committed to ensuring that your personal information is secure and used only for legitimate government transactions.
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
                    label: <Title level={4} style={{ margin: 0 }}>1. Information We Collect</Title>,
                    children: (
                      <>
                        <Paragraph>We collect the following data to process your business permits:</Paragraph>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                          <Tag color="blue">Personal Details</Tag>
                          <Tag color="cyan">Contact Info</Tag>
                          <Tag color="geekblue">Business Financials</Tag>
                          <Tag color="purple">Gov't ID Numbers</Tag>
                        </div>
                        <ul style={{ lineHeight: 1.8 }}>
                          <li><strong>Personal Identification:</strong> Name, email address, phone number, and TIN.</li>
                          <li><strong>Business Details:</strong> Trade name, business address, capitalization, gross sales, and employee count.</li>
                          <li><strong>Supporting Documents:</strong> Digital copies of DTI/SEC Registration, Barangay Clearance, Lease Contracts, and Fire Safety Certificates.</li>
                        </ul>
                      </>
                    )
                  },
                  {
                    key: '2',
                    label: <Title level={4} style={{ margin: 0 }}>2. Purpose of Data Collection</Title>,
                    children: (
                      <Paragraph>
                        Your data is used strictly for legitimate government functions:
                        <ul>
                          <li><strong>Processing:</strong> To evaluate your application for a new or renewal business permit.</li>
                          <li><strong>Assessment:</strong> To calculate applicable local taxes, fees, and charges.</li>
                          <li><strong>Verification:</strong> To validate submitted documents with relevant agencies (BFP, CHO, CEO).</li>
                          <li><strong>Communication:</strong> To send automated notifications regarding application status and tax deadlines.</li>
                        </ul>
                      </Paragraph>
                    )
                  },
                  {
                    key: '3',
                    label: <Title level={4} style={{ margin: 0 }}>3. Data Sharing & Disclosure</Title>,
                    children: (
                      <>
                        <Paragraph>We do not sell or trade your personal data. However, data may be shared with:</Paragraph>
                        <ul style={{ lineHeight: 1.8 }}>
                          <li><strong>Internal LGU Departments:</strong> City Treasurer’s Office, City Planning, and Zoning Office for regulatory clearance.</li>
                          <li><strong>National Agencies:</strong> Bureau of Fire Protection (BFP) and DTI/SEC for cross-verification.</li>
                          <li><strong>Legal Compliance:</strong> Courts or law enforcement agencies if required by a subpoena or court order.</li>
                        </ul>
                      </>
                    )
                  },
                  {
                    key: '4',
                    label: <Title level={4} style={{ margin: 0 }}>4. Security Measures</Title>,
                    children: (
                      <Paragraph>
                        We employ industry-standard security protocols to protect your data:
                        <ul>
                          <li><strong>Encryption:</strong> All data in transit is encrypted via SSL/TLS. Sensitive data at rest is encrypted.</li>
                          <li><strong>Access Control:</strong> Only authorized LGU personnel with specific roles (Role-Based Access Control) can access your data.</li>
                          <li><strong>Audit Trails:</strong> The system logs all access and modifications to your records for accountability.</li>
                        </ul>
                      </Paragraph>
                    )
                  },
                  {
                    key: '5',
                    label: <Title level={4} style={{ margin: 0 }}>5. Your Data Privacy Rights</Title>,
                    children: (
                      <Paragraph>
                        Under the Data Privacy Act, you have the right to:
                        <ul>
                          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                          <li><strong>Erasure:</strong> Request deletion of data that is no longer necessary for the purpose it was collected (subject to record-keeping laws).</li>
                          <li><strong>Complaint:</strong> File a complaint with the National Privacy Commission if you believe your rights have been violated.</li>
                        </ul>
                      </Paragraph>
                    )
                  }
                ]}
              />

              <Divider style={{ margin: '40px 0' }} />

              <div style={{ textAlign: 'center' }}>
                <Title level={4}>Data Protection Officer (DPO)</Title>
                <Paragraph type="secondary">
                  If you have concerns about how your data is handled, please contact our DPO.
                </Paragraph>
                <Paragraph style={{ fontSize: 16 }}>
                  <strong>City Government of Dagupan</strong><br />
                  <a href="mailto:privacy@dagupan.gov.ph">privacy@dagupan.gov.ph</a> • (075) 522-1111
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
