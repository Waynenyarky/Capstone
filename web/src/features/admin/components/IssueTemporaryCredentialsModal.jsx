import { useState } from 'react'
import { Modal, Form, InputNumber, Checkbox, Button, Space, Typography, Alert } from 'antd'
import { issueTemporaryCredentials } from '../services/recoveryService.js'
import { useNotifier } from '@/shared/notifications.js'
import TemporaryCredentialsDisplay from './TemporaryCredentialsDisplay.jsx'

const { Text } = Typography

export default function IssueTemporaryCredentialsModal({ open, onClose, recoveryRequest, onIssued }) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [issued, setIssued] = useState(null)
  const { error, success } = useNotifier()

  const handleFinish = async (values) => {
    try {
      setSubmitting(true)
      const payload = {
        recoveryRequestId: recoveryRequest?.id,
        expiresInHours: values.expiresInHours,
        expiresAfterFirstLogin: values.expiresAfterFirstLogin,
      }
      const res = await issueTemporaryCredentials(payload)
      setIssued(res)
      success('Temporary credentials issued')
      onIssued?.()
    } catch (err) {
      console.error('Issue temp credentials failed', err)
      error(err, 'Failed to issue temporary credentials')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setIssued(null)
    onClose?.()
  }

  return (
    <Modal
      title="Issue Temporary Credentials"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      {recoveryRequest && (
        <Alert
          type="warning"
          showIcon
          message="Verify identity"
          description={
            <Text>
              Request from {recoveryRequest.userName} ({recoveryRequest.userEmail}) — IP: {recoveryRequest.metadata?.ip || recoveryRequest.metadata?.ipAddress || 'unknown'}
            </Text>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      {!issued ? (
        <Form
          layout="vertical"
          form={form}
          initialValues={{ expiresInHours: 24, expiresAfterFirstLogin: true }}
          onFinish={handleFinish}
        >
          <Form.Item
            name="expiresInHours"
            label="Expires in (hours)"
            rules={[{ required: true, message: 'Enter expiry hours' }]}
          >
            <InputNumber min={1} max={72} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiresAfterFirstLogin" valuePropName="checked">
            <Checkbox>Expire after first login</Checkbox>
          </Form.Item>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Issue
            </Button>
          </Space>
        </Form>
      ) : (
        <TemporaryCredentialsDisplay credentials={issued} onClose={handleClose} />
      )}
    </Modal>
  )
}
