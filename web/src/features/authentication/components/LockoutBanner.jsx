import React from 'react'
import { Alert, Typography } from 'antd'
import useOtpCountdown from '@/features/authentication/hooks/useOtpCountdown.js'

export default function LockoutBanner({ lockedUntil } = {}) {
  if (!lockedUntil) return null
  const { remaining, isExpired } = useOtpCountdown(lockedUntil)

  const message = isExpired
    ? 'Account lock has expired — you may try again.'
    : `Account locked. Try again in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`

  return (
    <Alert
      type={isExpired ? 'info' : 'error'}
      message={
        <div>
          <Typography.Text strong>{message}</Typography.Text>
        </div>
      }
      showIcon
      style={{ marginBottom: 12 }}
    />
  )
}
