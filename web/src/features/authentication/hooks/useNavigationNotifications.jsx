import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthNotification } from '@/shared/notifications.js'
import { getLogoutNotification, clearLogoutNotification } from '@/features/authentication/lib/authEvents.js'

export default function useNavigationNotifications() {
  const location = useLocation()
  const { notificationSuccess, notificationError } = useAuthNotification()

  useEffect(() => {
    // Check for logout notification from global state first
    const logoutNotif = getLogoutNotification()
    if (logoutNotif) {
      if (logoutNotif.type === 'success') {
        notificationSuccess(logoutNotif.message, logoutNotif.description)
      } else {
        notificationError(logoutNotif.message, logoutNotif.description)
      }
      clearLogoutNotification()
      return
    }

    // Then check for location state notifications
    if (location.state?.notification) {
      const { type = 'info', message, description } = location.state.notification
      
      // If it's an access warning (login required or forbidden), show it as a professional top-center alert
      const isSecurityWarning = ['Access Denied', 'Restricted Access', '403 Forbidden'].includes(message) && type === 'warning'
      
      if (isSecurityWarning) {
        // Map internal message codes to display titles if needed
        let title = message
        if (message === 'Access Denied') title = 'Restricted Access'
        notificationError(title, description)
      } else {
        // Otherwise, use the standard notification toast
        if (type === 'success') {
          notificationSuccess(message, description)
        } else {
          notificationError(message, description)
        }
      }
      
      // Clear the notification from state to prevent it from showing again on refresh
      // We use window.history to manipulate the state without triggering a re-render/navigation loop
      const state = { ...window.history.state }
      if (state.usr) {
        delete state.usr.notification
        window.history.replaceState(state, '')
      }
    }
  }, [location, notificationSuccess, notificationError])
}
