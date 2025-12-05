import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '@/features/authentication'
import { listAddresses, setPrimaryAddress, createAddress, deleteAddress } from '@/features/customer/addresses/services/customerAddressesService.js'
import { useNotifier } from '@/shared/notifications.js'

export function useCustomerAddresses() {
  const { currentUser, role } = useAuthSession()
  const { success, error } = useNotifier()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await listAddresses(currentUser, role)
      setAddresses(Array.isArray(rows) ? rows : [])
    } catch (err) {
      console.error('Load addresses error:', err)
      error(err, 'Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }, [currentUser, role, error])

  useEffect(() => { reload() }, [reload])

  const primary = useMemo(() => (addresses || []).find((a) => a.isPrimary) || null, [addresses])

  const makePrimary = useCallback(async (id) => {
    try {
      setSaving(true)
      await setPrimaryAddress(id, currentUser, role)
      await reload()
      success('Set as primary address')
    } catch (err) {
      console.error('Set primary error:', err)
      error(err, 'Failed to set primary address')
    } finally {
      setSaving(false)
    }
  }, [currentUser, role, reload, success, error])

  const addAddress = useCallback(async (payload) => {
    try {
      setSaving(true)
      await createAddress(payload, currentUser, role)
      await reload()
      success('Address added')
    } catch (err) {
      console.error('Add address error:', err)
      error(err, 'Failed to add address')
    } finally {
      setSaving(false)
    }
  }, [currentUser, role, reload, success, error])

  const removeAddress = useCallback(async (id) => {
    try {
      setSaving(true)
      await deleteAddress(id, currentUser, role)
      await reload()
      success('Address deleted')
    } catch (err) {
      console.error('Delete address error:', err)
      error(err, 'Failed to delete address')
    } finally {
      setSaving(false)
    }
  }, [currentUser, role, reload, success, error])

  return { addresses, primary, loading, saving, reload, makePrimary, addAddress, removeAddress }
}