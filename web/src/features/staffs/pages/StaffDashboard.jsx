import { useAuthSession } from '@/features/authentication'
import { Navigate } from 'react-router-dom'
import OfficerDashboard from '../lgu-officer/pages/OfficerDashboard'
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
      return <OfficerDashboard />
    default:
      // Fallback or generic staff page
      return <PlaceholderPage title="Staff Dashboard" />
  }
}
