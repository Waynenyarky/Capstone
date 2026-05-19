import React, { useState } from 'react'
import { Typography, Input, Button, Card, Modal, Form, Select, Upload, theme, Grid, Collapse } from 'antd'
import { SearchOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid
const { TextArea } = Input
const { Option } = Select

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'What information can I see about a business?',
    children: 'You can view the business name, type/category, permit validity, barangay/location, and verification status. Personal information such as owner address, phone numbers, and financial data are not publicly displayed.',
  },
  {
    key: '2',
    label: 'How do I report a business with a fake permit?',
    children: 'Click the &ldquo;Report Business&rdquo; button on the business profile page. Select the report type (e.g., Fake Permit), provide a description, and optionally upload evidence. Include your contact email for follow-up.',
  },
  {
    key: '3',
    label: 'What happens after I submit a report?',
    children: 'Your report will be reviewed by the BPLO office. If verified, appropriate action will be taken against the business. You may be contacted for additional information if needed.',
  },
  {
    key: '4',
    label: 'Is the verification badge always accurate?',
    children: 'The verification badge indicates that the business has completed the permit application process. However, if you suspect a business is operating with fake documents, please report it immediately.',
  },
  {
    key: '5',
    label: 'Can I search for businesses by barangay?',
    children: 'Yes, you can search for businesses by name or filter by barangay. The search results are displayed alphabetically for easy navigation.',
  },
]

const MOCK_BUSINESSES = [
  {
    id: 'BC-2026-00124',
    name: 'ABC Hardware',
    status: 'Active',
    permitValidity: 'Valid until Dec 2026',
    businessType: 'Retail',
    barangay: 'San Isidro',
    verificationBadge: 'Verified',
  },
  {
    id: 'BC-2026-00125',
    name: 'Alaminos General Merchandise',
    status: 'Active',
    permitValidity: 'Valid until Jan 2027',
    businessType: 'Retail',
    barangay: 'Poblacion',
    verificationBadge: 'Verified',
  },
  {
    id: 'BC-2026-00126',
    name: 'Blue Wave Restaurant',
    status: 'Active',
    permitValidity: 'Valid until Nov 2026',
    businessType: 'Food Service',
    barangay: 'Lucap',
    verificationBadge: 'Verified',
  },
  {
    id: 'BC-2026-00127',
    name: 'City Electronics',
    status: 'Active',
    permitValidity: 'Valid until Mar 2027',
    businessType: 'Retail',
    barangay: 'San Jose',
    verificationBadge: 'Verified',
  },
  {
    id: 'BC-2026-00128',
    name: 'Dream Cafe',
    status: 'Active',
    permitValidity: 'Valid until Feb 2027',
    businessType: 'Food Service',
    barangay: 'Pangatian',
    verificationBadge: 'Verified',
  },
]

export default function BusinessSearch() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [form] = Form.useForm()

  const handleSearch = () => {
    // No functionality for now - just show mock results
  }

  const handleBusinessClick = (business) => {
    setSelectedBusiness(business)
    setShowProfile(true)
  }

  const handleReport = () => {
    setShowReportModal(true)
  }

  const handleReportSubmit = () => {
    // No functionality for now
    setShowReportModal(false)
    form.resetFields()
  }

  const handleReportCancel = () => {
    setShowReportModal(false)
    form.resetFields()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: token.colorBgLayout,
      padding: screens.md ? '40px 20px' : '20px 16px',
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '32px' : '24px',
          boxShadow: token.boxShadow,
          marginBottom: 24,
        }}>
          <Title level={2} style={{ marginBottom: 8, textAlign: 'center' }}>
            Business Search
          </Title>
          <Paragraph style={{ marginBottom: 32, textAlign: 'center', color: token.colorTextSecondary }}>
            Search for verified businesses in Alaminos City
          </Paragraph>

          <Input
            size="large"
            placeholder="Search by business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>

        {!showProfile ? (
          <div style={{
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '32px' : '24px',
            boxShadow: token.boxShadow,
            marginBottom: 24,
          }}>
            <Title level={3} style={{ marginBottom: 16 }}>
              Search Results
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Results are arranged alphabetically
            </Paragraph>

            {MOCK_BUSINESSES.map((business) => (
              <Card
                key={business.id}
                style={{
                  marginBottom: 16,
                  cursor: 'pointer',
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: token.borderRadius,
                  transition: 'all 0.2s',
                }}
                hoverable
                onClick={() => handleBusinessClick(business)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
                      {business.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {business.businessType} &bull; {business.barangay}
                    </Text>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: token.colorSuccess,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {business.verificationBadge}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            padding: screens.md ? '32px' : '24px',
            boxShadow: token.boxShadow,
            marginBottom: 24,
          }}>
            <Button
              type="text"
              onClick={() => setShowProfile(false)}
              style={{ marginBottom: 16, padding: 0 }}
            >
              &larr; Back to Results
            </Button>

            <Card
              style={{
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16,
              }}>
                <div>
                  <Title level={3} style={{ marginBottom: 8 }}>
                    {selectedBusiness?.name}
                  </Title>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: token.colorSuccess,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'inline-block',
                  }}>
                    {selectedBusiness?.verificationBadge}
                  </div>
                </div>
                <div style={{
                  padding: '8px 16px',
                  borderRadius: token.borderRadius,
                  background: token.colorBgLayout,
                  border: `1px solid ${token.colorBorder}`,
                }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Verification ID
                  </Text>
                  <Text strong style={{ fontSize: 14 }}>
                    {selectedBusiness?.id}
                  </Text>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: screens.md ? 'repeat(2, 1fr)' : '1fr',
                gap: 16,
                marginBottom: 24,
              }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Status
                  </Text>
                  <Text strong style={{ fontSize: 16, color: token.colorSuccess }}>
                    {selectedBusiness?.status}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Permit Validity
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedBusiness?.permitValidity}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Business Type
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedBusiness?.businessType}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Barangay
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedBusiness?.barangay}
                  </Text>
                </div>
              </div>

              <Button
                danger
                icon={<ExclamationCircleOutlined />}
                onClick={handleReport}
                block
                size="large"
              >
                Report Business
              </Button>
            </Card>
          </div>
        )}

        <div style={{
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '32px' : '24px',
          boxShadow: token.boxShadow,
        }}>
          <Title level={3} style={{ marginBottom: 16 }}>
            Frequently Asked Questions
          </Title>
          <Collapse
            items={FAQ_ITEMS}
            bordered={false}
            style={{
              background: token.colorBgLayout,
            }}
          />
        </div>
      </div>

      <Modal
        title="Report Business"
        open={showReportModal}
        onOk={handleReportSubmit}
        onCancel={handleReportCancel}
        okText="Submit Report"
        cancelText="Cancel"
        width={screens.md ? 600 : '100%'}
        style={{ top: screens.md ? 100 : 0 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Report Type"
            name="reportType"
            rules={[{ required: true, message: 'Please select a report type' }]}
          >
            <Select placeholder="Select report type">
              <Option value="fake_permit">Fake Permit</Option>
              <Option value="invalid_info">Invalid Information</Option>
              <Option value="expired_permit">Expired Permit</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please provide a description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the issue (e.g., Permit number seems invalid)"
            />
          </Form.Item>

          <Form.Item
            label="Optional Evidence"
            name="evidence"
          >
            <Upload
              listType="picture-card"
              maxCount={3}
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Contact Email"
            name="email"
            rules={[
              { required: true, message: 'Please provide your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="your@email.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
