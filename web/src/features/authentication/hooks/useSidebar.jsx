import { useMemo, useState } from 'react'
import { useAuthSession } from '@/features/authentication'
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  StopOutlined, 
  CreditCardOutlined, 
  AuditOutlined, 
  UserOutlined, 
  LogoutOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  BarChartOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons'

// Role keys used across the app: 'business_owner', 'admin', 'inspector', 'lgu_officer', 'lgu_manager', 'cso', 'user'
export default function useSidebar() {
  const { role } = useAuthSession()

  const items = useMemo(() => {
    // Items are objects: { key, label, to?, type?, icon? }
    const businessItems = [
      { key: 'dashboard', label: 'Dashboard', to: '/business', icon: <DashboardOutlined /> },
      { key: 'permit-apps', label: 'Permit Applications', to: '/permit-applications', icon: <FileTextOutlined /> },
      { key: 'cessation', label: 'Cessation', to: '/cessation', icon: <StopOutlined /> },
      { key: 'payments', label: 'Payments', to: '/payments', icon: <CreditCardOutlined /> },
      { key: 'appeals', label: 'Appeals', to: '/appeals', icon: <AuditOutlined /> },
      { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
      { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
    ]

    const perRole = {
      business: businessItems, // Backward compatibility for stale sessions
      business_owner: businessItems,
      admin: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'admin-full', label: 'Admin — Full', to: '/admin/full', icon: <SafetyCertificateOutlined /> },
        { key: 'admin-users', label: 'User Management', to: '/admin/users', icon: <TeamOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      inspector: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/inspections', icon: <SolutionOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      lgu_officer: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'applications', label: 'Permit Applications (Review)', to: '/applications', icon: <FileTextOutlined /> },
        { key: 'cessation', label: 'Cessation (Review)', to: '/cessation', icon: <StopOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/inspections', icon: <SolutionOutlined /> },
        { key: 'appeals', label: 'Appeals', to: '/appeals', icon: <AuditOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      lgu_manager: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'reports', label: 'Reports / Analytics', to: '/reports', icon: <BarChartOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      cso: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'support', label: 'Customer Support / Inquiry', to: '/support', icon: <CustomerServiceOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      user: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/profile-static', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
    }

    const roleKey = (role || 'user').toString()
    return perRole[roleKey] || perRole.user
  }, [role])

  const [selected, setSelected] = useState(items[0]?.key ?? 'dashboard')

  const onSelect = ({ key }) => setSelected(key)

  return { items, selected, onSelect, role }
}
