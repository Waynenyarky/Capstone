import { useCallback, useMemo, useEffect, useState } from 'react'
import { getPublicOfferings, getCategories } from '@/features/customer/services/catalogService.js'
import { getCustomerProfile } from '@/features/customer/services/customerService.js'
import { getActiveAddress } from '@/features/customer/addresses/services/customerAddressesService.js'
import { useAuthSession } from '@/features/authentication/hooks/useAuthSession.js'

/**
 * Composable hook to manage services catalog with search, category tabs, and optional location-based filtering.
 */
export function useAvailableServices() {
  const [offerings, setOfferings] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [locationContext, setLocationContext] = useState({ city: '', province: '', active: false })
  const { currentUser, role } = useAuthSession()

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, cats] = await Promise.all([getPublicOfferings(), getCategories()])
      setOfferings(Array.isArray(rows) ? rows : [])
      setCategories(Array.isArray(cats) ? cats : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleSearchSubmit = useCallback((text) => {
    setSearch(String(text || '').trim())
  }, [])

  const handleTabChange = useCallback((key) => {
    setActiveCategory(String(key || 'all'))
  }, [])

  const filterByCurrentLocation = useCallback(async () => {
    setLoading(true)
    try {
      // Prefer active customer address; fall back to profile if not available
      let city = ''
      let province = ''
      try {
        const active = await getActiveAddress(currentUser, role)
        city = String(active?.city || '').trim()
        province = String(active?.province || '').trim()
      } catch {
        const profile = await getCustomerProfile(currentUser, role)
        city = String(profile?.city || '').trim()
        province = String(profile?.province || '').trim()
      }
      if (!city && !province) {
        setLocationContext({ city: '', province: '', active: false })
      } else {
        setLocationContext({ city, province, active: true })
        // Refetch scoped to location (server filters by provider city or serviceAreas)
        const rows = await getPublicOfferings({ city, province })
        setOfferings(Array.isArray(rows) ? rows : [])
      }
    } catch (err) {
      // Graceful fallback: keep existing offerings and turn off location filter
      console.warn('Use My Location unavailable:', err?.message || err)
      setLocationContext({ city: '', province: '', active: false })
    } finally {
      setLoading(false)
    }
  }, [currentUser, role])

  const resetLocationFilter = useCallback(async () => {
    setLocationContext({ city: '', province: '', active: false })
    await reload()
  }, [reload])

  const filteredServices = useMemo(() => {
    let list = (offerings || []).filter((o) => String(o.status || 'active').toLowerCase() === 'active')
    if (locationContext.active && locationContext.city) {
      const cityLC = locationContext.city.toLowerCase()
      list = list.filter((o) => {
        const byCity = String(o.providerCity || '').toLowerCase() === cityLC
        const areas = Array.isArray(o.providerServiceAreas) ? o.providerServiceAreas.map((x) => String(x).toLowerCase()) : []
        const byArea = areas.includes(cityLC)
        return byCity || byArea
      })
    }
    if (activeCategory !== 'all') {
      list = list.filter((o) => String(o.categoryName || '') === String(activeCategory))
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((o) => String(o.serviceName || '').toLowerCase().includes(q) || String(o.providerName || '').toLowerCase().includes(q) || String(o.providerDescription || '').toLowerCase().includes(q))
    }
    return list
  }, [offerings, search, activeCategory, locationContext])

  const categoryTabs = useMemo(() => {
    const names = Array.from(new Set((categories || []).map((c) => String(c.name)).filter(Boolean))).sort((a, b) => a.localeCompare(b))
    return ['all', ...names]
  }, [categories])

  return {
    services: filteredServices,
    categoryTabs,
    loading,
    search,
    activeCategory,
    locationContext,
    reload,
    handleSearchSubmit,
    handleTabChange,
    filterByCurrentLocation,
    resetLocationFilter,
  }
}