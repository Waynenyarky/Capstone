import { useState, useCallback, useEffect } from 'react'

export default function useSiteSettings() {
  const [tabKey, setTabKey] = useState('overview')
  const [showMenu, setShowMenu] = useState(true)

  const handleMenuSelect = useCallback((key) => {
    setTabKey(key)
    setShowMenu(false)
  }, [])

  const handleBackToMenu = useCallback(() => {
    setShowMenu(true)
  }, [])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action: evAction, tab } = event?.detail || {}
      if (evAction === 'setTab' && (tab === 'overview' || tab === 'announcements' || tab === 'requests' || tab === 'history')) {
        setTabKey(tab === 'history' ? 'requests' : tab)
        setShowMenu(false)
      }
    }
    window.addEventListener('devtools:maintenance', handler)
    return () => window.removeEventListener('devtools:maintenance', handler)
  }, [])

  return {
    tabKey,
    showMenu,
    handleMenuSelect,
    handleBackToMenu,
  }
}
