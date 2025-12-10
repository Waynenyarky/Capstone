import React from 'react'
import { Input } from 'antd'

export default function OtpInput(props) {
  const { value = '', onChange, maxLength = 6, placeholder = '123456', ...rest } = props || {}

  const handleChange = (e) => {
    const raw = String(e.target.value || '')
    const digits = raw.replace(/\D+/g, '').slice(0, maxLength)
    if (typeof onChange === 'function') onChange({ target: { value: digits } })
  }

  return (
    <Input
      value={String(value || '')}
      onChange={handleChange}
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      maxLength={maxLength}
      {...rest}
    />
  )
}
