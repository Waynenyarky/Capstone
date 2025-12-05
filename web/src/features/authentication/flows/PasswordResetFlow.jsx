import { Row, Col } from 'antd'
import { ForgotPasswordForm, VerificationForm, ChangePasswordForm } from "@/features/authentication"
import { usePasswordResetFlow } from "@/features/authentication/hooks"

export default function PasswordResetFlow() {
  const { step, forgotProps, verifyProps, changeProps } = usePasswordResetFlow()

  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        {step === 'forgot' && <ForgotPasswordForm onSubmit={forgotProps.onSubmit} />}
        {step === 'verify' && <VerificationForm email={verifyProps.email} devCode={verifyProps.devCode} onSubmit={verifyProps.onSubmit} />}
        {step === 'change' && <ChangePasswordForm email={changeProps.email} resetToken={changeProps.resetToken} onSubmit={changeProps.onSubmit} />}
      </Col>
    </Row>
  )
}