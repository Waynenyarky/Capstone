import React from 'react'
import { useAuthSession } from '@/features/authentication'
import { Navigate } from 'react-router-dom'
import LGUOfficerDashboard from '../lgu-officer/pages/LGUOfficerDashboard'
import LGUManagerDashboard from '../lgu-manager/pages/LGUManagerDashboard'
import InspectorDashboard from '../inspector/pages/InspectorDashboard'
import CSODashboard from '../cso/pages/CSODashboard'
import PlaceholderPage from '@/features/shared/pages/PlaceholderPage.jsx'

export default function StaffDashboard() {
  const { role, currentUser } = useAuthSession()
  const bypassMfaDev = import.meta.env.VITE_BYPASS_MFA_DEV === 'true'
  const mustSetupMfaEffective = bypassMfaDev ? false : !!currentUser?.mustSetupMfa

  if (currentUser?.mustChangeCredentials || mustSetupMfaEffective) {
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
