import React, { useState, useCallback } from 'react'
import { Modal, Form, Input, Button, Typography, Steps, Result, Spin } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import { post } from '@/lib/http.js'

const { Text, Paragraph } = Typography

export default function LinkExistingAccountModal({ open, onClose }) {
  const [form] = Form.useForm()
  const [verifyForm] = Form.useForm()
  const [step, setStep] = useState(0) // 0=form, 1=verify, 2=done
  const [loading, setLoading] = useState(false)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkBp, setLinkBp] = useState('')
  const { success, error } = useNotifier()

  const handleClose = useCallback(() => {
    setStep(0)
    form.resetFields()
    verifyForm.resetFields()
    setLinkEmail('')
    setLinkBp('')
    onClose()
  }, [form, verifyForm, onClose])

  const handleSendCode = useCallback(async (values) => {
    try {
      setLoading(true)
      await post('/api/auth/link-existing-account', {
        email: values.email,
        businessPlateNo: values.businessPlateNo,
      })
      setLinkEmail(values.email)
      setLinkBp(values.businessPlateNo)
      setStep(1)
      success('Verification code sent to your email')
    } catch (err) {
      error(err, 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }, [success, error])

  const handleVerify = useCallback(async (values) => {
    try {
      setLoading(true)
      await post('/api/auth/link-existing-account/verify', {
        email: linkEmail,
        businessPlateNo: linkBp,
        code: values.code,
      })
      setStep(2)
      success('Account linked successfully!')
    } catch (err) {
      error(err, 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }, [linkEmail, linkBp, success, error])

  return (
    <Modal
      title="Link Existing Permit Account"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Details' },
          { title: 'Verify' },
          { title: 'Done' },
        ]}
      />

      {step === 0 && (
        <>
          <Paragraph type="secondary">
            If you already have a business permit with the BPLO, enter your email and business
            plate number below. We will send a verification code to your email.
          </Paragraph>
          <Form form={form} layout="vertical" onFinish={handleSendCode}>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="Email used for your permit" />
            </Form.Item>
            <Form.Item
              name="businessPlateNo"
              label="Business Plate Number"
              rules={[{ required: true, message: 'Please enter your business plate number' }]}
            >
              <Input placeholder="e.g. BP-2024-001234" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Send Verification Code
            </Button>
          </Form>
        </>
      )}

      {step === 1 && (
        <>
          <Paragraph type="secondary">
            Enter the 6-digit code sent to <Text strong>{linkEmail}</Text>.
            The code expires in 10 minutes.
          </Paragraph>
          <Form form={verifyForm} layout="vertical" onFinish={handleVerify}>
            <Form.Item
              name="code"
              label="Verification Code"
              rules={[
                { required: true, message: 'Please enter the verification code' },
                { pattern: /^\d{6}$/, message: 'Code must be 6 digits' },
              ]}
            >
              <Input.OTP length={6} style={{ width: '100%', justifyContent: 'center' }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Verify & Link Account
            </Button>
          </Form>
        </>
      )}

      {step === 2 && (
        <Result
          status="success"
          title="Account Linked!"
          subTitle="Your account has been linked. Please log in and set your password using the 'Forgot Password' option."
          extra={
            <Button type="primary" onClick={handleClose}>
              Close
            </Button>
          }
        />
      )}
    </Modal>
  )
}
