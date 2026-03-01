import { useAuthNotification } from '@/shared/notifications.js'
import { useAuthSession } from "@/features/authentication/hooks/useAuthSession.js"
import { useNavigate } from 'react-router-dom'
import { useNotifier } from '@/shared/notifications.js'
import { logoutApi } from '@/features/authentication/services/authService.js'

export function useLogoutForm() {
  const { currentUser, role, logout } = useAuthSession()
  const { notificationSuccess } = useAuthNotification()
  const { error } = useNotifier()
  const navigate = useNavigate()
  
  const name = [currentUser?.firstName, currentUser?.lastName]
    .filter(Boolean)
    .join(' ') || currentUser?.email || 'Unknown'

  const handleLogout = async () => {
    try {
      await logoutApi().catch(() => {})
      navigate('/login')
      logout()
      notificationSuccess('Logged out', 'You have been signed out successfully.')
    } catch (err) {
      console.error('Logout error:', err)
      error(err, 'Failed to logout')
    }
  }

  return { name, role: (role?.slug || role || 'unknown').toString(), handleLogout }
}
