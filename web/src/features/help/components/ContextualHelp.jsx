import React, { useState, useRef, useEffect } from 'react'
import { Tooltip, Button, Modal, Card, Typography, Space, Tag } from 'antd'
import { QuestionCircleOutlined, BookOutlined, VideoCameraOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

/**
 * Contextual Help Component
 * Provides contextual help tooltips and quick access to relevant help content
 */

const ContextualHelp = ({ 
  helpKey, 
  type = 'tooltip', 
  title, 
  content, 
  relatedArticles = [],
  videoId = null,
  placement = 'top'
}) => {
  const [visible, setVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  // Help content database
  const helpContent = {
    'business-registration': {
      title: 'Business Registration',
      content: 'Register your business with BizClear by providing basic information and required documents. The process typically takes 3-5 business days for LGU approval.',
      relatedArticles: ['gs-002', 'bm-001'],
      videoId: 'vid-001'
    },
    'payment-methods': {
      title: 'Payment Methods',
      content: 'Choose from multiple payment options including credit cards, bank transfers, and digital wallets. Payments are processed securely with instant confirmation.',
      relatedArticles: ['pm-001', 'pm-002'],
      videoId: 'vid-002'
    },
    'document-upload': {
      title: 'Document Upload',
      content: 'Upload required business documents in PDF, JPG, or PNG format. Maximum file size is 10MB. Ensure documents are clear and readable.',
      relatedArticles: ['bm-002', 'ts-002'],
      videoId: 'vid-003'
    },
    'dashboard-navigation': {
      title: 'Dashboard Navigation',
      content: 'Your dashboard shows all registered businesses, their status, and quick actions. Use the search and filter features to find specific businesses.',
      relatedArticles: ['gs-003', 'bm-001'],
      videoId: 'vid-001'
    },
    'application-status': {
      title: 'Application Status',
      content: 'Track your application status: Draft → Submitted → Under Review → Approved/Rejected. You\'ll receive notifications for status changes.',
      relatedArticles: ['gs-002', 'ts-001'],
      videoId: 'vid-001'
    },
    'fee-calculation': {
      title: 'Fee Calculation',
      content: 'Fees are calculated based on business type, size, and location. Use the fee calculator to estimate costs before registration.',
      relatedArticles: ['pm-002', 'gs-002'],
      videoId: 'vid-002'
    },
    'renewal-process': {
      title: 'Business Renewal',
      content: 'Renew your business permit before expiration. You\'ll receive reminders 30 days before expiry. The renewal process is similar to initial registration.',
      relatedArticles: ['bm-001', 'pm-001'],
      videoId: 'vid-003'
    },
    'account-settings': {
      title: 'Account Settings',
      content: 'Manage your profile information, notification preferences, and security settings. Keep your contact information up-to-date for important notifications.',
      relatedArticles: ['gs-001', 'ts-001'],
      videoId: 'vid-001'
    }
  }

  const currentHelp = helpContent[helpKey] || { title, content, relatedArticles, videoId }

  const handleHelpClick = () => {
    if (type === 'modal') {
      setModalVisible(true)
    } else {
      // For tooltip type, show extended help
      setModalVisible(true)
    }
  }

  const renderTooltipContent = () => (
    <div style={{ maxWidth: '300px' }}>
      <Text strong>{currentHelp.title}</Text>
      <Paragraph style={{ margin: '8px 0', fontSize: '12px' }}>
        {currentHelp.content}
      </Paragraph>
      <Button type="link" size="small" onClick={handleHelpClick}>
        Learn more
      </Button>
    </div>
  )

  const renderModalContent = () => (
    <Modal
      title={
        <Space>
          <BookOutlined />
          {currentHelp.title}
        </Space>
      }
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setModalVisible(false)}>
          Close
        </Button>
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Paragraph>{currentHelp.content}</Paragraph>
        
        {currentHelp.relatedArticles && currentHelp.relatedArticles.length > 0 && (
          <Card size="small" title="Related Articles">
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentHelp.relatedArticles.map(articleId => (
                <Button key={articleId} type="link" style={{ padding: 0 }}>
                  {getArticleTitle(articleId)}
                </Button>
              ))}
            </Space>
          </Card>
        )}
        
        {currentHelp.videoId && (
          <Card size="small" title="Video Tutorial">
            <Space>
              <VideoCameraOutlined />
              <Button type="link" style={{ padding: 0 }}>
                Watch Video Tutorial
              </Button>
              <Tag color="blue">5-10 min</Tag>
            </Space>
          </Card>
        )}
        
        <Card size="small" title="Need More Help?">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="link" icon={<BookOutlined />} style={{ padding: 0 }}>
              Browse Help Center
            </Button>
            <Button type="link" style={{ padding: 0 }}>
              Contact Support
            </Button>
          </Space>
          </Card>
        </Space>
    </Modal>
  )

  const getArticleTitle = (articleId) => {
    const articleTitles = {
      'gs-001': 'Creating Your Account',
      'gs-002': 'Business Registration Process',
      'gs-003': 'Dashboard Overview',
      'bm-001': 'Managing Multiple Businesses',
      'bm-002': 'Document Management',
      'pm-001': 'Payment Methods and Processing',
      'pm-002': 'Understanding Fees and Charges',
      'ts-001': 'Common Login Issues',
      'ts-002': 'Document Upload Problems',
      'vid-001': 'Complete Business Registration',
      'vid-002': 'Payment Process Guide',
      'vid-003': 'Document Management Tips'
    }
    return articleTitles[articleId] || articleId
  }

  if (type === 'button') {
    return (
      <>
        <Button
          type="text"
          icon={<QuestionCircleOutlined />}
          onClick={handleHelpClick}
          style={{ padding: '0 4px' }}
        />
        {renderModalContent()}
      </>
    )
  }

  if (type === 'modal') {
    return (
      <>
        <Button
          type="link"
          icon={<QuestionCircleOutlined />}
          onClick={handleHelpClick}
        >
          Help
        </Button>
        {renderModalContent()}
      </>
    )
  }

  // Default tooltip type
  return (
    <>
      <Tooltip
        title={renderTooltipContent()}
        placement={placement}
        trigger="click"
        visible={visible}
        onVisibleChange={setVisible}
      >
        <QuestionCircleOutlined 
          style={{ 
            cursor: 'pointer', 
            color: '#1890ff',
            marginLeft: 4 
          }} 
        />
      </Tooltip>
      {renderModalContent()}
    </>
  )
}

/**
 * Hook for providing contextual help to components
 */
export const useContextualHelp = () => {
  const showHelp = (helpKey, options = {}) => {
    // This can be extended to integrate with a global help system
    console.log(`Show help for: ${helpKey}`, options)
  }

  return { showHelp }
}

/**
 * Higher-order component to add contextual help to any component
 */
export const withContextualHelp = (WrappedComponent, helpConfig) => {
  return (props) => {
    return (
      <div style={{ position: 'relative' }}>
        <WrappedComponent {...props} />
        {helpConfig && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <ContextualHelp {...helpConfig} />
          </div>
        )}
      </div>
    )
  }
}

/**
 * Help provider for context-based help
 */
export const HelpProvider = ({ children }) => {
  const [helpContext, setHelpContext] = useState(null)

  const showContextualHelp = (context) => {
    setHelpContext(context)
  }

  const hideContextualHelp = () => {
    setHelpContext(null)
  }

  return (
    <div>
      {children}
      {helpContext && (
        <ContextualHelp
          helpKey={helpContext.key}
          type="modal"
          title={helpContext.title}
          content={helpContext.content}
        />
      )}
    </div>
  )
}

export default ContextualHelp
