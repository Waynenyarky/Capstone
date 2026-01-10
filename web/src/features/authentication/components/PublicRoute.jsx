import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'

export default function PublicRoute({ children }) {
  const { currentUser, role, isLoading } = useAuthSession()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (currentUser) {
    const r = String(role || '').toLowerCase()
    const state = location.state // Preserve state (e.g. notifications) during redirect

    if (r === 'admin') {
      return <Navigate to="/admin/dashboard" replace state={state} />
    }
    
    if (r === 'business_owner') {
      return <Navigate to="/owner" replace state={state} />
    }

    const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'inspector', 'cso']
    if (staffRoles.includes(r)) {
      return <Navigate to="/staff" replace state={state} />
    }

    return <Navigate to="/dashboard" replace state={state} />
  }

  return children
}
