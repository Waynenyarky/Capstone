import { Form } from '@/shared/components/AppForm'
import { Button, Flex, Typography, Input, theme, Grid } from 'antd'
import { useLoginVerificationForm, useResendLoginCode } from "@/features/authentication/hooks"
import React from 'react'
import useOtpCountdown from '@/features/authentication/hooks/useOtpCountdown.js'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function LoginVerificationForm({ email, onSubmit, title, otpExpiresAt, devCode, onSessionExpired } = {}) {
  const { form, handleFinish, isSubmitting } = useLoginVerificationForm({ email, onSubmit })
  const cardTitle = title || 'Verify Login'
  const { isSending: isResending, handleResend, isCooling, remaining } = useResendLoginCode({ email, cooldownSec: 60, onSessionExpired })
  const { remaining: otpRemaining, isExpired } = useOtpCountdown(otpExpiresAt)
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const prefillDevCode = () => {
    if (devCode) form.setFieldsValue({ verificationCode: devCode })
  }

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? 6 : 8 }}>{cardTitle}</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Please enter the 6-digit code sent to <br/><Text strong>{email}</Text>
        </Paragraph>
      </div>

      <Form name="loginVerification" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
          ]}
          style={{ marginBottom: 32 }}
          getValueFromEvent={(val) => {
            if (typeof val === 'string') return val.replace(/\D/g, '').slice(0, 6)
            if (Array.isArray(val)) return val.join('').replace(/\D/g, '').slice(0, 6)
            return ''
          }}
        >
          <Input.OTP 
            length={6} 
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            inputType="numeric"
            mask={false}
            onKeyDown={(e) => {
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
              if (allowedKeys.includes(e.key)) return
              if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          />
        </Form.Item>

        <Flex vertical gap="middle">
          <Button type="primary" htmlType="submit" block size="default" loading={isSubmitting} disabled={isSubmitting}>
            Verify
          </Button>

          <Flex justify="space-between" align="center" style={{ marginTop: 8 }}>
            <Text type={isExpired ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
              {otpRemaining != null ? (
                 isExpired ? 'Code expired' : `Code expires in: ${Math.floor(otpRemaining / 60)}:${String(otpRemaining % 60).padStart(2, '0')}`
              ) : ''}
            </Text>
            <Button 
              type="link" 
              onClick={handleResend} 
              loading={isResending} 
              disabled={isCooling || isResending}
              style={{ padding: 0, height: 'auto', fontSize: 13 }}
            >
              {isCooling ? `Resend available in ${remaining}s` : 'Resend Code'}
            </Button>
          </Flex>

          {devCode && import.meta.env.VITE_DEMO_UI !== 'true' && (
            <Button type="dashed" onClick={prefillDevCode} block size="default" >
              Prefill Code (Dev: {devCode})
            </Button>
          )}
          
        </Flex>
      </Form>
    </div>
  )
}