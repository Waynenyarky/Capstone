import { App } from 'antd'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from "@/features/authentication/hooks/useAuthSession.js"

export function useLogoutForm() {
  const { currentUser, role, logout } = useAuthSession()
  const { success, error } = useNotifier()
  const name = [currentUser?.firstName, currentUser?.lastName]
    .filter(Boolean)
    .join(' ') || currentUser?.email || 'Unknown'

  const handleLogout = async () => {
    try {
      await Promise.resolve(logout())
      success('Logged out')
    } catch (err) {
      console.error('Logout error:', err)
      error(err, 'Failed to logout')
    }
  }

  return { name, role: role || 'unknown', handleLogout }
}