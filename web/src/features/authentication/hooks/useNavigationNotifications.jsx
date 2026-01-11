import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import { LockOutlined } from '@ant-design/icons'

export default function useNavigationNotifications() {
  const location = useLocation()
  const { notification } = AntdApp.useApp()

  useEffect(() => {
    if (location.state?.notification) {
      const { type = 'info', message, description } = location.state.notification
      
      // If it's an access warning (login required or forbidden), show it as a professional top-center alert
      const isSecurityWarning = ['Access Denied', 'Restricted Access', '403 Forbidden'].includes(message) && type === 'warning'
      
      if (isSecurityWarning) {
        // Map internal message codes to display titles if needed
        let title = message
        if (message === 'Access Denied') title = 'Restricted Access'

        notification.error({ // Use 'error' type for red styling automatically
          message: <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f1f1f' }}>{title}</span>,
          description: <span style={{ fontSize: '14px', color: '#666' }}>{description}</span>,
          placement: 'top',
          top: 24, // Add spacing from top of screen
          duration: 5,
          icon: <LockOutlined style={{ color: '#ff4d4f', fontSize: '22px' }} />,
          style: { 
            width: 400, 
            margin: '0 auto',
            borderRadius: '8px', // Softer corners
            border: '1px solid #ffccc7', // Subtle red border
            backgroundColor: '#fff1f0', // Very light red background (Standard Enterprise Error/Alert)
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          },
          closeIcon: false, // Cleaner look without close button (auto-dismiss)
          key: `access-denied-${Date.now()}`,
        })
      } else {
        // Otherwise, use the standard notification toast
        notification[type]({
          message,
          description,
          placement: 'topRight',
          duration: 4.5,
          key: `nav-notification-${Date.now()}`,
        })
      }
      
      // Clear the notification from state to prevent it from showing again on refresh
      // We use window.history to manipulate the state without triggering a re-render/navigation loop
      const state = { ...window.history.state }
      if (state.usr) {
        delete state.usr.notification
        window.history.replaceState(state, '')
      }
    }
  }, [location, notification])
}
