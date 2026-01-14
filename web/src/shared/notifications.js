import { App } from 'antd'
import { useMemo } from 'react'

// Extract a human-friendly error message with sensible fallback
export function extractErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return String(fallback)
  
  // Handle string errors directly
  if (typeof err === 'string') {
    const trimmed = err.trim()
    return trimmed || String(fallback)
  }
  
  // Handle Error objects
  if (err instanceof Error) {
    if (err.message && typeof err.message === 'string' && err.message.trim()) {
      return err.message.trim()
    }
    // For WebAuthn errors, use the error name if message is not helpful
    if (err.name && err.name !== 'Error') {
      return `${err.name}: ${err.message || 'An error occurred'}`
    }
  }
  
  // Handle objects with message property
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message.trim()
  }
  
  // Handle nested error structures (common in API responses)
  if (err?.error) {
    if (typeof err.error === 'string') {
      return err.error.trim() || String(fallback)
    }
    if (err.error?.message && typeof err.error.message === 'string') {
      return err.error.message.trim()
    }
  }
  
  // Try to stringify as last resort
  try {
    const s = JSON.stringify(err)
    if (s && s.length < 200 && s !== '{}') return s
  } catch (e) { void e }
  
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