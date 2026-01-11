import { useEffect } from 'react'
import { App } from 'antd'
import { setGlobalNotificationApi } from './globalErrorHandlers'

export default function GlobalNotificationInit() {
  const { notification } = App.useApp()
  
  useEffect(() => {
    setGlobalNotificationApi(notification)
  }, [notification])
  
  return null
}
