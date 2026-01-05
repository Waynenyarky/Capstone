import { Row, Col } from 'antd'
import { ForgotPasswordForm, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { usePasswordResetFlow } from "@/features/authentication/hooks"
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifier } from '@/shared/notifications.js'

export default function PasswordResetFlow() {
  const { step, forgotProps, verifyProps, changeProps } = usePasswordResetFlow()
  const navigate = useNavigate()
  const { success } = useNotifier()

  useEffect(() => {
    if (step === 'done') {
      success('Your password was updated. Please log in with your new password.')
      navigate('/login')
    }
  }, [step, navigate, success])

  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        {step === 'forgot' && <ForgotPasswordForm onSubmit={forgotProps.onSubmit} />}
        {step === 'verify' && <VerificationForm email={verifyProps.email} onSubmit={verifyProps.onSubmit} />}
        {step === 'change' && <ChangePasswordForm email={changeProps.email} resetToken={changeProps.resetToken} onSubmit={changeProps.onSubmit} />}
      </Col>
    </Row>
  )
}