import { useState } from 'react'
import { 
  Card, Input, List, Button, Space, Typography, Tag, 
  Modal, Tabs, Steps, Divider, Badge,
  Collapse, Row, Col, Progress, Avatar, Empty
} from 'antd'
import { 
  SearchOutlined, BookOutlined,
  VideoCameraOutlined,
  CheckOutlined, PlayCircleOutlined, StarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Step } = Steps
const { Panel } = Collapse

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [tutorialVisible, setTutorialVisible] = useState(false)
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [feedback, setFeedback] = useState('')
  const navigate = useNavigate()

  // Comprehensive help database
  const helpDatabase = {
    gettingStarted: [
      {
        id: 'gs-001',
        title: 'Creating Your Account',
        category: 'getting-started',
        difficulty: 'beginner',
        readTime: '3 min',
        content: `
          <h3>Creating Your Account</h3>
          <p>Getting started with BizClear is simple. Follow these steps to create your account:</p>
          <ol>
            <li>Visit the BizClear registration page</li>
            <li>Fill in your personal information</li>
            <li>Verify your email address</li>
            <li>Set up your business profile</li>
            <li>Complete the onboarding process</li>
          </ol>
          <p><strong>Tip:</strong> Use a professional email address for business registration.</p>
        `,
        related: ['gs-002', 'gs-003'],
        tags: ['account', 'registration', 'onboarding'],
        rating: 4.8,
        views: 1250
      },
      {
        id: 'gs-002',
        title: 'Business Registration Process',
        category: 'getting-started',
        difficulty: 'beginner',
        readTime: '5 min',
        content: `
          <h3>Business Registration Process</h3>
          <p>Register your business with BizClear in just a few steps:</p>
          <ol>
            <li>Log in to your account</li>
            <li>Click "Add Business" from your dashboard</li>
            <li>Fill in business details (name, type, address)</li>
            <li>Upload required documents</li>
            <li>Submit for review</li>
            <li>Wait for LGU approval</li>
          </ol>
          <p><strong>Required Documents:</strong> Business permit, ID proof, address verification.</p>
        `,
        related: ['gs-001', 'bs-001'],
        tags: ['business', 'registration', 'documents'],
        rating: 4.6,
        views: 980
      },
      {
        id: 'gs-003',
        title: 'Dashboard Overview',
        category: 'getting-started',
        difficulty: 'beginner',
        readTime: '4 min',
        content: `
          <h3>Understanding Your Dashboard</h3>
          <p>Your BizClear dashboard provides a comprehensive view of your business activities:</p>
          <ul>
            <li><strong>Business List:</strong> View all your registered businesses</li>
            <li><strong>Status Indicators:</strong> Track application progress</li>
            <li><strong>Quick Actions:</strong> Add new business or manage existing ones</li>
            <li><strong>Notifications:</strong> Stay updated on important changes</li>
            <li><strong>Analytics:</strong> Monitor business performance</li>
          </ul>
        `,
        related: ['gs-001', 'gs-002'],
        tags: ['dashboard', 'navigation', 'overview'],
        rating: 4.7,
        views: 1100
      }
    ],
    businessManagement: [
      {
        id: 'bm-001',
        title: 'Managing Multiple Businesses',
        category: 'business-management',
        difficulty: 'intermediate',
        readTime: '6 min',
        content: `
          <h3>Managing Multiple Businesses</h3>
          <p>BizClear allows you to manage multiple businesses efficiently:</p>
          <ol>
            <li>View all businesses in your dashboard</li>
            <li>Use filters to find specific businesses</li>
            <li>Set primary business for quick access</li>
            <li>Track each business's status separately</li>
            <li>Manage documents per business</li>
          </ol>
          <p><strong>Pro Tip:</strong> Use the search feature to quickly locate businesses.</p>
        `,
        related: ['bm-002', 'gs-002'],
        tags: ['multiple', 'organization', 'management'],
        rating: 4.5,
        views: 750
      },
      {
        id: 'bm-002',
        title: 'Document Management',
        category: 'business-management',
        difficulty: 'intermediate',
        readTime: '5 min',
        content: `
          <h3>Managing Business Documents</h3>
          <p>Keep your business documents organized and up-to-date:</p>
          <ul>
            <li>Upload required documents during registration</li>
            <li>Update expired documents promptly</li>
            <li>Use the document tracker for renewal reminders</li>
            <li>Download copies for your records</li>
            <li>Share documents with LGU officers when needed</li>
          </ul>
        `,
        related: ['bm-001', 'pm-001'],
        tags: ['documents', 'uploads', 'organization'],
        rating: 4.4,
        views: 620
      }
    ],
    payments: [
      {
        id: 'pm-001',
        title: 'Payment Methods and Processing',
        category: 'payments',
        difficulty: 'intermediate',
        readTime: '7 min',
        content: `
          <h3>Payment Methods and Processing</h3>
          <p>BizClear supports multiple payment methods for your convenience:</p>
          <h4>Available Payment Methods:</h4>
          <ul>
            <li>Credit/Debit Cards</li>
            <li>Bank Transfers</li>
            <li>Digital Wallets (GCash, PayMaya)</li>
            <li>Over-the-counter payments</li>
          </ul>
          <h4>Payment Process:</h4>
          <ol>
            <li>Select payment method</li>
            <li>Enter payment details</li>
            <li>Confirm payment amount</li>
            <li>Receive payment confirmation</li>
            <li>Download receipt</li>
          </ol>
        `,
        related: ['pm-002', 'bm-002'],
        tags: ['payment', 'methods', 'processing'],
        rating: 4.3,
        views: 890
      },
      {
        id: 'pm-002',
        title: 'Understanding Fees and Charges',
        category: 'payments',
        difficulty: 'intermediate',
        readTime: '6 min',
        content: `
          <h3>Understanding Fees and Charges</h3>
          <p>BizClear fees vary based on business type and requirements:</p>
          <h4>Fee Components:</h4>
          <ul>
            <li><strong>Base Fee:</strong> Standard registration fee</li>
            <li><strong>Processing Fee:</strong> Administrative charges</li>
            <li><strong>Inspection Fee:</strong> For on-site inspections</li>
            <li><strong>Penalty Fees:</strong> For late renewals</li>
          </ul>
          <p><strong>Note:</strong> Fees are calculated automatically based on your business profile.</p>
        `,
        related: ['pm-001', 'gs-002'],
        tags: ['fees', 'charges', 'calculation'],
        rating: 4.2,
        views: 720
      }
    ],
    troubleshooting: [
      {
        id: 'ts-001',
        title: 'Common Login Issues',
        category: 'troubleshooting',
        difficulty: 'beginner',
        readTime: '4 min',
        content: `
          <h3>Resolving Common Login Issues</h3>
          <p>Having trouble logging in? Try these solutions:</p>
          <h4>Forgot Password:</h4>
          <ol>
            <li>Click "Forgot Password" on login page</li>
            <li>Enter your registered email</li>
            <li>Check email for reset link</li>
            <li>Create new password</li>
            <li>Log in with new password</li>
          </ol>
          <h4>Account Locked:</h4>
          <p>Contact support for account recovery after multiple failed attempts.</p>
        `,
        related: ['ts-002', 'gs-001'],
        tags: ['login', 'password', 'account'],
        rating: 4.6,
        views: 540
      },
      {
        id: 'ts-002',
        title: 'Document Upload Problems',
        category: 'troubleshooting',
        difficulty: 'intermediate',
        readTime: '5 min',
        content: `
          <h3>Fixing Document Upload Issues</h3>
          <p>Common document upload problems and solutions:</p>
          <h4>File Not Uploading:</h4>
          <ul>
            <li>Check file size (max 10MB)</li>
            <li>Ensure correct file format (PDF, JPG, PNG)</li>
            <li>Verify stable internet connection</li>
            <li>Clear browser cache and retry</li>
          </ul>
          <h4>Document Rejected:</h4>
          <ul>
            <li>Check for required information</li>
            <li>Ensure document clarity and readability</li>
            <li>Verify document expiration date</li>
            <li>Re-upload corrected document</li>
          </ul>
        `,
        related: ['ts-001', 'bm-002'],
        tags: ['upload', 'documents', 'errors'],
        rating: 4.4,
        views: 380
      }
    ]
  }

  const videoTutorials = [
    {
      id: 'vid-001',
      title: 'Complete Business Registration',
      duration: '8:45',
      thumbnail: '/images/videos/business-reg-thumb.jpg',
      url: '/videos/business-registration',
      category: 'getting-started',
      difficulty: 'beginner',
      views: 2340,
      rating: 4.9
    },
    {
      id: 'vid-002',
      title: 'Payment Process Guide',
      duration: '5:30',
      thumbnail: '/images/videos/payment-thumb.jpg',
      url: '/videos/payment-process',
      category: 'payments',
      difficulty: 'intermediate',
      views: 1560,
      rating: 4.7
    },
    {
      id: 'vid-003',
      title: 'Document Management Tips',
      duration: '6:15',
      thumbnail: '/images/videos/documents-thumb.jpg',
      url: '/videos/document-management',
      category: 'business-management',
      difficulty: 'intermediate',
      views: 1890,
      rating: 4.6
    }
  ]

  const interactiveTutorials = [
    {
      id: 'tut-001',
      title: 'First Business Registration',
      steps: [
        {
          title: 'Navigate to Dashboard',
          content: 'From your main dashboard, click the "Add Business" button in the top right corner.',
          action: 'navigate',
          target: '.add-business-btn'
        },
        {
          title: 'Fill Business Information',
          content: 'Enter your business name, type, and address in the provided fields.',
          action: 'fill',
          target: '.business-form'
        },
        {
          title: 'Upload Documents',
          content: 'Upload the required documents for your business registration.',
          action: 'upload',
          target: '.document-upload'
        },
        {
          title: 'Submit Application',
          content: 'Review your information and submit the application for review.',
          action: 'submit',
          target: '.submit-btn'
        }
      ]
    },
    {
      id: 'tut-002',
      title: 'Making Your First Payment',
      steps: [
        {
          title: 'Select Payment Method',
          content: 'Choose your preferred payment method from the available options.',
          action: 'select',
          target: '.payment-methods'
        },
        {
          title: 'Enter Payment Details',
          content: 'Fill in your payment information securely.',
          action: 'fill',
          target: '.payment-details'
        },
        {
          title: 'Confirm Payment',
          content: 'Review and confirm your payment details.',
          action: 'confirm',
          target: '.confirm-payment'
        }
      ]
    }
  ]

  const categories = [
    { key: 'all', label: 'All Topics', icon: <BookOutlined /> },
    { key: 'getting-started', label: 'Getting Started', icon: <RocketOutlined /> },
    { key: 'business-management', label: 'Business Management', icon: <ShopOutlined /> },
    { key: 'payments', label: 'Payments', icon: <CreditCardOutlined /> },
    { key: 'troubleshooting', label: 'Troubleshooting', icon: <ToolOutlined /> }
  ]

  const filteredArticles = Object.values(helpDatabase)
    .flat()
    .filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
      return matchesSearch && matchesCategory
    })

  const handleArticleClick = (article) => {
    setSelectedArticle(article)
  }

  const handleVideoClick = (video) => {
    setSelectedVideo(video)
    setVideoModalVisible(true)
  }

  const startTutorial = (tutorial) => {
    setCurrentTutorialStep(0)
    setTutorialVisible(true)
  }

  const nextTutorialStep = () => {
    const currentTutorial = interactiveTutorials[0] // Simplified for demo
    if (currentTutorialStep < currentTutorial.steps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1)
    } else {
      setTutorialVisible(false)
    }
  }

  const prevTutorialStep = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(currentTutorialStep - 1)
    }
  }

  const renderHelpContent = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={8}>
        <Card title="Categories" size="small">
          <List
            dataSource={categories}
            renderItem={(category) => (
              <List.Item
                className={`category-item ${selectedCategory === category.key ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(category.key)}
                style={{ cursor: 'pointer', padding: '8px 0' }}
              >
                <Space>
                  {category.icon}
                  <Text>{category.label}</Text>
                  {selectedCategory === category.key && <CheckOutlined style={{ color: '#52c41a' }} />}
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Card title="Quick Actions" size="small" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block icon={<VideoCameraOutlined />} onClick={() => navigate('/help/videos')}>
              Video Tutorials
            </Button>
            <Button block icon={<PlayCircleOutlined />} onClick={() => setTutorialVisible(true)}>
              Interactive Guide
            </Button>
            <Button block icon={<MessageOutlined />} onClick={() => navigate('/help/contact')}>
              Contact Support
            </Button>
          </Space>
        </Card>

        <Card title="Popular Articles" size="small" style={{ marginTop: 16 }}>
          <List
            dataSource={Object.values(helpDatabase).flat().slice(0, 5)}
            renderItem={(article) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => handleArticleClick(article)}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '12px' }}>{article.title}</Text>
                  <Space>
                    <Tag size="small">{article.difficulty}</Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{article.readTime}</Text>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} md={16}>
        <Card title="Help Articles">
          <Search
            placeholder="Search help articles..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          {filteredArticles.length === 0 ? (
            <Empty description="No articles found" />
          ) : (
            <List
              dataSource={filteredArticles}
              renderItem={(article) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '16px 0' }}
                  onClick={() => handleArticleClick(article)}
                  actions={[
                    <Space>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <Text>{article.rating}</Text>
                    </Space>,
                    <Text type="secondary">{article.views} views</Text>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} />}
                    title={
                      <Space>
                        <Text strong>{article.title}</Text>
                        <Tag color={article.difficulty === 'beginner' ? 'green' : article.difficulty === 'intermediate' ? 'orange' : 'red'}>
                          {article.difficulty}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space wrap>
                        {article.tags.map(tag => (
                          <Tag key={tag} size="small">{tag}</Tag>
                        ))}
                        <Text type="secondary">• {article.readTime} read</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Col>
    </Row>
  )

  const renderArticleModal = () => {
    if (!selectedArticle) return null

    return (
      <Modal
        title={selectedArticle.title}
        open={!!selectedArticle}
        onCancel={() => setSelectedArticle(null)}
        width={800}
        footer={[
          <Button key="feedback" onClick={() => setFeedbackVisible(true)}>
            Provide Feedback
          </Button>,
          <Button key="close" onClick={() => setSelectedArticle(null)}>
            Close
          </Button>
        ]}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Tag color={selectedArticle.difficulty === 'beginner' ? 'green' : selectedArticle.difficulty === 'intermediate' ? 'orange' : 'red'}>
                {selectedArticle.difficulty}
              </Tag>
              <Text type="secondary">{selectedArticle.readTime} read</Text>
              <Text type="secondary">• {selectedArticle.views} views</Text>
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                <Text>{selectedArticle.rating}</Text>
              </Space>
            </Space>
            
            <Divider />
            
            <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
            
            <Divider />
            
            <Space wrap>
              {selectedArticle.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
            
            {selectedArticle.related.length > 0 && (
              <div>
                <Text strong>Related Articles:</Text>
                <div style={{ marginTop: 8 }}>
                  {selectedArticle.related.map(relatedId => {
                    const relatedArticle = Object.values(helpDatabase).flat().find(a => a.id === relatedId)
                    return relatedArticle ? (
                      <Button
                        key={relatedId}
                        type="link"
                        onClick={() => handleArticleClick(relatedArticle)}
                      >
                        {relatedArticle.title}
                      </Button>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </Space>
        </div>
      </Modal>
    )
  }

  const renderVideoModal = () => {
    if (!selectedVideo) return null

    return (
      <Modal
        title={selectedVideo.title}
        open={videoModalVisible}
        onCancel={() => setVideoModalVisible(false)}
        width={800}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ backgroundColor: '#000', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayCircleOutlined style={{ fontSize: '64px', color: '#fff' }} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Text>{selectedVideo.duration}</Text>
              <Text>•</Text>
              <Text>{selectedVideo.views} views</Text>
              <Text>•</Text>
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                <Text>{selectedVideo.rating}</Text>
              </Space>
            </Space>
          </div>
        </div>
      </Modal>
    )
  }

  const renderTutorialModal = () => {
    const currentTutorial = interactiveTutorials[0] // Simplified for demo
    const currentStep = currentTutorial.steps[currentTutorialStep]

    return (
      <Modal
        title="Interactive Tutorial"
        open={tutorialVisible}
        onCancel={() => setTutorialVisible(false)}
        width={600}
        footer={[
          <Button key="prev" onClick={prevTutorialStep} disabled={currentTutorialStep === 0}>
            Previous
          </Button>,
          <Button key="next" type="primary" onClick={nextTutorialStep}>
            {currentTutorialStep === currentTutorial.steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <Steps current={currentTutorialStep} size="small" style={{ marginBottom: 24 }}>
            {currentTutorial.steps.map((step, index) => (
              <Step key={index} title={step.title} />
            ))}
          </Steps>
          
          <div style={{ padding: '24px 0' }}>
            <Title level={4}>{currentStep.title}</Title>
            <Paragraph>{currentStep.content}</Paragraph>
          </div>
          
          <Progress
            percent={((currentTutorialStep + 1) / currentTutorial.steps.length) * 100}
            size="small"
            status="active"
          />
        </div>
      </Modal>
    )
  }

  const renderFeedbackModal = () => (
    <Modal
      title="Article Feedback"
      open={feedbackVisible}
      onCancel={() => setFeedbackVisible(false)}
      onOk={() => {
        // Handle feedback submission
        setFeedbackVisible(false)
        setFeedback('')
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>How helpful was this article?</Text>
        <Rate />
        <Input.TextArea
          placeholder="Additional comments (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
      </Space>
    </Modal>
  )

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Help Center</Title>
          <Text type="secondary">Find answers to your questions and learn how to use BizClear</Text>
        </Col>
        <Col>
          <Space>
            <Badge count={3}>
              <Button icon={<MessageOutlined />}>Contact Support</Button>
            </Badge>
          </Space>
        </Col>
      </Row>

      <Tabs defaultActiveKey="articles">
        <TabPane tab="Help Articles" key="articles">
          {renderHelpContent()}
        </TabPane>
        <TabPane tab="Video Tutorials" key="videos">
          <Row gutter={[16, 16]}>
            {videoTutorials.map((video) => (
              <Col xs={24} sm={12} md={8} key={video.id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: '120px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlayCircleOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </div>
                  }
                  onClick={() => handleVideoClick(video)}
                >
                  <Card.Meta
                    title={video.title}
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{video.duration}</Text>
                        <Space>
                          <StarOutlined style={{ color: '#faad14' }} />
                          <Text>{video.rating}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        <TabPane tab="Interactive Guides" key="tutorials">
          <Row gutter={[16, 16]}>
            {interactiveTutorials.map((tutorial) => (
              <Col xs={24} md={12} key={tutorial.id}>
                <Card
                  title={tutorial.title}
                  extra={
                    <Button type="primary" onClick={() => startTutorial(tutorial)}>
                      Start Tutorial
                    </Button>
                  }
                >
                  <Steps size="small" current={-1}>
                    {tutorial.steps.map((step, index) => (
                      <Step key={index} title={step.title} />
                    ))}
                  </Steps>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>

      {renderArticleModal()}
      {renderVideoModal()}
      {renderTutorialModal()}
      {renderFeedbackModal()}
    </div>
  )
}

export default HelpCenter
