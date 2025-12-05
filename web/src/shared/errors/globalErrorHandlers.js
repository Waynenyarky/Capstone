import { notification } from 'antd'

export function initializeGlobalErrorHandlers() {
  // JS runtime errors
  window.addEventListener('error', (event) => {
    const msg = event?.error?.message || event?.message || 'Unknown runtime error'
    notification.error({
      message: 'Runtime Error',
      description: msg,
      placement: 'bottomRight',
    })
    // Also log for dev visibility
    console.error('Global error:', event.error || event)
  })

  // Unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason
    const msg = (typeof reason === 'string' ? reason : reason?.message) || 'Unhandled promise rejection'
    notification.error({
      message: 'Unhandled Rejection',
      description: msg,
      placement: 'bottomRight',
    })
    console.error('Unhandled rejection:', reason)
  })
}