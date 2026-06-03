// Optional MFA setup step shown to business owners after email verification.
// Uses MfaSetup (passkey or authenticator) with a "Skip for now" option.
import { Button } from 'antd'
import MfaSetup from '@/features/authentication/mfa/components/MfaSetup.jsx'

export default function SignUpMfaSetupStep({ onSkip, onComplete }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 520 }}>
      <MfaSetup
        onComplete={onComplete}
      />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        
        <Button type="link" onClick={onSkip} style={{ padding: 0, fontWeight: 600 }}>
          Skip for now
        </Button>
      </div>
    </div>
  )
}
