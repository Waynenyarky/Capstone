import { Button, Input, Typography, Flex, Grid } from 'antd'
import { useTotpVerificationForm } from '@/features/authentication/hooks'
import React from 'react'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function TotpVerificationForm({ email, onSubmit, title } = {}) {
  const { code, setCode, codeError, handleVerify, isSubmitting } = useTotpVerificationForm({ email, onSubmit })
  const cardTitle = title || 'MFA Verification'
  const screens = useBreakpoint()
  const isMobile = !screens.md
  
  return (
    <div 
      style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        width: '100%',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
        <Title level={isMobile ? 4 : 2} style={{ marginBottom: isMobile ? 6 : 8, fontWeight: 700 }}>{cardTitle}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Enter the code from your authenticator app
        </Text>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ maxWidth: 320, margin: '0 auto' }}>
          <div
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleVerify()
                return
              }
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
              if (allowedKeys.includes(e.key)) return
              if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            <Input.OTP 
              length={6} 
              value={code}
              onChange={setCode}
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              inputType="numeric"
              mask={false}
              autoFocus
            />
          </div>
          {codeError && (
            <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              {codeError}
            </div>
          )}
        </div>
      </div>

      <Flex vertical gap="middle">
        <Button 
          type="primary" 
          onClick={handleVerify} 
          loading={isSubmitting} 
          disabled={code.length !== 6 || isSubmitting} 
          block
        >
          Verify
        </Button>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Max attempts: 10 • Multiple failures may temporarily lock verification
          </Text>
        </div>
      </Flex>
    </div>
  )
}
