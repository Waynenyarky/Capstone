import { Button } from 'antd'
import { usePasskeyLogin } from '@/features/authentication/login/hooks/usePasskeyLogin.js'

export default function PasskeyButton({ form }) {
  const { handlePasskeyLogin } = usePasskeyLogin(form)

  return (
    <Button onClick={handlePasskeyLogin} type="default" block icon={<span role="img" aria-label="passkey">🔑</span>}>
      Sign in with Passkey
    </Button>
  )
}
