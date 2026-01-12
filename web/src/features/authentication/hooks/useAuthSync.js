import { useEffect } from 'react'
import { message } from 'antd'
import { getMe } from '../services/authService'
import { useAuthSession } from './useAuthSession'

/**
 * Hook to synchronize authentication state across tabs using BroadcastChannel.
 * Listens for 'email-verified' events to refresh the current user session.
 */
export function useAuthSync() {
  const { login, currentUser } = useAuthSession()

  useEffect(() => {
    const bc = new BroadcastChannel('auth_channel')
    let processing = false

    bc.onmessage = async (event) => {
      if (event.data.type === 'email-verified' && !processing) {
        processing = true
        message.success('Email verified! Syncing...')
        try {
          // Force fetch fresh user data to update THIS tab's session
          const freshUser = await getMe()
          if (freshUser && freshUser.isEmailVerified) {
            // Preserve the existing token if needed, or rely on what getMe returns if it includes it
            // Typically getMe returns the user profile, token might be in the session already
            const nextUser = { ...freshUser }
            if (currentUser?.token && !nextUser.token) {
                nextUser.token = currentUser.token
            }
            
            login(nextUser)
          }
        } catch (err) {
          console.error('Failed to sync verified status:', err)
        } finally {
          setTimeout(() => { processing = false }, 2000)
        }
      }
    }

    return () => bc.close()
  }, [login, currentUser])
}
