import React, { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '@/features/shared'
import useSidebar from '../../hooks/useSidebar'
import { useAuthSession } from '../../hooks'
import ConfirmLogoutModal from './ConfirmLogoutModal.jsx'
import { useConfirmLogoutModal } from '../../hooks'

export default function AppSidebar({ hiddenKeys = [], renamedKeys = {}, itemOverrides = {}, ...siderProps }) {
  const { items: rawItems, selected, onSelect } = useSidebar()
  const { currentUser, logout } = useAuthSession()
  const navigate = useNavigate()
  const location = useLocation()

  // Double safety check: ensure items is always an array
  // Also filter out hidden keys and apply renamed labels
  const items = useMemo(() => {
    let arr = Array.isArray(rawItems) ? rawItems : []

    // Apply renames
    if (Object.keys(renamedKeys).length > 0) {
      arr = arr.map(item => {
        if (renamedKeys[item.key]) {
          return { ...item, label: renamedKeys[item.key] }
        }
        return item
      })
    }

    // Apply overrides (label, icon, etc) - preserve children
    if (Object.keys(itemOverrides).length > 0) {
      arr = arr.map(item => {
        if (itemOverrides[item.key]) {
          // Preserve children when applying overrides
          const override = itemOverrides[item.key]
          return { ...item, ...override, children: override.children !== undefined ? override.children : item.children }
        }
        return item
      })
    }

    if (hiddenKeys.length > 0) {
      return arr.filter(i => !hiddenKeys.includes(i.key))
    }
    return arr
  }, [rawItems, hiddenKeys, renamedKeys, itemOverrides])

  // derive the active key from the current location so route changes
  // (via Link) immediately reflect as the selected/highlighted item
  const activeKey = useMemo(() => {
    // Recursively find all items (including children) that match the current path
    const findAllMatchingItems = (itemsList) => {
      const matches = []
      for (const item of itemsList) {
        if (item.to && location.pathname.startsWith(item.to)) {
          matches.push(item)
        }
        if (item.children) {
          matches.push(...findAllMatchingItems(item.children))
        }
      }
      return matches
    }
    
    const matches = findAllMatchingItems(items)
    
    // If multiple matches, pick the one with the longest 'to' path (most specific match)
    // e.g. '/owner/permits' should match 'permit-apps' instead of 'dashboard' ('/owner')
    if (matches.length > 0) {
      matches.sort((a, b) => b.to.length - a.to.length)
      return matches[0].key
    }
    
    return selected
  }, [items, location.pathname, selected])

  const { open, show, hide, confirming, handleConfirm } = useConfirmLogoutModal({
    onConfirm: async () => {
      // perform logout and navigate
      try {
        // Navigate for immediate feedback, but logout() will also trigger a redirect
        // handled gracefully by ProtectedRoute's isLoggingOut check.
        navigate('/login')
        logout()
      } catch (err) {
        void err
      }
    }
  })

  const handleItemClick = (item) => {
    if (item.type === 'action' && item.key === 'logout') {
      show()
      return
    }
    
    // If item has custom onClick handler, call it
    if (item.onClick && typeof item.onClick === 'function') {
      item.onClick(item)
      return
    }
    
    // Update internal selection state if needed (mostly for controlled mode)
    onSelect({ key: item.key })

    // Programmatic navigation for better click handling
    if (item.to) {
      navigate(item.to)
    }
  }

  return (
    <>
      <Sidebar 
        items={items} 
        activeKey={activeKey} 
        onItemClick={handleItemClick} 
        {...siderProps}
      />
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </>
  )
}
