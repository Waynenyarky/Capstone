import { Row, Col, Card, Typography, Space, Divider, Grid, Tag, Form, Input, Button, message } from 'antd'
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  CustomerServiceOutlined,
  MessageOutlined,
  GlobalOutlined,
  UserOutlined,
  SendOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useState } from 'react'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

export default function ContactSupportSection() {
  const screens = useBreakpoint()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      message.success('Thank you! Your message has been sent successfully. We will get back to you within 24-48 hours.')
      form.resetFields()
    } catch {
      message.error('Failed to send message. Please try again or contact us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: <PhoneOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      title: 'Phone Support',
      primary: '(075) 522-1234',
      secondary: 'Local: 1234',
      description: 'Available during office hours',
      color: '#1890ff'
    },
    {
      icon: <MailOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      title: 'Email Support',
      primary: 'bplo@dagupan.gov.ph',
      secondary: 'support@bizclear.dagupan.gov.ph',
      description: 'Response within 24-48 hours',
      color: '#52c41a'
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      title: 'Office Location',
      primary: 'City Hall, Dagupan City',
      secondary: 'Pangasinan, Philippines 2400',
      description: 'Ground Floor, Business Permit & Licensing Office',
      color: '#faad14'
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      title: 'Office Hours',
      primary: 'Monday - Friday',
      secondary: '8:00 AM - 5:00 PM',
      description: 'Closed on weekends and holidays',
      color: '#722ed1'
    }
  ]

  return (
    <div 
      id="contact-support"
      style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
        padding: screens.md ? '80px 24px' : '60px 20px',
        position: 'relative',
        overflow: 'hidden',
        scrollMarginTop: '72px'
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(0, 50, 115, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        transform: 'translate(30%, -30%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(24, 144, 255, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        transform: 'translate(-30%, 30%)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: screens.md ? '60px' : '40px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Tag 
              color="blue" 
              style={{ 
                padding: '4px 16px', 
                fontSize: '14px', 
                borderRadius: '20px',
                border: 'none',
                fontWeight: 500
              }}
            >
              Get Help
            </Tag>
            <Title level={2} style={{ margin: 0, fontSize: screens.md ? '40px' : '28px', fontWeight: 700 }}>
              Contact Support
            </Title>
            <Paragraph style={{ 
              fontSize: screens.md ? '18px' : '16px', 
              color: '#666', 
              maxWidth: '600px', 
              margin: '16px auto 0',
              lineHeight: 1.6
            }}>
              Our support team is here to assist you with any questions or concerns about your business permit applications and renewals.
            </Paragraph>
          </Space>
        </div>

        {/* Contact Information Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: screens.md ? '60px' : '40px' }}>
          {contactInfo.map((info, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease'
                }}
                styles={{
                  body: { padding: '28px 24px' }
                }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: `${info.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    {info.icon}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '14px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {info.title}
                    </Text>
                    <Title level={5} style={{ margin: '8px 0 4px', fontSize: '16px', fontWeight: 600 }}>
                      {info.primary}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                      {info.secondary}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', color: '#bfbfbf' }}>
                      {info.description}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Divider style={{ margin: '40px 0', borderColor: '#e8e8e8' }} />

        {/* Contact Form & Additional Info */}
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={14}>
            <Card
              style={{
                borderRadius: '16px',
                border: '1px solid #f0f0f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                background: '#fff'
              }}
              styles={{
                body: { 
                  padding: screens.md ? '40px' : '28px'
                }
              }}
            >
              {/* Fixed Header */}
              <div style={{ marginBottom: '32px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #003a70 0%, #0050b3 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MessageOutlined style={{ fontSize: '24px', color: '#fff' }} />
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                      Send Us a Message
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Fill out the form below and we'll get back to you soon
                    </Text>
                  </div>
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="large"
                requiredMark={false}
                autoComplete="off"
              >
                  <Form.Item
                    name="fullName"
                    label={<Text strong style={{ fontSize: '15px' }}>Full Name</Text>}
                    rules={[
                      { required: true, message: 'Please enter your full name' },
                      { min: 2, message: 'Name must be at least 2 characters' }
                    ]}
                    style={{ marginBottom: '20px' }}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                      placeholder="Enter your full name"
                      variant="filled"
                      style={{
                        borderRadius: '8px',
                        fontSize: '15px',
                        padding: '12px 16px'
                      }}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label={<Text strong style={{ fontSize: '15px' }}>Email Address</Text>}
                        rules={[
                          { required: true, message: 'Please enter your email address' },
                          { type: 'email', message: 'Please enter a valid email address' }
                        ]}
                        style={{ marginBottom: '20px' }}
                      >
                        <Input
                          prefix={<MailOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                          placeholder="your.email@example.com"
                          variant="filled"
                          style={{
                            borderRadius: '8px',
                            fontSize: '15px',
                            padding: '12px 16px'
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="phoneNumber"
                        label={<Text strong style={{ fontSize: '15px' }}>Phone Number</Text>}
                        rules={[
                          { required: true, message: 'Please enter your phone number' },
                          { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
                        ]}
                        style={{ marginBottom: '20px' }}
                      >
                        <Input
                          prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                          placeholder="(075) 522-1234"
                          variant="filled"
                          style={{
                            borderRadius: '8px',
                            fontSize: '15px',
                            padding: '12px 16px'
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="subject"
                    label={<Text strong style={{ fontSize: '15px' }}>Subject</Text>}
                    rules={[
                      { required: true, message: 'Please enter a subject' },
                      { min: 5, message: 'Subject must be at least 5 characters' }
                    ]}
                    style={{ marginBottom: '20px' }}
                  >
                    <Input
                      prefix={<FileTextOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                      placeholder="What is this regarding?"
                      variant="filled"
                      style={{
                        borderRadius: '8px',
                        fontSize: '15px',
                        padding: '12px 16px'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="message"
                    label={<Text strong style={{ fontSize: '15px' }}>Message</Text>}
                    rules={[
                      { required: true, message: 'Please enter your message' },
                      { min: 10, message: 'Message must be at least 10 characters' }
                    ]}
                    style={{ marginBottom: '24px' }}
                  >
                    <TextArea
                      rows={8}
                      placeholder="Please provide details about your inquiry, question, or concern..."
                      variant="filled"
                      style={{
                        borderRadius: '8px',
                        fontSize: '15px',
                        padding: '12px 16px',
                        resize: 'none',
                        overflowY: 'auto',
                        minHeight: '180px',
                        maxHeight: '300px'
                      }}
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: '16px', marginTop: '24px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      block
                      icon={<SendOutlined />}
                      style={{
                        height: '52px',
                        fontSize: '16px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #003a70 0%, #0050b3 100%)',
                        border: 'none',
                        boxShadow: '0 4px 14px rgba(0, 58, 112, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Form.Item>

                  <div style={{
                    padding: '16px',
                    background: '#f5f7fa',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8',
                    marginTop: '16px'
                  }}>
                    <Text type="secondary" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                      <strong>Response Time:</strong> We typically respond within 24-48 hours during business days. 
                      For urgent matters, please call us directly at <strong>(075) 522-1234</strong>.
                    </Text>
                  </div>
                </Form>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              style={{
                borderRadius: '12px',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: 'linear-gradient(135deg, #003a70 0%, #0050b3 100%)',
                color: '#fff'
              }}
              styles={{
                body: { padding: '32px' }
              }}
            >
              <Title level={4} style={{ marginBottom: '24px', color: '#fff' }}>
                Important Credentials
              </Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Government Entity
                  </Text>
                  <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginTop: '4px' }}>
                    City Government of Dagupan
                  </Text>
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Department
                  </Text>
                  <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginTop: '4px' }}>
                    Business Permit & Licensing Office (BPLO)
                  </Text>
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Official Portal
                  </Text>
                  <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginTop: '4px' }}>
                    BizClear Portal
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                    Secure • Verified • Official
                  </Text>
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Service Hours
                  </Text>
                  <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block', marginTop: '4px' }}>
                    Monday - Friday: 8:00 AM - 5:00 PM
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginTop: '4px' }}>
                    Closed on weekends and public holidays
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Quick Help Note */}
        <div style={{
          marginTop: '40px',
          padding: '24px',
          background: '#e6f7ff',
          borderRadius: '12px',
          border: '1px solid #91d5ff',
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: '15px', color: '#0050b3' }}>
            <strong>Need immediate assistance?</strong> For urgent matters, please call our hotline at{' '}
            <strong style={{ color: '#003a70' }}>(075) 522-1234</strong> or visit our office during business hours.
          </Text>
        </div>
      </div>
    </div>
  )
}
