import { useCallback, useEffect, useState } from 'react'
import { getAllUsers } from '@/features/admin/services'
import { subscribeUserSignedUp } from '../lib/usersEvents.js'

export function useUsersTable() {
  const [users, setUsers] = useState([])
  const [isLoading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error('Load users error:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const unsubscribe = subscribeUserSignedUp(() => {
      load()
    })
    return unsubscribe
  }, [load])

  return { users, isLoading, reloadUsers: load }
}