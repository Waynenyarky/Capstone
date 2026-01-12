import { useMemo, useState, useEffect } from 'react'
import { useAuthSession } from '@/features/authentication'
import { mfaStatus } from '../services/mfaService'

export default function useProfile() {
  const { currentUser } = useAuthSession()
  const [realMfaEnabled, setRealMfaEnabled] = useState(null)

  useEffect(() => {
    let mounted = true
    if (currentUser?.email) {
      mfaStatus(currentUser.email)
        .then(res => {
          if (mounted) setRealMfaEnabled(!!res?.enabled)
        })
        .catch(err => {
          console.error('Failed to fetch MFA status in static profile:', err)
        })
    }
    return () => { mounted = false }
  }, [currentUser?.email])

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
      mfaEnabled: realMfaEnabled !== null ? realMfaEnabled : !!currentUser.mfaEnabled,
    }
  }, [currentUser, realMfaEnabled])

  return { user }
}
