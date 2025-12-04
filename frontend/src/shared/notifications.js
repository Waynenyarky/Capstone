import { App } from 'antd'
import { useMemo } from 'react'

// Extract a human-friendly error message with sensible fallback
export function extractErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return String(fallback)
  if (typeof err === 'string') return err
  if (typeof err?.message === 'string' && err.message.trim()) return err.message
  try {
    const s = JSON.stringify(err)
    if (s && s.length < 200) return s
  } catch (err) { void err }
  return String(fallback)
}

// Create a notifier from a provided antd message api
export function createNotifier(messageApi) {
  const success = (text, duration) => {
    if (!messageApi?.success) return
    messageApi.success(String(text), duration)
  }
  const info = (text, duration) => {
    if (!messageApi?.info) return
    messageApi.info(String(text), duration)
  }
  const warning = (text, duration) => {
    if (!messageApi?.warning) return
    messageApi.warning(String(text), duration)
  }
  const error = (err, fallback = 'Something went wrong', duration) => {
    if (!messageApi?.error) return
    const msg = extractErrorMessage(err, fallback)
    messageApi.error(msg, duration)
  }
  return { success, info, warning, error }
}

// Convenience hook to access notifier in React components/hooks
export function useNotifier() {
  const { message } = App.useApp()
  return useMemo(() => createNotifier(message), [message])
}