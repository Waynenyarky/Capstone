import { useMemo, useState } from 'react'
import { useAuthSession } from '@/features/authentication'

// Role keys used across the app: 'business', 'admin', 'inspector', 'lgu_officer', 'lgu_manager', 'cso', 'user'
export default function useSidebar() {
  const { role } = useAuthSession()

  const items = useMemo(() => {
    // Items are objects: { key, label, to?, type? }
    const businessItems = [
      { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
      { key: 'permit-apps', label: 'Permit Applications', to: '/permit-applications' },
      { key: 'cessation', label: 'Cessation', to: '/cessation' },
      { key: 'payments', label: 'Payments', to: '/payments' },
      { key: 'appeals', label: 'Appeals', to: '/appeals' },
      { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
      { key: 'logout', label: 'Logout', type: 'action' },
    ]

    const perRole = {
      business: businessItems,
      admin: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'admin-full', label: 'Admin — Full', to: '/admin/full' },
        { key: 'admin-users', label: 'User Management', to: '/admin/users' },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
        { key: 'logout', label: 'Logout', type: 'action' },
      ],
      inspector: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'inspections', label: 'Violations / Inspections', to: '/inspections' },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
        { key: 'logout', label: 'Logout', type: 'action' },
      ],
      lgu_officer: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'applications', label: 'Permit Applications (Review)', to: '/applications' },
        { key: 'cessation', label: 'Cessation (Review)', to: '/cessation' },
        { key: 'inspections', label: 'Violations / Inspections', to: '/inspections' },
        { key: 'appeals', label: 'Appeals', to: '/appeals' },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
        { key: 'logout', label: 'Logout', type: 'action' },
      ],
      lgu_manager: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'reports', label: 'Reports / Analytics', to: '/reports' },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
        { key: 'logout', label: 'Logout', type: 'action' },
      ],
      cso: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'support', label: 'Customer Support / Inquiry', to: '/support' },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
        { key: 'logout', label: 'Logout', type: 'action' },
      ],
      user: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static' },
        { key: 'logout', label: 'Logout', type: 'action' },
      ],
    }

    const roleKey = (role || 'user').toString()
    return perRole[roleKey] || perRole.user
  }, [role])

  const [selected, setSelected] = useState(items[0]?.key ?? 'dashboard')

  const onSelect = ({ key }) => setSelected(key)

  return { items, selected, onSelect, role }
}
