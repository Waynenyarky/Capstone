import { App } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from "@/features/authentication/hooks/useAuthSession.js"
import { useNavigate } from 'react-router-dom'

export function useLogoutForm() {
  const { currentUser, role, logout } = useAuthSession()
  const { success, error } = useNotifier()
  const navigate = useNavigate()
  
  const name = [currentUser?.firstName, currentUser?.lastName]
    .filter(Boolean)
    .join(' ') || currentUser?.email || 'Unknown'

  const handleLogout = async () => {
    try {
      // Navigate away from protected route FIRST to avoid "Restricted Access" warnings
      // triggered by ProtectedRoute re-rendering with no user.
      navigate('/login')
      
      logout()
      success('Logged out')
    } catch (err) {
      console.error('Logout error:', err)
      error(err, 'Failed to logout')
    }
  }

  return { name, role: (role?.slug || role || 'unknown').toString(), handleLogout }
}