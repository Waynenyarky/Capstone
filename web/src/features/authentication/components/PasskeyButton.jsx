import React from 'react'
import { Button } from 'antd'
import { usePasskeyLogin } from '../hooks'

export default function PasskeyButton({ form }) {
  const { handlePasskeyLogin } = usePasskeyLogin(form)

  return (
    <Button onClick={handlePasskeyLogin} type="default" block size="large" icon={<span role="img" aria-label="passkey">🔑</span>}>
      Sign in with Passkey
    </Button>
  )
}
