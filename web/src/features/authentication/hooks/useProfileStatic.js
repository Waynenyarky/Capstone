import { useMemo } from 'react'
import { useAuthSession } from '@/features/authentication'

export default function useProfileStatic() {
  const { currentUser } = useAuthSession()

  const user = useMemo(() => {
    if (!currentUser) return {
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@example.com',
      role: 'Business Owner',
      mfaEnabled: true,
    }
    return {
      name: currentUser.name || currentUser.email || 'User',
      email: currentUser.email || '',
      role: currentUser.role || 'user',
      mfaEnabled: !!currentUser.mfaEnabled,
    }
  }, [currentUser])

  const noop = (e) => { e && e.preventDefault() }

  const editableStyle = { border: '1px dashed rgba(0,0,0,0.12)', padding: 8, borderRadius: 6, background: '#fff' }

  return { user, noop, editableStyle }
}
