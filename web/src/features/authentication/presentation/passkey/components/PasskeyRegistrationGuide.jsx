/**
 * Presentation Component: PasskeyRegistrationGuide
 * Modal showing registration guide - pure presentation
 */
import React from 'react'
import { Modal, Alert, Steps, Typography, Divider, Space, Button } from 'antd'
import { SafetyCertificateOutlined, CheckCircleOutlined, CheckCircleFilled } from '@ant-design/icons'
import { theme } from 'antd'

const { Title, Text } = Typography

export default function PasskeyRegistrationGuide({ 
  visible, 
  onCancel, 
  onStart, 
  registering,
  isMobile 
}) {
  const { token } = theme.useToken()

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <span>Register Your Passkey</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="start" type="primary" onClick={onStart} loading={registering}>
          Start Registration
        </Button>
      ]}
      width={isMobile ? '90%' : 520}
      centered
      styles={{
        body: {
          padding: '12px 0'
        }
      }}
    >
      <div style={{ padding: '4px 0' }}>
        <Alert
          type="info"
          showIcon
          message="Before You Begin"
          description="Ensure your device supports passkeys (Windows Hello, Touch ID, Face ID, or security keys) and you're using a compatible browser."
          style={{ marginBottom: 12, fontSize: 13 }}
          size="small"
        />

        <Title level={5} style={{ marginBottom: 10, fontSize: 15 }}>Quick Guide</Title>
        
        <Steps
          direction="vertical"
          size="small"
          items={[
            {
              title: <Text strong style={{ fontSize: 13 }}>Device Compatibility</Text>,
              description: (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Supported: Windows Hello • Mac Touch ID/Face ID • Mobile biometrics • Security keys
                </Text>
              ),
              icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            },
            {
              title: <Text strong style={{ fontSize: 13 }}>Start Registration</Text>,
              description: (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Click "Start Registration" below. Your browser will prompt you to create a passkey.
                </Text>
              ),
              icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            },
            {
              title: <Text strong style={{ fontSize: 13 }}>Select Save Location</Text>,
              description: (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Choose <strong>This device</strong> (personal) or <strong>Security key</strong> (shared). You can register multiple passkeys later.
                </Text>
              ),
              icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            },
            {
              title: <Text strong style={{ fontSize: 13 }}>Authenticate</Text>,
              description: (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Use your device's biometrics, PIN, or security key to complete registration.
                </Text>
              ),
              icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            },
            {
              title: <Text strong style={{ fontSize: 13 }}>Done!</Text>,
              description: (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Your passkey will be registered successfully. You can register multiple passkeys for different devices.
                </Text>
              ),
              icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
            }
          ]}
        />

        <Divider style={{ margin: '12px 0' }} />

        <Alert
          type="success"
          showIcon={false}
          message={<Text strong style={{ fontSize: 13 }}>Benefits: No passwords • More secure • Works across devices • Fast authentication</Text>}
          style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '8px 12px', margin: 0 }}
          size="small"
        />
      </div>
    </Modal>
  )
}
