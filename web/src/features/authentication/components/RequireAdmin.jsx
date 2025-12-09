import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'

export default function RequireAdmin({ children }) {
  const { currentUser, role } = useAuthSession()
  const location = useLocation()

  // If no authenticated user or not an admin, redirect to admin login.
  if (!currentUser || role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}
