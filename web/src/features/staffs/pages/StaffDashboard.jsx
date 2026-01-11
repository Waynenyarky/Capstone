import React from 'react'
import { useAuthSession } from '@/features/authentication'
import { Navigate } from 'react-router-dom'
import LGUOfficerDashboard from '../lgu-officer/pages/LGUOfficerDashboard'
import LGUManagerDashboard from '../lgu-manager/pages/LGUManagerDashboard'
import InspectorDashboard from '../inspector/pages/InspectorDashboard'
import CSODashboard from '../cso/pages/CSODashboard'
import { PlaceholderPage } from '@/features/shared'

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
