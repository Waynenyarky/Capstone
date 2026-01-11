import React from 'react'
import { useAuthSession } from '@/features/authentication'
import { Navigate } from 'react-router-dom'
import LGUOfficerDashboard from './LGUOfficerDashboard'
import LGUManagerDashboard from './LGUManagerDashboard'
import InspectorDashboard from './InspectorDashboard'
import CSODashboard from './CSODashboard'
import PlaceholderPage from './PlaceholderPage'

export default function StaffDashboard() {
  const { role, currentUser } = useAuthSession()

  if (currentUser?.mustChangeCredentials || currentUser?.mustSetupMfa) {
    return <Navigate to="/staff/onboarding" replace />
  }

  switch (role) {
    case 'lgu_officer':
      return <LGUOfficerDashboard />
    case 'lgu_manager':
      return <LGUManagerDashboard />
    case 'inspector':
      return <InspectorDashboard />
    case 'cso':
      return <CSODashboard />
    default:
      // Fallback or generic staff page
      return <PlaceholderPage title="Staff Dashboard" />
  }
}
