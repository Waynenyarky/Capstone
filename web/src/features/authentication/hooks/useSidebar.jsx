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
  const { role, currentUser } = useAuthSession()

  const items = useMemo(() => {
    // Items are objects: { key, label, to?, type?, icon? }
    const staffOnboardingItems = [
      { key: 'onboarding', label: 'Account Setup', to: '/staff/onboarding', icon: <SafetyCertificateOutlined /> },
      { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
      { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
    ]

    const businessItems = [
      { key: 'dashboard', label: 'Dashboard', to: '/owner', icon: <DashboardOutlined /> },
      { key: 'permit-apps', label: 'Permit Applications', to: '/owner/permits', icon: <FileTextOutlined /> },
      { key: 'cessation', label: 'Cessation', to: '/owner/cessation', icon: <StopOutlined /> },
      { key: 'payments', label: 'Payments', to: '/owner/payments', icon: <CreditCardOutlined /> },
      { key: 'appeals', label: 'Appeals', to: '/owner/appeals', icon: <AuditOutlined /> },
      { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
      { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
    ]

    const perRole = {
      business: businessItems, // Backward compatibility
      business_owner: businessItems,
      admin: [
        { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: <DashboardOutlined /> },
        { key: 'admin-full', label: 'Admin — Full', to: '/admin/full', icon: <SafetyCertificateOutlined /> },
        { key: 'admin-users', label: 'User Management', to: '/admin/users', icon: <TeamOutlined /> },
        { key: 'maintenance', label: 'Maintenance', to: '/admin/maintenance', icon: <SafetyCertificateOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      staff: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'recovery', label: 'Request Recovery', to: '/staff/recovery-request', icon: <SafetyCertificateOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/staff/inspections', icon: <SolutionOutlined /> },
        { key: 'applications', label: 'Permit Applications (Review)', to: '/staff/applications', icon: <FileTextOutlined /> },
        { key: 'cessation', label: 'Cessation (Review)', to: '/staff/cessation', icon: <StopOutlined /> },
        { key: 'appeals', label: 'Appeals', to: '/staff/appeals', icon: <AuditOutlined /> },
        { key: 'reports', label: 'Reports / Analytics', to: '/staff/reports', icon: <BarChartOutlined /> },
        { key: 'support', label: 'Customer Support / Inquiry', to: '/staff/support', icon: <CustomerServiceOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      inspector: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/staff/inspections', icon: <SolutionOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      lgu_officer: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'applications', label: 'Permit Applications (Review)', to: '/staff/applications', icon: <FileTextOutlined /> },
        { key: 'cessation', label: 'Cessation (Review)', to: '/staff/cessation', icon: <StopOutlined /> },
        { key: 'inspections', label: 'Violations / Inspections', to: '/staff/inspections', icon: <SolutionOutlined /> },
        { key: 'appeals', label: 'Appeals', to: '/staff/appeals', icon: <AuditOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      lgu_manager: [
        { key: 'dashboard', label: 'Dashboard', to: '/lgu-manager', icon: <DashboardOutlined /> },
        { key: 'reports', label: 'Reports / Analytics', to: '/lgu-manager/reports', icon: <BarChartOutlined /> },
        { key: 'permit-applications', label: 'Permit Applications (Overview)', to: '/lgu-manager/permit-applications', icon: <FileTextOutlined /> },
        { key: 'cessation', label: 'Cessation (Overview)', to: '/lgu-manager/cessation', icon: <StopOutlined /> },
        { key: 'violations-inspections', label: 'Violations / Inspections (Overview)', to: '/lgu-manager/violations-inspections', icon: <SolutionOutlined /> },
        { key: 'appeals', label: 'Appeals (Overview)', to: '/lgu-manager/appeals', icon: <AuditOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      cso: [
        { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
        { key: 'support', label: 'Customer Support / Inquiry', to: '/staff/support', icon: <CustomerServiceOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
      user: [
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlined /> },
        { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
        { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
      ],
    }

    const roleKey = (role?.slug || role || 'user').toString().toLowerCase()
    const isStaffRole = ['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso'].includes(roleKey)
    if (isStaffRole && (currentUser?.mustChangeCredentials || currentUser?.mustSetupMfa)) {
      return staffOnboardingItems
    }
    const result = perRole[roleKey] || perRole.user
    return Array.isArray(result) ? result : []
  }, [role, currentUser])

  const [selected, setSelected] = useState(items[0]?.key ?? 'dashboard')

  const onSelect = ({ key }) => setSelected(key)

  return { items, selected, onSelect, role }
}
