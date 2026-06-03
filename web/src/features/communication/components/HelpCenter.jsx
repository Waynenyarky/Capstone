import { useState, useEffect } from 'react'
import { 
  Card, Input, Button, List, Typography, Space, Tabs, 
  Select, Tag, Divider, Alert, Collapse, Modal, Form,
  message, Row, Col, Avatar
} from 'antd'
import { 
  SearchOutlined, QuestionCircleOutlined, BookOutlined,
  VideoCameraOutlined, FileTextOutlined, MessageOutlined,
  StarOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { Panel } = Collapse

function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const [faqs, setFaqs] = useState([
    {
      id: '1',
      category: 'Business Registration',
      question: 'How do I register a new business?',
      answer: 'To register a new business, follow these steps: 1) Log in to your account, 2) Click "Add Business" from your dashboard, 3) Fill out the application form with accurate information, 4) Upload required documents, 5) Submit the application for review.',
      helpful: 45,
      views: 1234,
      tags: ['registration', 'new business', 'application'],
      lastUpdated: '2024-01-10'
    },
    {
      id: '2',
      category: 'Permits',
      question: 'What documents are required for business permit renewal?',
      answer: 'For business permit renewal, you need: 1) Updated business permit application form, 2) Previous year\'s tax clearance, 3) Barangay clearance, 4) Fire safety inspection certificate, 5) Updated business address proof.',
      helpful: 38,
      views: 892,
      tags: ['renewal', 'permits', 'documents'],
      lastUpdated: '2024-01-12'
    },
    {
      id: '3',
      category: 'Payments',
      question: 'How can I pay my business taxes online?',
      answer: 'You can pay online through: 1) Login to your dashboard, 2) Go to Payments section, 3) Select the tax you want to pay, 4) Choose your payment method (credit card, bank transfer, or e-wallet), 5) Complete the payment process.',
      helpful: 52,
      views: 1567,
      tags: ['payment', 'taxes', 'online'],
      lastUpdated: '2024-01-08'
    },
    {
      id: '4',
      category: 'Inspections',
      question: 'How do I schedule a business inspection?',
      answer: 'To schedule an inspection: 1) Go to Compliance section, 2) Click "Request Inspection", 3) Select inspection type, 4) Choose preferred date and time, 5) Submit request and wait for confirmation.',
      helpful: 29,
      views: 645,
      tags: ['inspection', 'schedule', 'compliance'],
      lastUpdated: '2024-01-11'
    },
    {
      id: '5',
      category: 'Technical Support',
      question: 'I forgot my password. How do I reset it?',
      answer: 'To reset your password: 1) Click "Forgot Password" on login page, 2) Enter your registered email, 3) Check your email for reset link, 4) Click the link and create new password, 5) Login with your new password.',
      helpful: 67,
      views: 2341,
      tags: ['password', 'login', 'account'],
      lastUpdated: '2024-01-05'
    }
  ])

  const [tutorials, setTutorials] = useState([
    {
      id: '1',
      title: 'Complete Business Registration Guide',
      description: 'Step-by-step video tutorial on how to register your business from start to finish.',
      type: 'video',
      duration: '15:30',
      category: 'Getting Started',
      thumbnail: 'https://via.placeholder.com/300x200/1890ff/ffffff?text=Business+Registration',
      views: 3421,
      rating: 4.8,
      tags: ['registration', 'tutorial', 'beginner']
    },
    {
      id: '2',
      title: 'Understanding Business Permits',
      description: 'Comprehensive guide to different types of business permits and their requirements.',
      type: 'document',
      pages: 24,
      category: 'Permits',
      thumbnail: 'https://via.placeholder.com/300x200/52c41a/ffffff?text=Permits+Guide',
      views: 2156,
      rating: 4.6,
      tags: ['permits', 'guide', 'documentation']
    },
    {
      id: '3',
      title: 'Tax Payment Process',
      description: 'Learn how to calculate and pay your business taxes correctly and on time.',
      type: 'video',
      duration: '12:45',
      category: 'Payments',
      thumbnail: 'https://via.placeholder.com/300x200/fa8c16/ffffff?text=Tax+Payments',
      views: 1876,
      rating: 4.7,
      tags: ['taxes', 'payment', 'tutorial']
    }
  ])

  const [categories] = useState([
    { value: 'all', label: 'All Categories', icon: <BookOutlined /> },
    { value: 'Business Registration', label: 'Business Registration', icon: <FileTextOutlined /> },
    { value: 'Permits', label: 'Permits', icon: <FileTextOutlined /> },
    { value: 'Payments', label: 'Payments', icon: <FileTextOutlined /> },
    { value: 'Inspections', label: 'Inspections', icon: <FileTextOutlined /> },
    { value: 'Technical Support', label: 'Technical Support', icon: <MessageOutlined /> }
  ])

  useEffect(() => {
    // Simulate loading data
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = searchTerm === '' || 
      tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  const handleMarkHelpful = (faqId, helpful) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === faqId 
        ? { ...faq, helpful: helpful ? faq.helpful + 1 : faq.helpful }
        : faq
    ))
    message.success('Thank you for your feedback!')
  }

  const handleSubmitSupport = async (values) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShowSupportModal(false)
      form.resetFields()
      message.success('Support request submitted successfully. We\'ll respond within 24 hours.')
    } catch (error) {
      message.error('Failed to submit support request')
    }
  }

  const popularTopics = [
    { name: 'Business Registration', count: 45 },
    { name: 'Permit Renewal', count: 38 },
    { name: 'Tax Payments', count: 52 },
    { name: 'Inspection Scheduling', count: 29 },
    { name: 'Account Issues', count: 67 }
  ]

  const recentActivity = [
    { action: 'Viewed "Business Registration FAQ"', time: '2 hours ago' },
    { action: 'Watched "Tax Payment Tutorial"', time: '5 hours ago' },
    { action: 'Submitted support request', time: '1 day ago' },
    { action: 'Downloaded "Permits Guide"', time: '2 days ago' }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Help Center</Title>
        <Text type="secondary">Find answers, tutorials, and get support</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Main Content */}
        <Col xs={24} lg={18}>
          <Tabs defaultActiveKey="faq">
            <Tabs.TabPane 
              tab={
                <span>
                  <QuestionCircleOutlined />
                  FAQs
                </span>
              } 
              key="faq"
            >
              <Card>
                <div style={{ marginBottom: 24 }}>
                  <Space size="large" style={{ width: '100%' }}>
                    <Input
                      placeholder="Search FAQs..."
                      prefix={<SearchOutlined />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ flex: 1 }}
                      size="large"
                    />
                    <Select
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      style={{ width: 200 }}
                      size="large"
                    >
                      {categories.map(cat => (
                        <Option key={cat.value} value={cat.value}>
                          {cat.label}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <div>Loading...</div>
                  </div>
                ) : (
                  <List
                    dataSource={filteredFaqs}
                    renderItem={(faq) => (
                      <List.Item
                        style={{
                          padding: '16px 0',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedArticle(faq)}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<QuestionCircleOutlined />} />}
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <Text strong>{faq.question}</Text>
                                <div style={{ marginTop: 4 }}>
                                  <Tag color="blue">{faq.category}</Tag>
                                  {faq.tags.map((tag, index) => (
                                    <Tag key={index} style={{ marginLeft: 4 }}>{tag}</Tag>
                                  ))}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', marginLeft: 16 }}>
                                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                  <div>{faq.views} views</div>
                                  <div>{faq.helpful} helpful</div>
                                </div>
                              </div>
                            </div>
                          }
                          description={
                            <Text type="secondary" ellipsis>
                              {faq.answer}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane 
              tab={
                <span>
                  <VideoCameraOutlined />
                  Tutorials
                </span>
              } 
              key="tutorials"
            >
              <Row gutter={[16, 16]}>
                {filteredTutorials.map((tutorial) => (
                  <Col xs={24} sm={12} lg={8} key={tutorial.id}>
                    <Card
                      hoverable
                      cover={
                        <div style={{ 
                          height: 200, 
                          background: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src={tutorial.thumbnail} 
                            alt={tutorial.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {tutorial.type === 'video' && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              background: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              borderRadius: '50%',
                              width: 48,
                              height: 48,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <VideoCameraOutlined />
                            </div>
                          )}
                        </div>
                      }
                      actions={[
                        <span><StarOutlined /> {tutorial.rating}</span>,
                        <span><ClockCircleOutlined /> {tutorial.duration || `${tutorial.pages} pages`}</span>,
                        <span>{tutorial.views} views</span>
                      ]}
                    >
                      <Card.Meta
                        title={<Text strong style={{ fontSize: 14 }}>{tutorial.title}</Text>}
                        description={
                          <div>
                            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                              {tutorial.description}
                            </Text>
                            <div style={{ marginTop: 8 }}>
                              <Tag color="green">{tutorial.category}</Tag>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane 
              tab={
                <span>
                  <MessageOutlined />
                  Contact Support
                </span>
              } 
              key="support"
            >
              <Card>
                <Alert
                  message="Need additional help?"
                  description="Our support team is available 24/7 to assist you with any questions or issues."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Quick Support Options">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button type="primary" icon={<MessageOutlined />} block>
                          Start Live Chat
                        </Button>
                        <Button icon={<VideoCameraOutlined />} block>
                          Schedule Video Call
                        </Button>
                        <Button icon={<FileTextOutlined />} block>
                          Submit Ticket
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Contact Information">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text strong>Phone:</Text>
                          <div>+63 (2) 1234-5678</div>
                        </div>
                        <div>
                          <Text strong>Email:</Text>
                          <div>support@bizclear.gov.ph</div>
                        </div>
                        <div>
                          <Text strong>Office Hours:</Text>
                          <div>Monday - Friday: 8:00 AM - 6:00 PM</div>
                          <div>Saturday: 9:00 AM - 3:00 PM</div>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <Divider />

                <div>
                  <Title level={4}>Frequently Asked Questions</Title>
                  <Collapse>
                    {faqs.slice(0, 3).map((faq) => (
                      <Panel header={faq.question} key={faq.id}>
                        <Paragraph>{faq.answer}</Paragraph>
                        <Space>
                          <Button 
                            size="small" 
                            onClick={() => handleMarkHelpful(faq.id, true)}
                          >
                            Helpful ({faq.helpful})
                          </Button>
                          <Button 
                            size="small" 
                            onClick={() => handleMarkHelpful(faq.id, false)}
                          >
                            Not Helpful
                          </Button>
                        </Space>
                      </Panel>
                    ))}
                  </Collapse>
                </div>
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={6}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Popular Topics */}
            <Card title="Popular Topics" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {popularTopics.map((topic, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                    onClick={() => {
                      setSearchTerm(topic.name)
                      setSelectedCategory('all')
                    }}
                  >
                    <Text>{topic.name}</Text>
                    <Tag>{topic.count}</Tag>
                  </div>
                ))}
              </Space>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  icon={<MessageOutlined />} 
                  block
                  onClick={() => setShowSupportModal(true)}
                >
                  Get Help
                </Button>
                <Button icon={<FileTextOutlined />} block>
                  Download User Guide
                </Button>
                <Button icon={<VideoCameraOutlined />} block>
                  Watch Video Tutorials
                </Button>
              </Space>
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Activity" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {recentActivity.map((activity, index) => (
                  <div key={index}>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{activity.time}</div>
                    <div style={{ fontSize: 13 }}>{activity.action}</div>
                    {index < recentActivity.length - 1 && <Divider style={{ margin: '8px 0' }} />}
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Article Detail Modal */}
      <Modal
        title={selectedArticle?.question}
        open={!!selectedArticle}
        onCancel={() => setSelectedArticle(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedArticle(null)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedArticle && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">{selectedArticle.category}</Tag>
              {selectedArticle.tags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
            </Space>
            
            <Paragraph style={{ fontSize: 16, lineHeight: 1.6 }}>
              {selectedArticle.answer}
            </Paragraph>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Text type="secondary">
                  {selectedArticle.views} views • {selectedArticle.helpful} found this helpful
                </Text>
              </Space>
              <Space>
                <Button 
                  size="small" 
                  onClick={() => handleMarkHelpful(selectedArticle.id, true)}
                >
                  Helpful
                </Button>
                <Button 
                  size="small" 
                  onClick={() => handleMarkHelpful(selectedArticle.id, false)}
                >
                  Not Helpful
                </Button>
              </Space>
            </div>
            
            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <Text type="secondary">
                Last updated: {dayjs(selectedArticle.lastUpdated).format('MMMM D, YYYY')}
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Support Request Modal */}
      <Modal
        title="Submit Support Request"
        open={showSupportModal}
        onCancel={() => setShowSupportModal(false)}
        onOk={() => form.submit()}
        okText="Submit Request"
      >
        <Form form={form} onFinish={handleSubmitSupport} layout="vertical">
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="Brief description of your issue" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select issue category">
              <Option value="technical">Technical Issue</Option>
              <Option value="account">Account Problem</Option>
              <Option value="payment">Payment Issue</Option>
              <Option value="permit">Permit Question</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority level' }]}
          >
            <Select placeholder="Select priority">
              <Option value="low">Low - General question</Option>
              <Option value="medium">Medium - Need assistance</Option>
              <Option value="high">High - Urgent issue</Option>
              <Option value="critical">Critical - System down</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please describe your issue' }]}
          >
            <TextArea rows={4} placeholder="Please provide detailed information about your issue..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default HelpCenter
