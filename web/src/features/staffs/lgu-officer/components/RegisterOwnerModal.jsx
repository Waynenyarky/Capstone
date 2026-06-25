import { useState, useCallback } from 'react'
import { Modal, Form, Input, App } from 'antd'
import { post } from '@/lib/http.js'

export default function RegisterOwnerModal({ open, onClose, onSuccess }) {
  const [registerForm] = Form.useForm()
  const [registering, setRegistering] = useState(false)
  const { message } = App.useApp()

  const handleSubmit = useCallback(async () => {
    try {
      const values = await registerForm.validateFields()
      setRegistering(true)
      await post('/api/auth/register-walk-in', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || '',
      })
      message.success('Owner registered successfully')
      registerForm.resetFields()
      onClose?.()
      onSuccess?.()
    } catch (err) {
      if (err?.errorFields) return // validation error
      message.error(err?.message || 'Failed to register owner')
    } finally {
      setRegistering(false)
    }
  }, [registerForm, message, onClose, onSuccess])

  const handleCancel = useCallback(() => {
    registerForm.resetFields()
    onClose?.()
  }, [registerForm, onClose])

  return (
    <Modal
      title="Register New Business Owner"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={registering}
      okText="Register"
    >
      <Form form={registerForm} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="First Name" />
        </Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="Last Name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item name="phone" label="Phone (Optional)">
          <Input placeholder="Phone number" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
