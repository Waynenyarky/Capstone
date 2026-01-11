import { notification as staticNotification } from 'antd'

// default to static, replaced by App instance once mounted
let notificationApi = staticNotification

export function setGlobalNotificationApi(api) {
  notificationApi = api
}

export function initializeGlobalErrorHandlers() {
  // JS runtime errors
  window.addEventListener('error', (event) => {
    const msg = event?.error?.message || event?.message || 'Unknown runtime error'
    notificationApi.error({
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
    notificationApi.error({
      message: 'Unhandled Rejection',
      description: msg,
      placement: 'bottomRight',
    })
    console.error('Unhandled rejection:', reason)
  })
}