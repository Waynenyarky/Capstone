import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, Input, Button, List, Avatar, Typography, Space, 
  Upload, Modal, Form, Select, Tag, Divider, Tooltip,
  Badge, Dropdown, Menu, Empty, Spin, message
} from 'antd'
import { 
  SendOutlined, PaperClipOutlined, MoreOutlined,
  PhoneOutlined, MailOutlined, VideoCameraOutlined,
  ExclamationCircleOutlined, ClockCircleOutlined,
  CheckCircleOutlined, UserOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text, Title } = Typography
const { Option } = Select

function CommunicationHub() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = useRef(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchConversations()
    fetchOnlineUsers()
    fetchTemplates()
    
    // Simulate WebSocket connection
    const interval = setInterval(() => {
      fetchOnlineUsers()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockConversations = [
        {
          id: '1',
          participant: {
            name: 'Juan Dela Cruz',
            role: 'Business Owner',
            avatar: null,
            businessName: 'ABC Trading Corp'
          },
          lastMessage: 'Thank you for the quick response!',
          lastMessageTime: '2024-01-15 14:30:00',
          unreadCount: 2,
          status: 'online'
        },
        {
          id: '2',
          participant: {
            name: 'Maria Santos',
            role: 'LGU Officer',
            avatar: null,
            department: 'Business Permit Office'
          },
          lastMessage: 'Please submit the required documents.',
          lastMessageTime: '2024-01-15 13:45:00',
          unreadCount: 0,
          status: 'offline'
        },
        {
          id: '3',
          participant: {
            name: 'Carlos Reyes',
            role: 'Business Owner',
            avatar: null,
            businessName: 'Reyes Enterprises'
          },
          lastMessage: 'When is the next inspection schedule?',
          lastMessageTime: '2024-01-15 12:20:00',
          unreadCount: 1,
          status: 'online'
        }
      ]
      
      setConversations(mockConversations)
    } catch (error) {
      message.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockMessages = [
        {
          id: '1',
          conversationId,
          sender: {
            id: 'user1',
            name: 'Juan Dela Cruz',
            role: 'Business Owner'
          },
          content: 'Good morning! I have a question about my business permit application.',
          timestamp: '2024-01-15 09:00:00',
          status: 'read'
        },
        {
          id: '2',
          conversationId,
          sender: {
            id: 'officer1',
            name: 'Maria Santos',
            role: 'LGU Officer'
          },
          content: 'Good morning! I\'d be happy to help you with your application. What specific questions do you have?',
          timestamp: '2024-01-15 09:05:00',
          status: 'read'
        },
        {
          id: '3',
          conversationId,
          sender: {
            id: 'user1',
            name: 'Juan Dela Cruz',
            role: 'Business Owner'
          },
          content: 'I need to know what documents are required for the renewal process.',
          timestamp: '2024-01-15 09:10:00',
          status: 'read'
        },
        {
          id: '4',
          conversationId,
          sender: {
            id: 'officer1',
            name: 'Maria Santos',
            role: 'LGU Officer'
          },
          content: 'For renewal, you\'ll need: 1) Updated business permit form, 2) Previous year\'s tax clearance, 3) Barangay clearance, and 4) Fire safety inspection certificate.',
          timestamp: '2024-01-15 09:15:00',
          status: 'read'
        },
        {
          id: '5',
          conversationId,
          sender: {
            id: 'user1',
            name: 'Juan Dela Cruz',
            role: 'Business Owner'
          },
          content: 'Thank you for the quick response!',
          timestamp: '2024-01-15 14:30:00',
          status: 'read'
        }
      ]
      
      setMessages(mockMessages)
    } catch (error) {
      message.error('Failed to load messages')
    }
  }

  const fetchOnlineUsers = async () => {
    try {
      // Simulate API call
      const mockOnlineUsers = [
        { id: 'user1', name: 'Juan Dela Cruz', status: 'online' },
        { id: 'user3', name: 'Carlos Reyes', status: 'online' },
        { id: 'officer2', name: 'Roberto Tan', status: 'online' }
      ]
      setOnlineUsers(mockOnlineUsers)
    } catch (error) {
      console.error('Failed to fetch online users:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const mockTemplates = [
        {
          id: '1',
          name: 'Document Request',
          content: 'Please provide the following documents for your application: [document list]',
          category: 'Administrative'
        },
        {
          id: '2',
          name: 'Payment Reminder',
          content: 'This is a reminder that your payment is due on [date]. Please ensure timely payment to avoid penalties.',
          category: 'Payment'
        },
        {
          id: '3',
          name: 'Inspection Schedule',
          content: 'Your business inspection has been scheduled for [date] at [time]. Please ensure someone is available.',
          category: 'Inspection'
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newMsg = {
        id: Date.now().toString(),
        conversationId: selectedConversation.id,
        sender: {
          id: 'current_user',
          name: 'Current User',
          role: 'LGU Officer'
        },
        content: newMessage,
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
      
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
      
      // Update conversation
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessage: newMessage, lastMessageTime: newMsg.timestamp }
          : conv
      ))
      
      message.success('Message sent')
    } catch (error) {
      message.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = async (values) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newConversation = {
        id: Date.now().toString(),
        participant: {
          name: values.recipient,
          role: values.role || 'User',
          avatar: null
        },
        lastMessage: values.message,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        status: 'online'
      }
      
      setConversations(prev => [newConversation, ...prev])
      setSelectedConversation(newConversation)
      setShowNewMessageModal(false)
      form.resetFields()
      
      message.success('Conversation started')
    } catch (error) {
      message.error('Failed to start conversation')
    }
  }

  const useTemplate = (template) => {
    setNewMessage(template.content)
    setShowTemplates(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp) => {
    return dayjs(timestamp).format('h:mm A')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <Badge status="success" />
      case 'offline': return <Badge status="default" />
      case 'away': return <Badge status="warning" />
      default: return <Badge status="default" />
    }
  }

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
      case 'delivered': return <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
      case 'read': return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
      default: return <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
    }
  }

  const conversationMenu = (conversation) => (
    <Menu>
      <Menu.Item key="view-profile" icon={<UserOutlined />}>
        View Profile
      </Menu.Item>
      <Menu.Item key="call" icon={<PhoneOutlined />}>
        Start Call
      </Menu.Item>
      <Menu.Item key="video" icon={<VideoCameraOutlined />}>
        Start Video Call
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="mute" icon={<ExclamationCircleOutlined />}>
        Mute Notifications
      </Menu.Item>
      <Menu.Item key="archive" icon={<ExclamationCircleOutlined />}>
        Archive Conversation
      </Menu.Item>
    </Menu>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
        <Title level={3} style={{ margin: 0 }}>Communication Hub</Title>
        <Text type="secondary">Secure messaging with businesses and LGU staff</Text>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversations List */}
        <div style={{ 
          width: 350, 
          borderRight: '1px solid #f0f0f0', 
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>Messages</Text>
              <Button 
                type="primary" 
                size="small"
                onClick={() => setShowNewMessageModal(true)}
              >
                New Message
              </Button>
            </Space>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Spin />
              </div>
            ) : (
              <List
                dataSource={conversations}
                renderItem={(conversation) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: selectedConversation?.id === conversation.id ? '#e6f7ff' : 'transparent',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onClick={() => setSelectedConversation(conversation)}
                    actions={[
                      <Dropdown overlay={conversationMenu(conversation)} trigger={['click']}>
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                      </Dropdown>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: 'relative' }}>
                          <Avatar icon={<UserOutlined />} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                            {getStatusIcon(conversation.status)}
                          </div>
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{conversation.participant.name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatTime(conversation.lastMessageTime)}
                          </Text>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
                            {conversation.lastMessage}
                          </Text>
                          <Space style={{ marginTop: 4 }}>
                            <Tag size="small" color="blue">{conversation.participant.role}</Tag>
                            {conversation.participant.businessName && (
                              <Tag size="small">{conversation.participant.businessName}</Tag>
                            )}
                          </Space>
                        </div>
                      }
                    />
                    {conversation.unreadCount > 0 && (
                      <Badge count={conversation.unreadCount} size="small" />
                    )}
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div style={{ 
                padding: '16px 24px', 
                borderBottom: '1px solid #f0f0f0', 
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <Text strong>{selectedConversation.participant.name}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getStatusIcon(selectedConversation.status)}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedConversation.participant.role}
                      </Text>
                      {selectedConversation.participant.businessName && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          • {selectedConversation.participant.businessName}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
                <Space>
                  <Button icon={<PhoneOutlined />} size="small" />
                  <Button icon={<VideoCameraOutlined />} size="small" />
                  <Dropdown overlay={conversationMenu(selectedConversation)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} size="small" />
                  </Dropdown>
                </Space>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', background: '#f5f5f5' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.sender.role === 'LGU Officer' ? 'flex-end' : 'flex-start',
                      marginBottom: 16
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      background: message.sender.role === 'LGU Officer' ? '#1890ff' : '#fff',
                      padding: '8px 12px',
                      borderRadius: 12,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: message.sender.role === 'LGU Officer' ? '#fff' : '#000' }}>
                        {message.content}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4
                      }}>
                        <Text style={{ 
                          fontSize: 11, 
                          color: message.sender.role === 'LGU Officer' ? '#fff' : '#8c8c8c' 
                        }}>
                          {formatTime(message.timestamp)}
                        </Text>
                        {message.sender.role === 'LGU Officer' && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ 
                padding: '16px 24px', 
                borderTop: '1px solid #f0f0f0', 
                background: '#fff'
              }}>
                <Space style={{ width: '100%' }}>
                  <Button 
                    icon={<PaperClipOutlined />} 
                    size="small"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    Templates
                  </Button>
                  <Upload showUploadList={false}>
                    <Button icon={<PaperClipOutlined />} size="small">
                      Attach
                    </Button>
                  </Upload>
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sending}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </Space>

                {showTemplates && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>Message Templates</Text>
                    <Space wrap>
                      {templates.map((template) => (
                        <Button
                          key={template.id}
                          size="small"
                          onClick={() => useTemplate(template)}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#f5f5f5'
            }}>
              <Empty description="Select a conversation to start messaging" />
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <Modal
        title="Start New Conversation"
        open={showNewMessageModal}
        onCancel={() => setShowNewMessageModal(false)}
        onOk={() => form.submit()}
        okText="Start Conversation"
      >
        <Form form={form} onFinish={startNewConversation} layout="vertical">
          <Form.Item
            name="recipient"
            label="Recipient"
            rules={[{ required: true, message: 'Please select a recipient' }]}
          >
            <Select
              placeholder="Select recipient"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              <Option value="Juan Dela Cruz">Juan Dela Cruz - Business Owner</Option>
              <Option value="Maria Santos">Maria Santos - LGU Officer</Option>
              <Option value="Carlos Reyes">Carlos Reyes - Business Owner</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter a message' }]}
          >
            <TextArea rows={4} placeholder="Type your message..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CommunicationHub
