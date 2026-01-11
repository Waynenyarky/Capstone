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
    const displayName = (currentUser?.firstName || currentUser?.lastName) 
      ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
      : (currentUser?.name || currentUser?.email || 'User')

    return {
      name: displayName,
      email: currentUser?.email || '',
      avatar: currentUser?.avatar,
      role: (currentUser?.role?.slug || currentUser?.role || 'user').toString(),
      mfaEnabled: !!currentUser.mfaEnabled,
    }
  }, [currentUser])

  const noop = (e) => { e && e.preventDefault() }

  const editableStyle = { border: '1px dashed rgba(0,0,0,0.12)', padding: 8, borderRadius: 6, background: '#fff' }

  return { user, noop, editableStyle }
}
