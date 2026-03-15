import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession, useMaintenanceStatus } from '@/features/authentication'

export default function PublicRoute({ children }) {
  const { currentUser, role, isLoading } = useAuthSession()
  const location = useLocation()
  const maintenance = useMaintenanceStatus()

  if (isLoading || maintenance.loading) {
    return null
  }

  // If maintenance mode is active, redirect to maintenance page (except for admin users and allowed public pages)
  if (maintenance.active && location.pathname !== '/maintenance') {
    const roleKey = String(role?.slug || role || '').toLowerCase()
    const allowedPublicPages = ['/', '/login', '/forgot-password', '/sign-up', '/terms', '/privacy']
    
    // Allow admin users and specific public pages during maintenance
    if (roleKey !== 'admin' && !allowedPublicPages.includes(location.pathname)) {
      return <Navigate to="/maintenance" replace state={{ from: location }} />
    }
  }

  if (location.pathname === '/maintenance' && maintenance.active) {
    return children
  }

  if (currentUser && currentUser.token) {
    const r = String(role?.slug || role || '').toLowerCase()
    const state = location.state // Preserve state (e.g. notifications) during redirect

    if (r === 'admin') {
      if (currentUser?.mustChangeCredentials || currentUser?.mustSetupMfa) {
        return <Navigate to="/admin/onboarding" replace state={{ ...state, from: '/admin/dashboard' }} />
      }
      return <Navigate to="/admin/dashboard" replace state={state} />
    }
    
    if (r === 'business_owner') {
      return <Navigate to="/owner" replace state={state} />
    }

    const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'inspector', 'cso']
    if (staffRoles.includes(r)) {
      if (currentUser?.mustChangeCredentials || currentUser?.mustSetupMfa) {
        return <Navigate to="/staff/onboarding" replace state={state} />
      }
      return <Navigate to="/staff" replace state={state} />
    }

    return <Navigate to="/dashboard" replace state={state} />
  }

  return children
}
